import crypto from 'crypto';
import { createClient } from 'redis';
import { RateLimiter } from './rate-limiter.js';

class APIKey {
  constructor(key, options = {}) {
    this.key = key;
    this.name = options.name || 'Unnamed API Key';
    this.userId = options.userId;
    this.scopes = options.scopes || [];
    this.rateLimit = options.rateLimit || { limit: 100, window: 60 };
    this.createdAt = options.createdAt || new Date();
    this.expiresAt = options.expiresAt;
    this.lastUsedAt = options.lastUsedAt;
    this.isActive = options.isActive !== false;
  }

  toJSON() {
    return {
      key: this.key,
      name: this.name,
      userId: this.userId,
      scopes: this.scopes,
      rateLimit: this.rateLimit,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      lastUsedAt: this.lastUsedAt,
      isActive: this.isActive
    };
  }

  isExpired() {
    return this.expiresAt && new Date() > new Date(this.expiresAt);
  }

  hasScope(scope) {
    return this.scopes.includes(scope);
  }

  hasAnyScope(scopes) {
    return scopes.some(scope => this.hasScope(scope));
  }

  hasAllScopes(scopes) {
    return scopes.every(scope => this.hasScope(scope));
  }
}

const createAPIKeyManager = async (options = {}) => {
  const {
    redisUrl = process.env.REDIS_URL,
    storageType = process.env.API_KEY_STORAGE || 'memory',
    keyPrefix = 'apikey:',
    keyLength = 32,
    rateLimiter
  } = options;

  let storage;
  let redisClient;

  if (storageType === 'redis' && redisUrl) {
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();

    storage = {
      async get(key) {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      },
      async set(key, value) {
        await redisClient.set(key, JSON.stringify(value));
      },
      async delete(key) {
        await redisClient.del(key);
      },
      async list(pattern) {
        const keys = await redisClient.keys(pattern);
        const values = await Promise.all(keys.map(k => redisClient.get(k)));
        return values.map(v => v ? JSON.parse(v) : null).filter(Boolean);
      }
    };
  } else {
    const keys = new Map();
    
    storage = {
      async get(key) {
        return keys.get(key) || null;
      },
      async set(key, value) {
        keys.set(key, value);
      },
      async delete(key) {
        keys.delete(key);
      },
      async list(pattern) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(keys.values())
          .filter(key => regex.test(key.key));
      }
    };
  }

  const generateKey = () => {
    return crypto.randomBytes(keyLength).toString('hex');
  };

  const createKey = async (options = {}) => {
    const key = generateKey();
    const apiKey = new APIKey(key, options);
    await storage.set(`${keyPrefix}${key}`, apiKey);
    return apiKey;
  };

  const validateKey = async (key, requiredScopes = []) => {
    const apiKey = await storage.get(`${keyPrefix}${key}`);
    
    if (!apiKey) {
      throw new Error('Invalid API key');
    }

    if (!apiKey.isActive) {
      throw new Error('API key is inactive');
    }

    if (apiKey.isExpired()) {
      throw new Error('API key has expired');
    }

    if (requiredScopes.length > 0 && !apiKey.hasAllScopes(requiredScopes)) {
      throw new Error('Insufficient permissions');
    }

    // Update last used timestamp
    apiKey.lastUsedAt = new Date();
    await storage.set(`${keyPrefix}${key}`, apiKey);

    return apiKey;
  };

  const revokeKey = async (key) => {
    const apiKey = await storage.get(`${keyPrefix}${key}`);
    if (apiKey) {
      apiKey.isActive = false;
      await storage.set(`${keyPrefix}${key}`, apiKey);
    }
  };

  const listKeys = async (pattern = '*') => {
    return storage.list(`${keyPrefix}${pattern}`);
  };

  const middleware = (options = {}) => {
    const {
      requiredScopes = [],
      rateLimit = true
    } = options;

    return async (req, res, next) => {
      const key = req.headers['x-api-key'];

      if (!key) {
        return res.status(401).json({
          error: {
            message: 'API key is required'
          }
        });
      }

      try {
        const apiKey = await validateKey(key, requiredScopes);

        // Apply rate limiting if enabled
        if (rateLimit && rateLimiter) {
          const { limit, window } = apiKey.rateLimit;
          const result = await rateLimiter.checkRateLimit(
            key,
            'api-key',
            limit,
            window
          );

          if (!result.allowed) {
            return res.status(429).json({
              error: {
                message: 'Rate limit exceeded',
                retryAfter: result.reset
              }
            });
          }
        }

        // Attach API key info to request
        req.apiKey = apiKey;
        next();
      } catch (error) {
        res.status(401).json({
          error: {
            message: error.message
          }
        });
      }
    };
  };

  const cleanup = async () => {
    if (redisClient) {
      await redisClient.quit();
    }
  };

  return {
    createKey,
    validateKey,
    revokeKey,
    listKeys,
    middleware,
    cleanup
  };
};

// Create singleton instance
let apiKeyManagerInstance = null;

const getAPIKeyManager = async (options) => {
  if (!apiKeyManagerInstance) {
    apiKeyManagerInstance = await createAPIKeyManager(options);
  }
  return apiKeyManagerInstance;
};

export { getAPIKeyManager as APIKeyManager, APIKey }; 