import DataLoader from 'dataloader';
import { getRedisClient } from '../config/redis.js';
import { authService, userService } from '../services/index.js';
import logger from '../config/logger.js';

// Create DataLoader instances
const createDataLoaders = () => ({
  userLoader: new DataLoader(async (userIds) => {
    const User = (await import('../models/User.js')).default;
    const users = await User.find({ _id: { $in: userIds } })
      .select('-password -twoFactorSecret -twoFactorBackupCodes');
    
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });
    
    return userIds.map(id => userMap[id.toString()] || null);
  }),
  
  solutionLoader: new DataLoader(async (solutionIds) => {
    const Solution = (await import('../models/Solution.js')).default;
    const solutions = await Solution.find({ _id: { $in: solutionIds } })
      .populate('user', 'firstName lastName username avatar');
    
    const solutionMap = {};
    solutions.forEach(solution => {
      solutionMap[solution._id.toString()] = solution;
    });
    
    return solutionIds.map(id => solutionMap[id.toString()] || null);
  }),
  
  squadLoader: new DataLoader(async (squadIds) => {
    const Squad = (await import('../models/Squad.js')).default;
    const squads = await Squad.find({ _id: { $in: squadIds } })
      .populate('members', 'firstName lastName username avatar')
      .populate('createdBy', 'firstName lastName username avatar');
    
    const squadMap = {};
    squads.forEach(squad => {
      squadMap[squad._id.toString()] = squad;
    });
    
    return squadIds.map(id => squadMap[id.toString()] || null);
  })
});

// Create context for GraphQL
const createContext = async ({ req, connection }) => {
  // For WebSocket connections (subscriptions)
  if (connection) {
    return {
      ...connection.context,
      loaders: createDataLoaders(),
      redis: getRedisClient(),
      pubsub: connection.context.pubsub
    };
  }

  // For HTTP requests
  const context = {
    req,
    user: null,
    loaders: createDataLoaders(),
    redis: getRedisClient(),
    services: {
      authService,
      userService
    },
    logger,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  try {
    // Get token from headers
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Verify token
      const decoded = await authService.verifyToken(token);
      
      if (decoded) {
        // Get user from database
        const user = await userService.getUserById(decoded.userId);
        
        if (user && user.accountStatus === 'ACTIVE') {
          context.user = user;
          context.userId = user._id.toString();
          
          // Update user last active time
          await userService.updateUserLastActive(user._id);
        }
      }
    }
    
    // Get session ID if present
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      context.sessionId = sessionId;
    }
    
    // Get two-factor token if present
    const twoFactorToken = req.headers['x-two-factor-token'];
    if (twoFactorToken) {
      context.twoFactorToken = twoFactorToken;
    }
  } catch (error) {
    // Log authentication errors but don't throw
    logger.warn('Context creation error:', {
      error: error.message,
      path: req.path,
      ip: req.ip
    });
  }

  return context;
};

// Create subscription context
export const createSubscriptionContext = async (connectionParams, webSocket) => {
  try {
    const token = connectionParams?.token || 
                  connectionParams?.Authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Authentication required for subscriptions');
    }
    
    // Verify token
    const decoded = await authService.verifyToken(token);
    
    if (!decoded) {
      throw new Error('Invalid token');
    }
    
    // Get user from database
    const user = await userService.getUserById(decoded.userId);
    
    if (!user || user.accountStatus !== 'ACTIVE') {
      throw new Error('User not found or account not active');
    }
    
    // Update user last active time
    await userService.updateUserLastActive(user._id);
    
    return {
      user,
      userId: user._id.toString(),
      loaders: createDataLoaders(),
      redis: getRedisClient(),
      logger
    };
  } catch (error) {
    logger.error('Subscription context error:', error);
    throw error;
  }
};

export default createContext;