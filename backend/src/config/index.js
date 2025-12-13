// src/config/index.js
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import all configurations
import databaseConfig, {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  checkDatabaseHealth,
} from './database.js';

import redisConfig, {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisConnected,
  checkRedisHealth,
  cacheTTL,
  cacheKeys,
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPattern,
} from './redis.js';

import cloudinaryConfig, {
  initializeCloudinary,
  cloudinary,
  uploadFolders,
  allowedFileTypes,
  maxFileSize,
  uploadConfigs,
  uploadFile,
  uploadFromBuffer,
  deleteFile,
  deleteFiles,
  getTransformedUrl,
  getThumbnailUrl,
  checkCloudinaryHealth,
} from './cloudinary.js';

import corsConfig, {
  corsOptions,
  graphqlCorsOptions,
  socketCorsOptions,
  uploadCorsOptions,
  webhookCorsOptions,
  getAllowedOrigins,
  addAllowedOrigin,
  removeAllowedOrigin,
  corsErrorHandler,
} from './cors.js';

import securityConfig, {
  helmetConfig,
  rateLimitConfigs,
  createRateLimiter,
  hppConfig,
  securityHeaders,
  requestId,
  getTrustProxy,
  extractClientIp,
  sanitizeRequest,
  blockSuspiciousAgents,
  graphqlDepthLimit,
  graphqlComplexityConfig,
} from './security.js';

import socketConfig, {
  initializeSocket,
  getIO,
  socketEvents,
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
  checkSocketHealth,
} from './socket.js';

/**
 * Application configuration
 */
export const appConfig = {
  name: process.env.APP_NAME || 'stackkin',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  url: process.env.APP_URL || 'http://localhost:4000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
};

/**
 * JWT configuration
 */
export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  issuer: process.env.JWT_ISSUER || 'stackkin',
  audience: process.env.JWT_AUDIENCE || 'stackkin-users',
};

/**
 * Password configuration
 */
export const passwordConfig = {
  saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  pepper: process.env.PASSWORD_PEPPER,
};

/**
 * Session configuration
 */
export const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  name: process.env.SESSION_NAME || 'stackkin_sid',
  maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) || 86400000, // 24 hours
};

/**
 * Email configuration
 */
export const emailConfig = {
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.EMAIL_FROM || 'noreply@stackkin.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Stackkin',
};

/**
 * Zainpay configuration
 */
export const zainpayConfig = {
  publicKey: process.env.ZAINPAY_PUBLIC_KEY,
  secretKey: process.env.ZAINPAY_SECRET_KEY,
  zainboxCode: process.env.ZAINPAY_ZAINBOX_CODE,
  callbackUrl: process.env.ZAINPAY_CALLBACK_URL,
  sandbox: process.env.ZAINPAY_SANDBOX === 'true',
  baseUrl: process.env.ZAINPAY_SANDBOX === 'true'
    ? 'https://sandbox.zainpay.ng'
    : 'https://api.zainpay.ng',
};

/**
 * Subscription pricing configuration (in Kobo)
 */
export const subscriptionPricing = {
  base: {
    yearly: parseInt(process.env.SUBSCRIPTION_BASE_YEARLY, 10) || 1000000,
    lifetime: parseInt(process.env.SUBSCRIPTION_BASE_LIFETIME, 10) || 5000000,
  },
  mid: {
    yearly: parseInt(process.env.SUBSCRIPTION_MID_YEARLY, 10) || 2500000,
  },
  top: {
    halfYearly: parseInt(process.env.SUBSCRIPTION_TOP_HALF_YEARLY, 10) || 2000000,
    yearly: parseInt(process.env.SUBSCRIPTION_TOP_YEARLY, 10) || 3500000,
  },
};

/**
 * Job posting pricing configuration (in Kobo)
 */
export const jobPostingPricing = {
  free: parseInt(process.env.JOB_POSTING_PRICE_FREE, 10) || 50000,
  base: parseInt(process.env.JOB_POSTING_PRICE_BASE, 10) || 40000,
  mid: parseInt(process.env.JOB_POSTING_PRICE_MID, 10) || 30000,
  top: parseInt(process.env.JOB_POSTING_PRICE_TOP, 10) || 20000,
};

/**
 * Marketplace slot pricing configuration (in Kobo)
 */
export const slotPricing = {
  free: parseInt(process.env.SLOT_PRICE_FREE, 10) || 30000,
  base: parseInt(process.env.SLOT_PRICE_BASE, 10) || 25000,
  mid: parseInt(process.env.SLOT_PRICE_MID, 10) || 20000,
  top: parseInt(process.env.SLOT_PRICE_TOP, 10) || 15000,
};

/**
 * Solution premium upgrade price (in Kobo)
 */
export const solutionPremiumPrice = parseInt(process.env.SOLUTION_PREMIUM_UPGRADE_PRICE, 10) || 15000;

/**
 * GraphQL configuration
 */
export const graphqlConfig = {
  depthLimit: graphqlDepthLimit,
  introspection: process.env.GRAPHQL_INTROSPECTION !== 'false',
  playground: process.env.GRAPHQL_PLAYGROUND !== 'false',
  complexity: graphqlComplexityConfig,
};

/**
 * Two-factor authentication configuration
 */
export const twoFactorConfig = {
  appName: process.env.TWO_FACTOR_APP_NAME || 'Stackkin',
  digits: parseInt(process.env.TWO_FACTOR_DIGITS, 10) || 6,
  step: parseInt(process.env.TWO_FACTOR_STEP, 10) || 30,
};

/**
 * Logging configuration
 */
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'debug',
  format: process.env.LOG_FORMAT || 'combined',
};

/**
 * Feature flags
 */
export const featureFlags = {
  registration: process.env.ENABLE_REGISTRATION !== 'false',
  emailVerification: process.env.ENABLE_EMAIL_VERIFICATION !== 'false',
  twoFactor: process.env.ENABLE_TWO_FACTOR !== 'false',
  rateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
};

/**
 * Admin defaults
 */
export const adminDefaults = {
  email: process.env.SUPER_ADMIN_EMAIL || 'admin@stackkin.com',
  password: process.env.SUPER_ADMIN_PASSWORD,
};

/**
 * Encryption configuration
 */
export const encryptionConfig = {
  key: process.env.ENCRYPTION_KEY,
  ivLength: parseInt(process.env.ENCRYPTION_IV_LENGTH, 10) || 16,
};

/**
 * Initialize all services
 * @returns {Promise<Object>}
 */
export const initializeServices = async () => {
  const results = {
    database: false,
    redis: false,
    cloudinary: false,
  };

  try {
    // Connect to MongoDB
    await connectDatabase();
    results.database = true;

    // Connect to Redis
    const redisClient = await connectRedis();
    results.redis = !!redisClient;

    // Initialize Cloudinary
    results.cloudinary = initializeCloudinary();

    return results;
  } catch (error) {
    console.error('Service initialization error:', error);
    throw error;
  }
};

/**
 * Shutdown all services
 * @returns {Promise<void>}
 */
export const shutdownServices = async () => {
  await disconnectDatabase();
  await disconnectRedis();
};

/**
 * Health check for all services
 * @returns {Promise<Object>}
 */
export const checkServicesHealth = async () => {
  const [database, redis, cloudinary, socket] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkCloudinaryHealth(),
    Promise.resolve(checkSocketHealth()),
  ]);

  const allHealthy = database.healthy && 
                     (redis.healthy || !isRedisConnected()) && 
                     cloudinary.healthy;

  return {
    healthy: allHealthy,
    services: {
      database,
      redis,
      cloudinary,
      socket,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Export all configurations
 */
export {
  // Database
  databaseConfig,
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  checkDatabaseHealth,

  // Redis
  redisConfig,
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisConnected,
  checkRedisHealth,
  cacheTTL,
  cacheKeys,
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPattern,

  // Cloudinary
  cloudinaryConfig,
  initializeCloudinary,
  cloudinary,
  uploadFolders,
  allowedFileTypes,
  maxFileSize,
  uploadConfigs,
  uploadFile,
  uploadFromBuffer,
  deleteFile,
  deleteFiles,
  getTransformedUrl,
  getThumbnailUrl,
  checkCloudinaryHealth,

  // CORS
  corsConfig,
  corsOptions,
  graphqlCorsOptions,
  socketCorsOptions,
  uploadCorsOptions,
  webhookCorsOptions,
  getAllowedOrigins,
  addAllowedOrigin,
  removeAllowedOrigin,
  corsErrorHandler,

  // Security
  securityConfig,
  helmetConfig,
  rateLimitConfigs,
  createRateLimiter,
  hppConfig,
  securityHeaders,
  requestId,
  getTrustProxy,
  extractClientIp,
  sanitizeRequest,
  blockSuspiciousAgents,
  graphqlDepthLimit,
  graphqlComplexityConfig,

  // Socket
  socketConfig,
  initializeSocket,
  getIO,
  socketEvents,
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
  checkSocketHealth,
};

/**
 * Default export - all configurations
 */
export default {
  app: appConfig,
  jwt: jwtConfig,
  password: passwordConfig,
  session: sessionConfig,
  email: emailConfig,
  zainpay: zainpayConfig,
  pricing: {
    subscription: subscriptionPricing,
    jobPosting: jobPostingPricing,
    slot: slotPricing,
    solutionPremium: solutionPremiumPrice,
  },
  graphql: graphqlConfig,
  twoFactor: twoFactorConfig,
  logging: loggingConfig,
  features: featureFlags,
  admin: adminDefaults,
  encryption: encryptionConfig,
  database: databaseConfig,
  redis: redisConfig,
  cloudinary: cloudinaryConfig,
  cors: corsConfig,
  security: securityConfig,
  socket: socketConfig,
  initialize: initializeServices,
  shutdown: shutdownServices,
  healthCheck: checkServicesHealth,
};