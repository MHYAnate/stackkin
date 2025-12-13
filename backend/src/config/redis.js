// src/config/redis.js
import Redis from 'ioredis';
import { createLogger } from '../utils/logger.util.js';

const logger = createLogger('Redis');

/**
 * Redis client instance
 */
let redisClient = null;
let isConnected = false;

/**
 * Default Redis configuration
 */
const defaultConfig = {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  lazyConnect: true,
  showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
};

/**
 * Parse Redis URL and return configuration
 * @param {string} url - Redis URL
 * @returns {Object}
 */
const parseRedisUrl = (url) => {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port, 10) || 6379,
      password: parsedUrl.password || undefined,
      username: parsedUrl.username || undefined,
      tls: url.startsWith('rediss://') ? {} : undefined,
    };
  } catch (error) {
    logger.error('Failed to parse Redis URL:', error);
    return null;
  }
};

/**
 * Create Redis client
 * @returns {Redis}
 */
export const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn('REDIS_URL not defined, Redis features will be disabled');
    return null;
  }

  const urlConfig = parseRedisUrl(redisUrl);

  if (!urlConfig) {
    logger.error('Invalid Redis URL configuration');
    return null;
  }

  const config = {
    ...defaultConfig,
    ...urlConfig,
  };

  const client = new Redis(config);

  // Event handlers
  client.on('connect', () => {
    logger.info('Redis client connecting...');
  });

  client.on('ready', () => {
    isConnected = true;
    logger.info('Redis client ready');
  });

  client.on('error', (error) => {
    isConnected = false;
    logger.error('Redis client error:', error.message);
  });

  client.on('close', () => {
    isConnected = false;
    logger.warn('Redis client connection closed');
  });

  client.on('reconnecting', (delay) => {
    logger.info(`Redis client reconnecting in ${delay}ms`);
  });

  client.on('end', () => {
    isConnected = false;
    logger.info('Redis client connection ended');
  });

  return client;
};

/**
 * Connect to Redis
 * @returns {Promise<Redis>}
 */
export const connectRedis = async () => {
  if (redisClient && isConnected) {
    logger.info('Using existing Redis connection');
    return redisClient;
  }

  redisClient = createRedisClient();

  if (!redisClient) {
    return null;
  }

  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
    return redisClient;
  } catch (error) {
    logger.error('Redis connection error:', error);
    return null;
  }
};

/**
 * Get Redis client instance
 * @returns {Redis|null}
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * Disconnect from Redis
 * @returns {Promise<void>}
 */
export const disconnectRedis = async () => {
  if (!redisClient) {
    return;
  }

  try {
    await redisClient.quit();
    isConnected = false;
    redisClient = null;
    logger.info('Redis disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
    throw error;
  }
};

/**
 * Check if Redis is connected
 * @returns {boolean}
 */
export const isRedisConnected = () => {
  return isConnected && redisClient?.status === 'ready';
};

/**
 * Redis health check
 * @returns {Promise<Object>}
 */
export const checkRedisHealth = async () => {
  try {
    if (!redisClient || !isConnected) {
      return {
        status: 'disconnected',
        healthy: false,
        message: 'Redis is not connected',
      };
    }

    const pingResult = await redisClient.ping();

    return {
      status: 'connected',
      healthy: pingResult === 'PONG',
      latency: await measureLatency(),
    };
  } catch (error) {
    return {
      status: 'error',
      healthy: false,
      message: error.message,
    };
  }
};

/**
 * Measure Redis latency
 * @returns {Promise<number>}
 */
const measureLatency = async () => {
  if (!redisClient) return -1;

  const start = Date.now();
  await redisClient.ping();
  return Date.now() - start;
};

/**
 * Cache TTL configurations (in seconds)
 */
export const cacheTTL = {
  short: parseInt(process.env.CACHE_TTL_SHORT, 10) || 300, // 5 minutes
  medium: parseInt(process.env.CACHE_TTL_MEDIUM, 10) || 1800, // 30 minutes
  long: parseInt(process.env.CACHE_TTL_LONG, 10) || 86400, // 24 hours
  session: 86400 * 7, // 7 days
};

/**
 * Cache key prefixes
 */
export const cacheKeys = {
  session: 'session:',
  user: 'user:',
  solution: 'solution:',
  job: 'job:',
  listing: 'listing:',
  chat: 'chat:',
  notification: 'notification:',
  rateLimit: 'ratelimit:',
  otp: 'otp:',
  resetToken: 'reset:',
  verifyToken: 'verify:',
  refreshToken: 'refresh:',
  blacklist: 'blacklist:',
  leaderboard: 'leaderboard:',
  analytics: 'analytics:',
};

/**
 * Set cache value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<string|null>}
 */
export const setCache = async (key, value, ttl = cacheTTL.medium) => {
  if (!redisClient) return null;

  try {
    const serializedValue = JSON.stringify(value);
    return await redisClient.setex(key, ttl, serializedValue);
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
    return null;
  }
};

/**
 * Get cache value
 * @param {string} key - Cache key
 * @returns {Promise<any|null>}
 */
export const getCache = async (key) => {
  if (!redisClient) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Cache get error for key ${key}:`, error);
    return null;
  }
};

/**
 * Delete cache value
 * @param {string} key - Cache key
 * @returns {Promise<number|null>}
 */
export const deleteCache = async (key) => {
  if (!redisClient) return null;

  try {
    return await redisClient.del(key);
  } catch (error) {
    logger.error(`Cache delete error for key ${key}:`, error);
    return null;
  }
};

/**
 * Delete cache by pattern
 * @param {string} pattern - Key pattern
 * @returns {Promise<number>}
 */
export const deleteCacheByPattern = async (pattern) => {
  if (!redisClient) return 0;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;
    return await redisClient.del(...keys);
  } catch (error) {
    logger.error(`Cache delete by pattern error for ${pattern}:`, error);
    return 0;
  }
};

/**
 * Redis configuration object
 */
export const redisConfig = {
  connect: connectRedis,
  disconnect: disconnectRedis,
  getClient: getRedisClient,
  isConnected: isRedisConnected,
  healthCheck: checkRedisHealth,
  cacheTTL,
  cacheKeys,
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPattern,
};

export default redisConfig;