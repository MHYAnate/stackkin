import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import crypto from 'crypto';
import logger from './logger.js';

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://api.qrserver.com"],
      connectSrc: ["'self'", "https://api.resend.com", "wss://localhost:4000", process.env.CLIENT_URL],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  originAgentCluster: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xssFilter: true,
  noSniff: true,
  frameguard: { action: "deny" }
});

// Rate limiting configuration
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  skip: (req) => {
    // Skip rate limiting for health checks and in development
    return req.path === '/health' || process.env.NODE_ENV === 'development';
  }
});

// API-specific rate limiting
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many API requests, please try again later'
  }
});

// Auth-specific rate limiting (stricter)
export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after an hour'
  }
});

// HPP (HTTP Parameter Pollution) protection
export const hppProtection = hpp({
  whitelist: [
    'filter',
    'page',
    'limit',
    'sort',
    'fields',
    'search',
    'category'
  ]
});

// XSS protection
export const xssProtection = xss();

// NoSQL injection protection
export const noSqlInjectionProtection = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('NoSQL injection attempt detected', {
      ip: req.ip,
      key,
      path: req.path,
      method: req.method
    });
  }
});

// Generate CSRF token
export const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate CSRF token
export const validateCsrfToken = (token, sessionToken) => {
  if (!token || !sessionToken) {
    return false;
  }
  
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(sessionToken)
  );
};

// Security middleware wrapper
export const applySecurityMiddleware = (app) => {
  // Apply security headers
  app.use(securityHeaders);
  
  // Apply rate limiting
  if (process.env.RATE_LIMIT_ENABLED !== 'false') {
    app.use('/api', apiRateLimiter);
    app.use('/auth', authRateLimiter);
    app.use(rateLimiter);
  }
  
  // Apply other security middleware
  app.use(hppProtection);
  app.use(xssProtection);
  app.use(noSqlInjectionProtection);
  
  // Custom security headers
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Enable XSS filter in older browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy
    res.setHeader('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );
    
    // Feature policy (for older browsers)
    res.setHeader('Feature-Policy',
      "camera 'none'; microphone 'none'; geolocation 'none'"
    );
    
    // Cache control for sensitive endpoints
    if (req.path.includes('/api') || req.path.includes('/auth')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    
    next();
  });
  
  logger.info('Security middleware applied');
};

// Security audit logging
export const securityAudit = (req, action, details = {}) => {
  const auditDetails = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent'),
    userId: req.user?._id,
    action,
    ...details
  };
  
  logger.warn('Security Audit:', auditDetails);
  
  // Store in audit collection if needed
  // This could be saved to MongoDB for long-term auditing
};

// Check security configuration
export const checkSecurityConfig = () => {
  const config = {
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    xssProtection: true,
    hppProtection: true,
    noSqlInjectionProtection: true,
    csrfProtection: process.env.NODE_ENV === 'production',
    environment: process.env.NODE_ENV
  };
  
  logger.info('Security Configuration:', config);
  
  return config;
};

export default applySecurityMiddleware;