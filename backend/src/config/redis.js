import Redis from 'ioredis';
import logger from './logger.js';

let redisClient = null;
let redisSubscriber = null;
let redisPublisher = null;

// Create Redis client
const createRedisClient = (options = {}) => {
  const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    ...options
  };

  // If REDIS_URL is provided, use it instead
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, redisOptions);
  }

  return new Redis(redisOptions);
};

// Initialize Redis connections
export const initRedis = () => {
  if (!redisClient) {
    redisClient = createRedisClient();
    
    // Event listeners
    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    redisClient.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  return redisClient;
};

// Get Redis client
export const getRedisClient = () => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

// Get Redis subscriber (for pub/sub)
export const getRedisSubscriber = () => {
  if (!redisSubscriber) {
    redisSubscriber = createRedisClient();
  }
  return redisSubscriber;
};

// Get Redis publisher (for pub/sub)
export const getRedisPublisher = () => {
  if (!redisPublisher) {
    redisPublisher = createRedisClient();
  }
  return redisPublisher;
};

// Health check for Redis
export const checkRedisHealth = async () => {
  try {
    const client = getRedisClient();
    await client.ping();
    return {
      status: 'healthy',
      host: client.options.host,
      port: client.options.port,
      db: client.options.db
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Cache operations
export const cache = {
  // Set cache with expiry
  set: async (key, value, ttl = 3600) => {
    try {
      const client = getRedisClient();
      const serialized = JSON.stringify(value);
      await client.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  // Get cache
  get: async (key) => {
    try {
      const client = getRedisClient();
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  // Delete cache
  del: async (key) => {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      const client = getRedisClient();
      const exists = await client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },

  // Set multiple cache items
  mset: async (items, ttl = 3600) => {
    try {
      const client = getRedisClient();
      const pipeline = client.pipeline();
      
      items.forEach(({ key, value }) => {
        const serialized = JSON.stringify(value);
        pipeline.setex(key, ttl, serialized);
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  },

  // Get multiple cache items
  mget: async (keys) => {
    try {
      const client = getRedisClient();
      const data = await client.mget(keys);
      return data.map(item => item ? JSON.parse(item) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  },

  // Increment counter
  incr: async (key) => {
    try {
      const client = getRedisClient();
      return await client.incr(key);
    } catch (error) {
      logger.error('Cache incr error:', error);
      return null;
    }
  },

  // Decrement counter
  decr: async (key) => {
    try {
      const client = getRedisClient();
      return await client.decr(key);
    } catch (error) {
      logger.error('Cache decr error:', error);
      return null;
    }
  }
};

// Close Redis connections
export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  
  if (redisSubscriber) {
    await redisSubscriber.quit();
    redisSubscriber = null;
  }
  
  if (redisPublisher) {
    await redisPublisher.quit();
    redisPublisher = null;
  }
  
  logger.info('Redis connections closed');
};

export default getRedisClient;