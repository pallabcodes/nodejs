import { createClient } from 'redis';

class TokenBucket {
  constructor(capacity, refillRate, refillTime) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.refillTime = refillTime;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  consume(tokens = 1) {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  getTokens() {
    this.refill();
    return this.tokens;
  }
}

const createRateLimiter = async (options = {}) => {
  const {
    redisUrl = process.env.REDIS_URL,
    defaultLimit = 100,
    defaultWindow = 60, // 1 minute
    storageType = process.env.RATE_LIMIT_STORAGE || 'memory'
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
      async set(key, value, ttl) {
        await redisClient.set(key, JSON.stringify(value), { EX: ttl });
      }
    };
  } else {
    const buckets = new Map();
    
    storage = {
      async get(key) {
        return buckets.get(key) || null;
      },
      async set(key, value, ttl) {
        buckets.set(key, value);
        setTimeout(() => buckets.delete(key), ttl * 1000);
      }
    };
  }

  const createBucket = (limit, window) => {
    return new TokenBucket(limit, limit / window, window);
  };

  const getKey = (identifier, type) => {
    return `ratelimit:${type}:${identifier}`;
  };

  const checkRateLimit = async (identifier, type, limit = defaultLimit, window = defaultWindow) => {
    const key = getKey(identifier, type);
    let bucket = await storage.get(key);

    if (!bucket) {
      bucket = createBucket(limit, window);
      await storage.set(key, bucket, window);
    } else {
      bucket = Object.assign(new TokenBucket(limit, limit / window, window), bucket);
    }

    const allowed = bucket.consume();
    await storage.set(key, bucket, window);

    return {
      allowed,
      remaining: bucket.getTokens(),
      reset: Math.ceil((bucket.lastRefill + window * 1000 - Date.now()) / 1000)
    };
  };

  const middleware = (options = {}) => {
    const {
      type = 'ip',
      limit = defaultLimit,
      window = defaultWindow,
      message = 'Too many requests, please try again later.'
    } = options;

    return async (req, res, next) => {
      const identifier = type === 'ip' 
        ? req.ip 
        : req.headers[type] || req.ip;

      try {
        const result = await checkRateLimit(identifier, type, limit, window);

        res.set({
          'X-RateLimit-Limit': limit,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': result.reset
        });

        if (!result.allowed) {
          return res.status(429).json({
            error: {
              message,
              retryAfter: result.reset
            }
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };

  const cleanup = async () => {
    if (redisClient) {
      await redisClient.quit();
    }
  };

  return {
    checkRateLimit,
    middleware,
    cleanup
  };
};

// Create singleton instance
let rateLimiterInstance = null;

const getRateLimiter = async (options) => {
  if (!rateLimiterInstance) {
    rateLimiterInstance = await createRateLimiter(options);
  }
  return rateLimiterInstance;
};

export { getRateLimiter as RateLimiter }; 