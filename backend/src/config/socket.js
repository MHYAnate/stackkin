// src/config/socket.js
import { Server } from 'socket.io';
import { createLogger } from '../utils/logger.util.js';
import { verifyAccessToken } from '../utils/jwt.util.js';
import { socketCorsOptions } from './cors.js';
import { getRedisClient } from './redis.js';

const logger = createLogger('Socket');

/**
 * Socket.IO server instance
 */
let io = null;

/**
 * Socket.IO configuration options
 */
const socketOptions = {
  cors: socketCorsOptions,
  path: process.env.SOCKET_PATH || '/socket.io',
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6, // 1MB
  allowUpgrades: true,
  perMessageDeflate: {
    threshold: 1024,
  },
  httpCompression: true,
  cookie: {
    name: 'stackkin_io',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  },
};

/**
 * Socket event names
 */
export const socketEvents = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Authentication events
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  AUTHENTICATION_ERROR: 'authentication_error',

  // Chat events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING: 'user_typing',

  // Presence events
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_STATUS_CHANGE: 'user_status_change',
  GET_ONLINE_USERS: 'get_online_users',
  ONLINE_USERS: 'online_users',

  // Notification events
  NEW_NOTIFICATION: 'new_notification',
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATIONS_CLEARED: 'notifications_cleared',

  // Activity events
  NEW_SOLUTION: 'new_solution',
  SOLUTION_UPDATED: 'solution_updated',
  NEW_JOB: 'new_job',
  JOB_UPDATED: 'job_updated',
  NEW_LISTING: 'new_listing',
  LISTING_UPDATED: 'listing_updated',
  NEW_APPLICATION: 'new_application',
  APPLICATION_UPDATED: 'application_updated',

  // Squad events
  SQUAD_INVITE: 'squad_invite',
  SQUAD_MEMBER_JOINED: 'squad_member_joined',
  SQUAD_MEMBER_LEFT: 'squad_member_left',

  // Admin events
  ADMIN_BROADCAST: 'admin_broadcast',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
};

/**
 * Room prefixes
 */
export const roomPrefixes = {
  USER: 'user:',
  CHAT: 'chat:',
  COUNTRY: 'country:',
  LANGUAGE: 'language:',
  CATEGORY: 'category:',
  SQUAD: 'squad:',
  PREMIUM: 'premium',
  ADMIN: 'admin',
};

/**
 * Online users tracking
 */
const onlineUsers = new Map();

/**
 * Socket authentication middleware
 * @param {Socket} socket - Socket instance
 * @param {Function} next - Next function
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow connection but mark as unauthenticated
      socket.data.authenticated = false;
      socket.data.user = null;
      return next();
    }

    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      socket.data.authenticated = false;
      socket.data.user = null;
      return next();
    }

    socket.data.authenticated = true;
    socket.data.user = decoded;
    socket.data.userId = decoded.userId;
    
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    socket.data.authenticated = false;
    socket.data.user = null;
    next();
  }
};

/**
 * Initialize Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Server}
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, socketOptions);

  // Apply authentication middleware
  io.use(authenticateSocket);

  // Connection handler
  io.on(socketEvents.CONNECTION, (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Handle authenticated users
    if (socket.data.authenticated && socket.data.userId) {
      handleUserConnection(socket);
    }

    // Handle authentication after connection
    socket.on(socketEvents.AUTHENTICATE, async (data) => {
      await handleAuthentication(socket, data);
    });

    // Handle disconnection
    socket.on(socketEvents.DISCONNECT, (reason) => {
      handleDisconnection(socket, reason);
    });

    // Handle errors
    socket.on(socketEvents.ERROR, (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
};

/**
 * Handle user connection
 * @param {Socket} socket - Socket instance
 */
const handleUserConnection = (socket) => {
  const userId = socket.data.userId;
  
  // Join user's personal room
  socket.join(`${roomPrefixes.USER}${userId}`);
  
  // Track online user
  onlineUsers.set(userId, {
    socketId: socket.id,
    connectedAt: new Date(),
    lastActivity: new Date(),
  });

  // Broadcast user online status
  socket.broadcast.emit(socketEvents.USER_ONLINE, { userId });
  
  logger.info(`User ${userId} connected via socket ${socket.id}`);
};

/**
 * Handle post-connection authentication
 * @param {Socket} socket - Socket instance
 * @param {Object} data - Authentication data
 */
const handleAuthentication = async (socket, data) => {
  try {
    const { token } = data;

    if (!token) {
      socket.emit(socketEvents.AUTHENTICATION_ERROR, { message: 'Token required' });
      return;
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      socket.emit(socketEvents.AUTHENTICATION_ERROR, { message: 'Invalid token' });
      return;
    }

    socket.data.authenticated = true;
    socket.data.user = decoded;
    socket.data.userId = decoded.userId;

    handleUserConnection(socket);

    socket.emit(socketEvents.AUTHENTICATED, { 
      userId: decoded.userId,
      message: 'Authentication successful' 
    });
  } catch (error) {
    logger.error('Socket authentication error:', error);
    socket.emit(socketEvents.AUTHENTICATION_ERROR, { message: 'Authentication failed' });
  }
};

/**
 * Handle socket disconnection
 * @param {Socket} socket - Socket instance
 * @param {string} reason - Disconnection reason
 */
const handleDisconnection = (socket, reason) => {
  const userId = socket.data.userId;
  
  if (userId) {
    onlineUsers.delete(userId);
    socket.broadcast.emit(socketEvents.USER_OFFLINE, { userId });
  }

  logger.info(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
};

/**
 * Get Socket.IO server instance
 * @returns {Server|null}
 */
export const getIO = () => io;

/**
 * Emit event to specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`${roomPrefixes.USER}${userId}`).emit(event, data);
};

/**
 * Emit event to room
 * @param {string} room - Room name
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emitToRoom = (room, event, data) => {
  if (!io) return;
  io.to(room).emit(event, data);
};

/**
 * Emit event to all connected clients
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const broadcast = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

/**
 * Get online users
 * @returns {Map}
 */
export const getOnlineUsers = () => onlineUsers;

/**
 * Check if user is online
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const isUserOnline = (userId) => onlineUsers.has(userId);

/**
 * Get user's socket ID
 * @param {string} userId - User ID
 * @returns {string|null}
 */
export const getUserSocketId = (userId) => {
  const userData = onlineUsers.get(userId);
  return userData?.socketId || null;
};

/**
 * Join user to rooms based on their permissions
 * @param {string} userId - User ID
 * @param {Object} user - User object with roles and permissions
 */
export const joinUserRooms = (userId, user) => {
  if (!io) return;

  const socket = io.sockets.sockets.get(getUserSocketId(userId));
  if (!socket) return;

  // Join country room
  if (user.country) {
    socket.join(`${roomPrefixes.COUNTRY}${user.country}`);
  }

  // Join squad rooms
  if (user.squadIds?.length) {
    user.squadIds.forEach((squadId) => {
      socket.join(`${roomPrefixes.SQUAD}${squadId}`);
    });
  }

  // Join premium room if applicable
  if (user.subscriptionTier && user.subscriptionTier !== 'free') {
    socket.join(roomPrefixes.PREMIUM);
  }

  // Join admin room if applicable
  if (user.role && user.role !== 'user') {
    socket.join(roomPrefixes.ADMIN);
  }
};

/**
 * Remove user from all rooms
 * @param {string} userId - User ID
 */
export const leaveAllRooms = (userId) => {
  if (!io) return;

  const socketId = getUserSocketId(userId);
  if (!socketId) return;

  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return;

  const rooms = socket.rooms;
  rooms.forEach((room) => {
    if (room !== socket.id) {
      socket.leave(room);
    }
  });
};

/**
 * Get room members count
 * @param {string} room - Room name
 * @returns {number}
 */
export const getRoomMembersCount = async (room) => {
  if (!io) return 0;
  const sockets = await io.in(room).fetchSockets();
  return sockets.length;
};

/**
 * Socket health check
 * @returns {Object}
 */
export const checkSocketHealth = () => {
  if (!io) {
    return {
      status: 'not_initialized',
      healthy: false,
    };
  }

  return {
    status: 'running',
    healthy: true,
    connectedClients: io.engine.clientsCount,
    onlineUsers: onlineUsers.size,
  };
};

/**
 * Socket configuration export
 */
export const socketConfig = {
  initialize: initializeSocket,
  getIO,
  events: socketEvents,
  roomPrefixes,
  emitToUser,
  emitToRoom,
  broadcast,
  getOnlineUsers,
  isUserOnline,
  getUserSocketId,
  joinUserRooms,
  leaveAllRooms,
  getRoomMembersCount,
  healthCheck: checkSocketHealth,
};

export default socketConfig;