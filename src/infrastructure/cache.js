import { createClient } from 'redis';
import { Logger } from './logger.js';

const CACHE_TYPES = {
  MEMORY: 'memory',
  REDIS: 'redis'
};

class CacheEntry {
  constructor(value, options = {}) {
    this.value = value;
    this.createdAt = Date.now();
    this.expiresAt = options.ttl ? this.createdAt + (options.ttl * 1000) : null;
    this.tags = options.tags || [];
    this.metadata = options.metadata || {};
  }

  isExpired() {
    return this.expiresAt && Date.now() > this.expiresAt;
  }

  toJSON() {
    return {
      value: this.value,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      tags: this.tags,
      metadata: this.metadata
    };
  }
}

const createCache = async (options = {}) => {
  const {
    type = process.env.CACHE_TYPE || CACHE_TYPES.MEMORY,
    redisUrl = process.env.REDIS_URL,
    defaultTTL = 3600, // 1 hour
    maxSize = 1000,
    logger = Logger
  } = options;

  let storage;
  let redisClient;

  if (type === CACHE_TYPES.REDIS && redisUrl) {
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();

    storage = {
      async get(key) {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      },
      async set(key, value, ttl) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          await redisClient.set(key, serialized, { EX: ttl });
        } else {
          await redisClient.set(key, serialized);
        }
      },
      async delete(key) {
        await redisClient.del(key);
      },
      async keys(pattern) {
        return redisClient.keys(pattern);
      },
      async clear() {
        const keys = await redisClient.keys('cache:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
    };
  } else {
    const cache = new Map();
    const tagIndex = new Map();

    storage = {
      async get(key) {
        const entry = cache.get(key);
        if (!entry) return null;
        
        if (entry.isExpired()) {
          cache.delete(key);
          // Remove from tag index
          entry.tags.forEach(tag => {
            const keys = tagIndex.get(tag) || new Set();
            keys.delete(key);
            if (keys.size === 0) {
              tagIndex.delete(tag);
            } else {
              tagIndex.set(tag, keys);
            }
          });
          return null;
        }
        
        return entry;
      },
      async set(key, value, ttl) {
        // Check size limit
        if (cache.size >= maxSize && !cache.has(key)) {
          // Remove oldest entry
          const oldestKey = Array.from(cache.keys())[0];
          const oldestEntry = cache.get(oldestKey);
          oldestEntry.tags.forEach(tag => {
            const keys = tagIndex.get(tag);
            if (keys) {
              keys.delete(oldestKey);
              if (keys.size === 0) {
                tagIndex.delete(tag);
              }
            }
          });
          cache.delete(oldestKey);
        }

        const entry = new CacheEntry(value, { ttl });
        cache.set(key, entry);

        // Update tag index
        entry.tags.forEach(tag => {
          const keys = tagIndex.get(tag) || new Set();
          keys.add(key);
          tagIndex.set(tag, keys);
        });
      },
      async delete(key) {
        const entry = cache.get(key);
        if (entry) {
          entry.tags.forEach(tag => {
            const keys = tagIndex.get(tag);
            if (keys) {
              keys.delete(key);
              if (keys.size === 0) {
                tagIndex.delete(tag);
              }
            }
          });
        }
        cache.delete(key);
      },
      async keys(pattern) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(cache.keys()).filter(key => regex.test(key));
      },
      async clear() {
        cache.clear();
        tagIndex.clear();
      }
    };
  }

  const get = async (key) => {
    try {
      const entry = await storage.get(key);
      if (!entry) return null;

      if (entry.isExpired()) {
        await storage.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  };

  const set = async (key, value, options = {}) => {
    try {
      const entry = new CacheEntry(value, {
        ttl: options.ttl || defaultTTL,
        tags: options.tags,
        metadata: options.metadata
      });

      await storage.set(key, entry, entry.expiresAt ? Math.ceil((entry.expiresAt - Date.now()) / 1000) : null);
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  };

  const del = async (key) => {
    try {
      await storage.delete(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  };

  const invalidateByTags = async (tags) => {
    try {
      if (type === CACHE_TYPES.REDIS) {
        // For Redis, we need to scan all keys
        const keys = await storage.keys('cache:*');
        for (const key of keys) {
          const entry = await storage.get(key);
          if (entry && entry.tags.some(tag => tags.includes(tag))) {
            await storage.delete(key);
          }
        }
      } else {
        // For memory cache, use tag index
        const keysToDelete = new Set();
        tags.forEach(tag => {
          const keys = tagIndex.get(tag);
          if (keys) {
            keys.forEach(key => keysToDelete.add(key));
          }
        });
        await Promise.all(Array.from(keysToDelete).map(key => storage.delete(key)));
      }
      return true;
    } catch (error) {
      logger.error('Cache invalidation error', { tags, error: error.message });
      return false;
    }
  };

  const clear = async () => {
    try {
      await storage.clear();
      return true;
    } catch (error) {
      logger.error('Cache clear error', { error: error.message });
      return false;
    }
  };

  const middleware = (options = {}) => {
    const {
      ttl = defaultTTL,
      tags = [],
      keyGenerator = (req) => `cache:${req.method}:${req.originalUrl}`,
      skipCache = (req) => req.method !== 'GET'
    } = options;

    return async (req, res, next) => {
      if (skipCache(req)) {
        return next();
      }

      const key = keyGenerator(req);
      const cached = await get(key);

      if (cached) {
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method
      res.json = function(data) {
        set(key, data, { ttl, tags }).catch(error => {
          logger.error('Cache middleware set error', { key, error: error.message });
        });
        return originalJson.call(this, data);
      };

      next();
    };
  };

  const cleanup = async () => {
    if (redisClient) {
      await redisClient.quit();
    }
  };

  return {
    get,
    set,
    del,
    invalidateByTags,
    clear,
    middleware,
    cleanup,
    CACHE_TYPES
  };
};

// Create singleton instance
let cacheInstance = null;

const getCache = async (options) => {
  if (!cacheInstance) {
    cacheInstance = await createCache(options);
  }
  return cacheInstance;
};

export { getCache as Cache, CACHE_TYPES }; 