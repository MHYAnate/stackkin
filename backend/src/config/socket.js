import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from './logger.js';
import { getRedisClient } from './redis.js';
import User from '../models/User.js';

// Socket.IO server instance
let io = null;

// Online users tracking
const onlineUsers = new Map(); // userId -> socketId[]
const userRooms = new Map(); // userId -> room names

// Initialize Socket.IO server
export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    maxHttpBufferSize: 1e8 // 100MB for file transfers
  });

  // Socket.IO middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      if (user.accountStatus !== 'ACTIVE') {
        return next(new Error('Account is not active'));
      }

      // Attach user to socket
      socket.user = user;
      socket.userId = user._id.toString();
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.userId;
    const user = socket.user;

    logger.info(`Socket connected: ${socket.id} - User: ${userId}`);

    // Track online user
    addOnlineUser(userId, socket.id);

    // Join user to their personal room
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    addUserRoom(userId, userRoom);

    // Join user to their squads
    joinUserSquads(socket, user);

    // Emit connection event
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      timestamp: new Date().toISOString()
    });

    // Broadcast user online status
    socket.broadcast.emit('user:online', {
      userId,
      username: user.username,
      fullName: user.fullName,
      timestamp: new Date().toISOString()
    });

    // Update user last active time
    updateUserLastActive(userId);

    // Handle disconnection
    socket.on('disconnect', () => {
      handleDisconnection(socket, userId);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', { socketId: socket.id, userId, error });
    });

    // Custom event handlers
    setupEventHandlers(socket);
  });

  logger.info('Socket.IO server initialized');
  return io;
};

// Get Socket.IO instance
export const getSocketServer = () => {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }
  return io;
};

// Add online user
const addOnlineUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, []);
  }
  onlineUsers.get(userId).push(socketId);

  // Store in Redis for distributed systems
  const redis = getRedisClient();
  redis.sadd('online:users', userId);
  redis.setex(`socket:${socketId}:user`, 3600, userId);
};

// Remove online user
const removeOnlineUser = (userId, socketId) => {
  if (onlineUsers.has(userId)) {
    const sockets = onlineUsers.get(userId);
    const index = sockets.indexOf(socketId);
    
    if (index > -1) {
      sockets.splice(index, 1);
    }
    
    if (sockets.length === 0) {
      onlineUsers.delete(userId);
      
      // Remove from Redis
      const redis = getRedisClient();
      redis.srem('online:users', userId);
    }
  }

  // Remove socket mapping from Redis
  const redis = getRedisClient();
  redis.del(`socket:${socketId}:user`);
};

// Add user room
const addUserRoom = (userId, roomName) => {
  if (!userRooms.has(userId)) {
    userRooms.set(userId, []);
  }
  userRooms.get(userId).push(roomName);
};

// Join user to their squads
const joinUserSquads = async (socket, user) => {
  try {
    const Squad = (await import('../models/Squad.js')).default;
    const squads = await Squad.find({ members: user._id }).select('_id');
    
    squads.forEach(squad => {
      const squadRoom = `squad:${squad._id}`;
      socket.join(squadRoom);
      addUserRoom(user._id.toString(), squadRoom);
    });
  } catch (error) {
    logger.error('Error joining squad rooms:', error);
  }
};

// Update user last active time
const updateUserLastActive = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      lastActiveAt: new Date()
    });
  } catch (error) {
    logger.error('Error updating user last active:', error);
  }
};

// Handle disconnection
const handleDisconnection = (socket, userId) => {
  logger.info(`Socket disconnected: ${socket.id} - User: ${userId}`);

  // Remove from online users
  removeOnlineUser(userId, socket.id);

  // Leave all rooms
  if (userRooms.has(userId)) {
    userRooms.get(userId).forEach(room => {
      socket.leave(room);
    });
    userRooms.delete(userId);
  }

  // Broadcast user offline status if no more sockets
  if (!onlineUsers.has(userId)) {
    socket.broadcast.emit('user:offline', {
      userId,
      timestamp: new Date().toISOString()
    });
  }
};

// Setup custom event handlers
const setupEventHandlers = (socket) => {
  // Typing indicators
  socket.on('typing:start', (data) => {
    const { chatId, userId } = data;
    socket.to(`chat:${chatId}`).emit('typing:start', {
      chatId,
      userId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('typing:stop', (data) => {
    const { chatId, userId } = data;
    socket.to(`chat:${chatId}`).emit('typing:stop', {
      chatId,
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // Presence updates
  socket.on('presence:update', (data) => {
    const { status, customStatus } = data;
    socket.broadcast.emit('presence:updated', {
      userId: socket.userId,
      status,
      customStatus,
      timestamp: new Date().toISOString()
    });
  });

  // Join chat room
  socket.on('chat:join', (chatId) => {
    const roomName = `chat:${chatId}`;
    socket.join(roomName);
    addUserRoom(socket.userId, roomName);
    
    logger.info(`User ${socket.userId} joined chat room: ${chatId}`);
  });

  // Leave chat room
  socket.on('chat:leave', (chatId) => {
    const roomName = `chat:${chatId}`;
    socket.leave(roomName);
    
    // Remove from user rooms
    if (userRooms.has(socket.userId)) {
      const rooms = userRooms.get(socket.userId);
      const index = rooms.indexOf(roomName);
      if (index > -1) {
        rooms.splice(index, 1);
      }
    }
    
    logger.info(`User ${socket.userId} left chat room: ${chatId}`);
  });

  // Join notification room
  socket.on('notifications:join', () => {
    const roomName = `notifications:${socket.userId}`;
    socket.join(roomName);
    addUserRoom(socket.userId, roomName);
  });
};

// Emit to specific user
export const emitToUser = (userId, event, data) => {
  if (!io) return false;

  const sockets = onlineUsers.get(userId);
  if (sockets && sockets.length > 0) {
    sockets.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
    return true;
  }
  return false;
};

// Emit to room
export const emitToRoom = (roomName, event, data) => {
  if (!io) return false;
  io.to(roomName).emit(event, data);
  return true;
};

// Broadcast to all except sender
export const broadcast = (event, data, excludeSocketId = null) => {
  if (!io) return false;
  
  if (excludeSocketId) {
    io.except(excludeSocketId).emit(event, data);
  } else {
    io.emit(event, data);
  }
  return true;
};

// Get online users count
export const getOnlineUsersCount = () => {
  return onlineUsers.size;
};

// Get online users list
export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

// Check if user is online
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

// Cleanup function
export const cleanupSocketServer = () => {
  if (io) {
    io.close();
    io = null;
    onlineUsers.clear();
    userRooms.clear();
    logger.info('Socket.IO server cleaned up');
  }
};

export default initSocketServer;