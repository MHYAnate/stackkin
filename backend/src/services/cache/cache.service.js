import Redis from 'ioredis';
import { AppError } from '../../errors/index.js';

class CacheService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    this.redis.on('error', (error) => {
      console.error('Redis error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  async get(key) {
    try {
      const data = await this.redis.get(key);
      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      if (ttl > 0) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async deletePattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async increment(key) {
    try {
      const result = await this.redis.incr(key);
      return result;
    } catch (error) {
      console.error('Cache increment error:', error);
      return null;
    }
  }

  async decrement(key) {
    try {
      const result = await this.redis.decr(key);
      return result;
    } catch (error) {
      console.error('Cache decrement error:', error);
      return null;
    }
  }

  async expire(key, ttl) {
    try {
      await this.redis.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  async ttl(key) {
    try {
      const result = await this.redis.ttl(key);
      return result;
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -2;
    }
  }

  async hset(key, field, value) {
    try {
      await this.redis.hset(key, field, value);
      return true;
    } catch (error) {
      console.error('Cache HSET error:', error);
      return false;
    }
  }

  async hget(key, field) {
    try {
      const result = await this.redis.hget(key, field);
      return result;
    } catch (error) {
      console.error('Cache HGET error:', error);
      return null;
    }
  }

  async hgetall(key) {
    try {
      const result = await this.redis.hgetall(key);
      return result;
    } catch (error) {
      console.error('Cache HGETALL error:', error);
      return null;
    }
  }

  async sadd(key, ...members) {
    try {
      const result = await this.redis.sadd(key, ...members);
      return result;
    } catch (error) {
      console.error('Cache SADD error:', error);
      return 0;
    }
  }

  async smembers(key) {
    try {
      const result = await this.redis.smembers(key);
      return result;
    } catch (error) {
      console.error('Cache SMEMBERS error:', error);
      return [];
    }
  }

  async sismember(key, member) {
    try {
      const result = await this.redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      console.error('Cache SISMEMBER error:', error);
      return false;
    }
  }

  async flushall() {
    try {
      await this.redis.flushall();
      return true;
    } catch (error) {
      console.error('Cache flushall error:', error);
      return false;
    }
  }

  async ping() {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Cache ping error:', error);
      return false;
    }
  }

  async quit() {
    try {
      await this.redis.quit();
      return true;
    } catch (error) {
      console.error('Cache quit error:', error);
      return false;
    }
  }
}

export default new CacheService();