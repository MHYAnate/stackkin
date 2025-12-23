import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// Configurations
import config from './config/index.js';
import logger, { requestLogger } from './config/logger.js';
import corsMiddleware from './config/cors.js';
import connectDatabase from './config/database.js';
import { initRedis, closeRedis } from './config/redis.js';
import { initSocketServer } from './config/socket.js';

// Middleware
import { errorHandler, notFoundHandler, globalErrorHandler } from './middleware/errorHandler.middleware.js';
import { sanitizeInput } from './middleware/validator.middleware.js';
import { adTrackingMiddleware } from './middleware/adTracking.middleware.js';

// Routes
import routes, { logRoutes } from './routes/index.js';

// Jobs
import analyticsJob from './jobs/analytics.job.js';
import advertisementJob from './jobs/advertisement.job.js';

// Import GraphQL components
import typeDefs from './graphql/schema/index.js';
import resolvers from './graphql/resolvers/index.js';
import createContext, { createSubscriptionContext } from './graphql/context.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Global error handler
globalErrorHandler();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Ad tracking middleware
app.use(adTrackingMiddleware);

// CORS
app.use(corsMiddleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", "data:", "https:", "blob:"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'frame-src': ["'self'", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: logger.stream }));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}
app.use(requestLogger);

// Input sanitization
app.use(sanitizeInput);

// Static files (for uploaded files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    // Security headers for static files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Cache control
    if (filePath.endsWith('.jpg') || filePath.endsWith('.png') || filePath.endsWith('.gif')) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day for images
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for other files
    }
  }
}));

// API routes
app.use(routes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Stackkin API',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize services
export const initializeApp = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Initialize Redis
    initRedis();
    
    // Log registered routes
    logRoutes();
    
    // Start background jobs
    if (process.env.NODE_ENV !== 'test') {
      advertisementJob.start();
      analyticsJob.start();
    }
    
    logger.info('Application initialized successfully');
    
    return app;
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Server variables
let apolloServer = null;
let httpServer = null;
let wsServer = null;
let io = null;
let serverCleanup = null;

// Create and configure servers
export const createServer = async () => {
  try {
    // Create HTTP server
    httpServer = createServer(app);
    
    // Create WebSocket server for GraphQL subscriptions
    wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
      handleProtocols: (protocols) => {
        return protocols.includes('graphql-ws') ? 'graphql-ws' : false;
      }
    });

    // Create executable GraphQL schema
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    });

    // Create PubSub instance for subscriptions
    const pubsub = new PubSub();

    // Setup WebSocket server for GraphQL subscriptions
    serverCleanup = useServer(
      {
        schema,
        context: async (ctx) => {
          const context = await createSubscriptionContext(ctx.connectionParams, ctx.extra.socket);
          return {
            ...context,
            pubsub
          };
        },
        onConnect: async (ctx) => {
          logger.info('GraphQL WebSocket connected', {
            connectionParams: ctx.connectionParams
          });
        },
        onDisconnect: (ctx) => {
          logger.info('GraphQL WebSocket disconnected');
        },
        onError: (ctx, message, errors) => {
          logger.error('GraphQL WebSocket error:', { message, errors });
        }
      },
      wsServer
    );

    // Create Apollo Server
    apolloServer = new ApolloServer({
      schema,
      context: async ({ req, connection }) => {
        const context = await createContext({ req, connection });
        return {
          ...context,
          pubsub
        };
      },
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              }
            };
          }
        },
        {
          async requestDidStart() {
            return {
              async willSendResponse({ response }) {
                if (process.env.NODE_ENV === 'production') {
                  if (response.errors) {
                    response.errors = response.errors.filter(
                      error => error.message !== 'Introspection is disabled'
                    );
                  }
                }
              }
            };
          }
        }
      ],
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production',
      formatError: (error) => {
        logger.error('GraphQL Error:', {
          message: error.message,
          path: error.path,
          locations: error.locations,
          extensions: error.extensions,
          originalError: error.originalError
        });

        if (process.env.NODE_ENV === 'production') {
          delete error.extensions?.exception?.stacktrace;
          
          if (error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
            return {
              message: 'Internal server error',
              locations: error.locations,
              path: error.path,
              extensions: {
                code: 'INTERNAL_SERVER_ERROR'
              }
            };
          }
        }

        return error;
      },
      formatResponse: (response, context) => {
        const operationName = context.operationName;
        const requestDuration = context.request.duration;
        
        if (requestDuration > 2000) {
          logger.warn('Slow GraphQL query detected', {
            operationName,
            duration: requestDuration,
            query: context.request.query?.substring(0, 200)
          });
        }

        return response;
      },
      validationRules: [
        require('graphql-depth-limit')(10)
      ],
      cache: 'bounded',
      persistedQueries: process.env.NODE_ENV === 'production' ? {
        ttl: 900,
        cache: 'bounded'
      } : false
    });

    // Initialize Socket.IO server
    io = initSocketServer(httpServer);

    return { httpServer, apolloServer, io };
  } catch (error) {
    logger.error('Failed to create server:', error);
    throw error;
  }
};

// Start server function
export const startServer = async () => {
  try {
    // Initialize the app
    await initializeApp();
    
    // Create and configure servers
    await createServer();
    
    // Start Apollo Server
    await apolloServer.start();
    
    // Apply Apollo middleware to Express app
    apolloServer.applyMiddleware({
      app,
      cors: false,
      path: '/graphql',
      bodyParserConfig: {
        limit: '10mb'
      }
    });

    // Start HTTP server
    const server = httpServer.listen(config.port, () => {
      const address = server.address();
      const host = address.address === '::' ? 'localhost' : address.address;
      const port = address.port;
      
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║                   Stackkin Server Started                  ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  🌐 Server URL:    http://${host}:${port}                  ${' '.repeat(30 - host.length - port.toString().length)}
║  🚀 GraphQL:       http://${host}:${port}${apolloServer.graphqlPath}    ${' '.repeat(26 - host.length - port.toString().length)}
║  📡 Subscriptions: ws://${host}:${port}${apolloServer.graphqlPath}      ${' '.repeat(25 - host.length - port.toString().length)}
║  💬 Socket.IO:     http://${host}:${port}                  ${' '.repeat(30 - host.length - port.toString().length)}
║                                                            ║
║  📊 Environment:   ${config.nodeEnv.padEnd(35)} ║
║  💾 Redis:         ${config.redisUrl ? 'Connected' : 'Disabled'.padEnd(35)} ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
      
      logger.info(`Health check available at: http://${host}:${port}/health`);
      
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`GraphQL Playground: http://${host}:${port}${apolloServer.graphqlPath}`);
      }
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    // Setup server monitoring
    setupServerMonitoring(server);

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Setup graceful shutdown
function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    const shutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded. Forcing exit.');
      process.exit(1);
    }, 30000);

    try {
      // Close HTTP server
      server.close(async () => {
        logger.info('HTTP server closed');
      });

      // Close WebSocket server
      if (serverCleanup) {
        await serverCleanup.dispose();
        logger.info('WebSocket server closed');
      }

      // Close Apollo Server
      if (apolloServer) {
        await apolloServer.stop();
        logger.info('Apollo Server stopped');
      }

      // Close Socket.IO server
      if (io) {
        io.close();
        logger.info('Socket.IO server closed');
      }

      // Close Redis connections
      await closeRedis();
      logger.info('Redis connections closed');

      // Close database connection
      const mongoose = await import('mongoose');
      await mongoose.disconnect();
      logger.info('Database disconnected');

      // Stop background jobs
      advertisementJob.stop();
      analyticsJob.stop();
      logger.info('Background jobs stopped');

      clearTimeout(shutdownTimeout);
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  };

  // Handle termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

// Server status monitoring
function setupServerMonitoring(server) {
  if (process.env.NODE_ENV === 'production') {
    // Monitor memory usage
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      };

      if (memoryUsageMB.heapUsed > 500) {
        logger.warn('High memory usage detected:', memoryUsageMB);
      }
    }, 60000);

    // Monitor active connections
    setInterval(() => {
      server.getConnections((err, count) => {
        if (!err) {
          if (count > 1000) {
            logger.warn('High number of active connections:', count);
          }
          logger.debug(`Active connections: ${count}`);
        }
      });
    }, 30000);
  }
}

// Export for testing and programmatic usage
export default app;
export { apolloServer, httpServer, io };

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}