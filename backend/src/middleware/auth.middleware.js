import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/UserSession.js';
import { AppError } from '../errors/AppError.js';
import logger from '../config/logger.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    let token;
    
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    
    if (!token) {
      return next(new AppError('Authentication required', 401));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('+passwordChangedAt');
    
    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }
    
    // Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('Password was recently changed. Please login again.', 401));
    }
    
    // Check if account is active
    if (user.accountStatus !== 'ACTIVE') {
      let message = 'Account is not active';
      
      if (user.accountStatus === 'SUSPENDED') {
        message = `Account is suspended until ${user.suspensionEndsAt}`;
        if (user.suspensionReason) {
          message += `. Reason: ${user.suspensionReason}`;
        }
      } else if (user.accountStatus === 'BANNED') {
        message = 'Account has been banned';
      } else if (user.accountStatus === 'DEACTIVATED') {
        message = 'Account has been deactivated';
      }
      
      return next(new AppError(message, 403));
    }
    
    // Get current session if session ID is provided
    let session = null;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    
    if (sessionId) {
      session = await Session.findOne({
        sessionId,
        user: user._id,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });
      
      if (session) {
        // Update last accessed time
        session.updateLastAccessed();
      }
    }
    
    // Attach user and session to request
    req.user = user;
    req.sessionId = sessionId;
    req.session = session;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired', 401));
    }
    
    logger.error('Auth middleware error:', error);
    next(new AppError('Authentication failed', 401));
  }
};

export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    let token;
    
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    
    if (!token) {
      return next();
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('+passwordChangedAt');
    
    if (!user) {
      return next();
    }
    
    // Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return next();
    }
    
    // Check if account is active
    if (user.accountStatus !== 'ACTIVE') {
      return next();
    }
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    // If token is invalid, continue without authentication
    next();
  }
};

export const twoFactorMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    // Check if two-factor is enabled
    if (req.user.twoFactorEnabled) {
      // Get two-factor verification from header
      const twoFactorToken = req.headers['x-two-factor-token'];
      
      if (!twoFactorToken) {
        return next(new AppError('Two-factor authentication required', 401));
      }
      
      // Verify two-factor token
      const AuthService = require('../services/auth/auth.service.js').default;
      
      try {
        await AuthService.verifyTwoFactor(req.user._id, twoFactorToken, 'APP');
      } catch (error) {
        return next(new AppError('Invalid two-factor token', 401));
      }
    }
    
    next();
  } catch (error) {
    logger.error('Two-factor middleware error:', error);
    next(new AppError('Two-factor authentication failed', 401));
  }
};