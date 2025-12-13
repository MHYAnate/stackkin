// src/config/cors.js
import { createLogger } from '../utils/logger.util.js';

const logger = createLogger('CORS');

/**
 * Parse allowed origins from environment
 * @returns {string[]}
 */
const parseAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000';
  return origins.split(',').map((origin) => origin.trim());
};

/**
 * Allowed origins list
 */
const allowedOrigins = parseAllowedOrigins();

/**
 * Check if origin is allowed
 * @param {string} origin - Request origin
 * @returns {boolean}
 */
const isOriginAllowed = (origin) => {
  // Allow requests with no origin (like mobile apps or curl)
  if (!origin) return true;

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) return true;

  // Check for wildcard patterns
  for (const allowed of allowedOrigins) {
    if (allowed === '*') return true;
    if (allowed.includes('*')) {
      const pattern = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
      if (pattern.test(origin)) return true;
    }
  }

  return false;
};

/**
 * CORS options for Express
 */
export const corsOptions = {
  /**
   * Dynamic origin validation
   * @param {string} origin - Request origin
   * @param {Function} callback - Callback function
   */
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },

  /**
   * Allowed HTTP methods
   */
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  /**
   * Allowed headers
   */
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-CSRF-Token',
    'X-Request-ID',
    'Apollo-Require-Preflight',
  ],

  /**
   * Headers exposed to the client
   */
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Content-Disposition',
  ],

  /**
   * Allow credentials (cookies, authorization headers)
   */
  credentials: true,

  /**
   * Preflight request cache duration (24 hours)
   */
  maxAge: 86400,

  /**
   * Handle preflight successfully
   */
  preflightContinue: false,

  /**
   * Success status for preflight
   */
  optionsSuccessStatus: 204,
};

/**
 * CORS options for GraphQL endpoint
 */
export const graphqlCorsOptions = {
  ...corsOptions,
  origin: (origin, callback) => {
    // GraphQL playground/introspection might not have origin in development
    if (process.env.NODE_ENV === 'development' && !origin) {
      callback(null, true);
      return;
    }
    
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      logger.warn(`GraphQL CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
};

/**
 * CORS options for WebSocket connections
 */
export const socketCorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Socket CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
};

/**
 * CORS options for file uploads
 */
export const uploadCorsOptions = {
  ...corsOptions,
  allowedHeaders: [
    ...corsOptions.allowedHeaders,
    'Content-Length',
    'Content-Disposition',
    'X-Upload-Content-Type',
    'X-Upload-Content-Length',
  ],
};

/**
 * CORS options for webhook endpoints (allow all origins)
 */
export const webhookCorsOptions = {
  origin: true,
  methods: ['POST'],
  allowedHeaders: [
    'Content-Type',
    'X-Webhook-Signature',
    'Zainpay-Signature',
  ],
  credentials: false,
};

/**
 * Get allowed origins list
 * @returns {string[]}
 */
export const getAllowedOrigins = () => allowedOrigins;

/**
 * Add origin to allowed list at runtime
 * @param {string} origin - Origin to add
 */
export const addAllowedOrigin = (origin) => {
  if (!allowedOrigins.includes(origin)) {
    allowedOrigins.push(origin);
    logger.info(`Added origin to CORS whitelist: ${origin}`);
  }
};

/**
 * Remove origin from allowed list at runtime
 * @param {string} origin - Origin to remove
 */
export const removeAllowedOrigin = (origin) => {
  const index = allowedOrigins.indexOf(origin);
  if (index > -1) {
    allowedOrigins.splice(index, 1);
    logger.info(`Removed origin from CORS whitelist: ${origin}`);
  }
};

/**
 * CORS error handler middleware
 * @param {Error} err - CORS error
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    logger.warn(`CORS error for origin: ${req.headers.origin}, path: ${req.path}`);
    return res.status(403).json({
      success: false,
      error: 'CORS_ERROR',
      message: 'Cross-Origin Request Blocked',
    });
  }
  next(err);
};

/**
 * CORS configuration export
 */
export const corsConfig = {
  options: corsOptions,
  graphqlOptions: graphqlCorsOptions,
  socketOptions: socketCorsOptions,
  uploadOptions: uploadCorsOptions,
  webhookOptions: webhookCorsOptions,
  getAllowedOrigins,
  addAllowedOrigin,
  removeAllowedOrigin,
  errorHandler: corsErrorHandler,
  isOriginAllowed,
};

export default corsConfig;