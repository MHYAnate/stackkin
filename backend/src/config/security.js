// src/config/security.js
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import { createLogger } from '../utils/logger.util.js';
import { getRedisClient } from './redis.js';

const logger = createLogger('Security');

/**
 * Helmet security configuration
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://dev.zainpay.ng', 'https://api.zainpay.ng'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: [
        "'self'",
        process.env.FRONTEND_URL,
        'https://dev.zainpay.ng',
        'https://api.zainpay.ng',
        'wss:',
        'ws:',
      ],
      frameSrc: ["'self'", 'https://dev.zainpay.ng', 'https://api.zainpay.ng'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },

  // Cross-Origin configurations
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: true },

  // Expect-CT (Certificate Transparency)
  expectCt: {
    maxAge: 86400,
    enforce: true,
  },

  // Frameguard (clickjacking protection)
  frameguard: { action: 'sameorigin' },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open
  ieNoOpen: true,

  // No Sniff (prevent MIME type sniffing)
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // XSS Filter
  xssFilter: true,
});

/**
 * Rate limit configurations
 */
export const rateLimitConfigs = {
  /**
   * General API rate limit
   */
  general: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',
    keyGenerator: (req) => {
      return req.ip || req.headers['x-forwarded-for'] || 'unknown';
    },
  },

  /**
   * Authentication rate limit (stricter)
   */
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
      success: false,
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  },

  /**
   * Password reset rate limit
   */
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
      success: false,
      error: 'PASSWORD_RESET_RATE_LIMIT',
      message: 'Too many password reset attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  /**
   * File upload rate limit
   */
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    message: {
      success: false,
      error: 'UPLOAD_RATE_LIMIT',
      message: 'Too many file uploads, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  /**
   * GraphQL rate limit
   */
  graphql: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: {
      success: false,
      error: 'GRAPHQL_RATE_LIMIT',
      message: 'Too many GraphQL requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  /**
   * Verification request rate limit
   */
  verification: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5,
    message: {
      success: false,
      error: 'VERIFICATION_RATE_LIMIT',
      message: 'Too many verification requests, please try again tomorrow.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  /**
   * Payment initialization rate limit
   */
  payment: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    message: {
      success: false,
      error: 'PAYMENT_RATE_LIMIT',
      message: 'Too many payment attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },
};

/**
 * Create Redis-backed rate limiter store
 * @returns {Object|undefined}
 */
const createRedisStore = () => {
  const client = getRedisClient();
  
  if (!client) {
    logger.warn('Redis not available, using memory store for rate limiting');
    return undefined;
  }

  // Using a simple Redis store implementation
  return {
    async increment(key) {
      const results = await client.multi()
        .incr(key)
        .pexpire(key, rateLimitConfigs.general.windowMs)
        .exec();
      
      return {
        totalHits: results[0][1],
        resetTime: new Date(Date.now() + rateLimitConfigs.general.windowMs),
      };
    },
    async decrement(key) {
      await client.decr(key);
    },
    async resetKey(key) {
      await client.del(key);
    },
  };
};

/**
 * Create rate limiter middleware
 * @param {string} type - Rate limit type
 * @returns {Function}
 */
export const createRateLimiter = (type = 'general') => {
  const config = rateLimitConfigs[type] || rateLimitConfigs.general;
  
  return rateLimit({
    ...config,
    store: createRedisStore(),
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded: ${type} - IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json(config.message);
    },
  });
};

/**
 * HPP (HTTP Parameter Pollution) protection configuration
 */
export const hppConfig = hpp({
  whitelist: [
    'category',
    'tags',
    'techStack',
    'countries',
    'languages',
    'sort',
    'filter',
    'status',
  ],
});

/**
 * Security headers middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const securityHeaders = (req, res, next) => {
  // Add additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove fingerprinting headers
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Request ID middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

/**
 * Trusted proxy configuration
 * @returns {string|boolean|number}
 */
export const getTrustProxy = () => {
  if (process.env.NODE_ENV === 'production') {
    // Trust first proxy (Railway, Vercel, etc.)
    return 1;
  }
  return false;
};

/**
 * IP extraction middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const extractClientIp = (req, res, next) => {
  req.clientIp = req.ip || 
    req.headers['x-forwarded-for']?.split(',')[0].trim() || 
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress;
  next();
};

/**
 * Sanitize request body (basic XSS prevention)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const sanitizeRequest = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

/**
 * Block suspicious user agents
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const blockSuspiciousAgents = (req, res, next) => {
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /python-requests/i,
    /curl/i,
  ];

  const userAgent = req.headers['user-agent'] || '';

  // Only block in production and for non-API routes
  if (process.env.NODE_ENV === 'production') {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        logger.warn(`Blocked suspicious user agent: ${userAgent}, IP: ${req.ip}`);
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Access denied',
        });
      }
    }
  }

  next();
};

/**
 * GraphQL depth limit configuration
 */
export const graphqlDepthLimit = parseInt(process.env.GRAPHQL_DEPTH_LIMIT, 10) || 10;

/**
 * GraphQL complexity configuration
 */
export const graphqlComplexityConfig = {
  maximumComplexity: 1000,
  onComplete: (complexity) => {
    logger.debug(`GraphQL query complexity: ${complexity}`);
  },
};

/**
 * Security configuration export
 */
export const securityConfig = {
  helmet: helmetConfig,
  rateLimitConfigs,
  createRateLimiter,
  hpp: hppConfig,
  securityHeaders,
  requestId,
  getTrustProxy,
  extractClientIp,
  sanitizeRequest,
  blockSuspiciousAgents,
  graphqlDepthLimit,
  graphqlComplexityConfig,
};

export default securityConfig;