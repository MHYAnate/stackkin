import cors from 'cors';
import logger from './logger.js';

// Parse allowed origins from environment variable
const parseAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS || '';
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:4000',
    'https://stackkin.com',
    'https://www.stackkin.com'
  ];
  
  if (!origins) {
    return defaultOrigins;
  }
  
  return origins.split(',').map(origin => origin.trim()).filter(Boolean);
};

// CORS options
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = parseAllowedOrigins();
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Access-Token',
    'X-Refresh-Token',
    'X-Session-Id',
    'X-Two-Factor-Token',
    'X-Client-Version',
    'X-Device-Id'
  ],
  exposedHeaders: [
    'X-Access-Token',
    'X-Refresh-Token',
    'X-Session-Id',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// CORS middleware for WebSocket/Socket.IO
export const socketCorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = parseAllowedOrigins();
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST']
};

// Create CORS middleware
export const corsMiddleware = cors(corsOptions);

// Preflight request handler
export const handlePreflight = (req, res) => {
  res.status(200).end();
};

// Add CORS headers manually (for edge cases)
export const addCorsHeaders = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = parseAllowedOrigins();
  
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Access-Token, X-Refresh-Token, X-Session-Id, X-Two-Factor-Token, X-Client-Version, X-Device-Id'
  );
  res.header('Access-Control-Expose-Headers', 
    'X-Access-Token, X-Refresh-Token, X-Session-Id, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset'
  );
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

// Check CORS configuration
export const checkCorsConfig = () => {
  const allowedOrigins = parseAllowedOrigins();
  
  logger.info('CORS Configuration:', {
    allowedOrigins,
    environment: process.env.NODE_ENV
  });
  
  return {
    allowedOrigins,
    environment: process.env.NODE_ENV
  };
};

export default corsMiddleware;