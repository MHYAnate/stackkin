import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';

// Import configurations
import config from './config/index.js';
import logger from './config/logger.js';
import connectDatabase from './config/database.js';
import { initRedis } from './config/redis.js';
import { initSocketServer } from './config/socket.js';

// Import GraphQL components
import typeDefs from './graphql/schema/index.js';
import resolvers from './graphql/resolvers/index.js';
import createContext, { createSubscriptionContext } from './graphql/context.js';

// Import the Express app
import app, { initializeApp } from './app.js';

// Create HTTP server
const httpServer = createServer(app);

// Create WebSocket server for GraphQL subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
  // CORS configuration for WebSocket
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
const serverCleanup = useServer(
  {
    schema,
    context: async (ctx) => {
      // Create context for WebSocket connections
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
const apolloServer = new ApolloServer({
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
    // Add introspection only in non-production environments
    {
      async requestDidStart() {
        return {
          async willSendResponse({ response }) {
            if (process.env.NODE_ENV === 'production') {
              // Remove introspection from production
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
    // Log all GraphQL errors
    logger.error('GraphQL Error:', {
      message: error.message,
      path: error.path,
      locations: error.locations,
      extensions: error.extensions,
      originalError: error.originalError
    });

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production') {
      // Hide stack traces in production
      delete error.extensions?.exception?.stacktrace;
      
      // Generic error message for internal errors
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
    // Log slow queries (more than 2 seconds)
    const operationName = context.operationName;
    const requestDuration = context.request.duration;
    
    if (requestDuration > 2000) {
      logger.warn('Slow GraphQL query detected', {
        operationName,
        duration: requestDuration,
        query: context.request.query?.substring(0, 200) // Log first 200 chars
      });
    }

    return response;
  },
  // Security features
  validationRules: [
    // Limit query depth to prevent overly complex queries
    require('graphql-depth-limit')(10),
    // Disable introspection in production (handled by introspection flag)
  ],
  cache: 'bounded',
  persistedQueries: process.env.NODE_ENV === 'production' ? {
    ttl: 900, // 15 minutes
    cache: 'bounded'
  } : false
});

// Initialize Socket.IO server
const io = initSocketServer(httpServer);

// Start server function
async function startServer() {
  try {
    // Initialize the app (database, Redis, etc.)
    await initializeApp();
    
    // Start Apollo Server
    await apolloServer.start();
    
    // Apply Apollo middleware to Express app
    apolloServer.applyMiddleware({
      app,
      cors: false, // CORS already handled by Express middleware
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
║  🗄️  Database:      ${mongoose.connection.name.padEnd(35)} ║
║  🔐 Redis:         ${config.redisUrl ? 'Connected' : 'Disabled'.padEnd(35)} ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
      
      // Log health check URL
      logger.info(`Health check available at: http://${host}:${port}/health`);
      
      // Log API documentation URL
      logger.info(`API Documentation: http://${host}:${port}/docs`);
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Setup graceful shutdown
function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    // Start shutdown timeout
    const shutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded. Forcing exit.');
      process.exit(1);
    }, 30000); // 30 seconds timeout

    try {
      // Close HTTP server
      server.close(async () => {
        logger.info('HTTP server closed');
      });

      // Close WebSocket server
      await serverCleanup.dispose();
      logger.info('WebSocket server closed');

      // Close Apollo Server
      await apolloServer.stop();
      logger.info('Apollo Server stopped');

      // Close Socket.IO server
      if (io) {
        io.close();
        logger.info('Socket.IO server closed');
      }

      // Close Redis connections
      const { closeRedis } = await import('./config/redis.js');
      await closeRedis();
      logger.info('Redis connections closed');

      // Close database connection
      const mongoose = await import('mongoose');
      await mongoose.disconnect();
      logger.info('Database disconnected');

      // Clear timeout and exit
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

      if (memoryUsageMB.heapUsed > 500) { // 500MB threshold
        logger.warn('High memory usage detected:', memoryUsageMB);
      }
    }, 60000); // Check every minute

    // Monitor active connections
    setInterval(() => {
      server.getConnections((err, count) => {
        if (!err) {
          if (count > 1000) { // 1000 connections threshold
            logger.warn('High number of active connections:', count);
          }
          logger.debug(`Active connections: ${count}`);
        }
      });
    }, 30000); // Check every 30 seconds
  }
}

// Initialize and start the server
startServer();

// Export for testing
export { apolloServer, httpServer, io };