import { Server } from 'socket.io';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { typeDefs } from '../graphql/schema/index.js';
import { resolvers } from '../graphql/resolvers/index.js';
import { subscriptionResolvers } from '../graphql/subscriptions/index.js';
import { createContext, createSubscriptionContext } from '../graphql/context.js';
import authSocketMiddleware from './middleware/auth.socket.js';
import logger from '../config/logger.js';

export const setupSocketServer = (expressApp) => {
  const httpServer = createServer(expressApp);
  
  // Create WebSocket server for GraphQL subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  });
  
  // Create executable schema including subscriptions
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: {
      ...resolvers,
      ...subscriptionResolvers
    }
  });
  
  // Setup GraphQL WebSocket server
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        return await createSubscriptionContext(ctx.connectionParams, ctx.extra.socket);
      },
      onConnect: async (ctx) => {
        logger.info('WebSocket connected');
      },
      onDisconnect: async (ctx) => {
        logger.info('WebSocket disconnected');
      },
      onError: (ctx, message, errors) => {
        logger.error('WebSocket error:', { message, errors });
      }
    },
    wsServer
  );
  
  // Setup Socket.IO for real-time notifications
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    },
    path: process.env.SOCKET_PATH || '/socket.io'
  });
  
  // Apply authentication middleware
  io.use(authSocketMiddleware);
  
  // Setup Socket.IO event handlers
  setupSocketHandlers(io);
  
  return { httpServer, io, wsServer, serverCleanup };
};

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    const userRole = socket.user?.role;
    
    if (userId) {
      logger.info(`Socket connected: ${socket.id} (User: ${userId})`);
      
      // Join user-specific room
      socket.join(`user:${userId}`);
      
      // Join admin room if admin
      if (['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        socket.join('admin');
      }
      
      // Setup disconnect handler
      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id} (User: ${userId})`);
      });
      
      // Setup custom event handlers
      socket.on('join:room', (roomId) => {
        socket.join(roomId);
        logger.info(`Socket ${socket.id} joined room: ${roomId}`);
      });
      
      socket.on('leave:room', (roomId) => {
        socket.leave(roomId);
        logger.info(`Socket ${socket.id} left room: ${roomId}`);
      });
      
      // Payment status updates
      socket.on('payment:subscribe', (paymentId) => {
        socket.join(`payment:${paymentId}`);
      });
      
      socket.on('payment:unsubscribe', (paymentId) => {
        socket.leave(`payment:${paymentId}`);
      });
      
      // Chat events
      socket.on('chat:join', (chatId) => {
        socket.join(`chat:${chatId}`);
      });
      
      socket.on('chat:leave', (chatId) => {
        socket.leave(`chat:${chatId}`);
      });
    } else {
      logger.warn(`Unauthenticated socket connected: ${socket.id}`);
      socket.disconnect(true);
    }
  });
};

// Helper function to emit events
export const emitPaymentStatusUpdate = (io, paymentId, paymentData) => {
  io.to(`payment:${paymentId}`).emit('payment:status:update', paymentData);
  io.to(`user:${paymentData.userId}`).emit('payment:status:update', paymentData);
};

export const emitWalletUpdate = (io, userId, walletData) => {
  io.to(`user:${userId}`).emit('wallet:update', walletData);
};

export const emitNewNotification = (io, userId, notificationData) => {
  io.to(`user:${userId}`).emit('notification:new', notificationData);
};

export const emitAdminAlert = (io, alertData) => {
  io.to('admin').emit('admin:alert', alertData);
};

export default setupSocketServer;