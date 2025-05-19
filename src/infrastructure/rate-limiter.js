import { createClient } from 'redis';

// Private implementation (unused)
const _createTokenBucket = (capacity, refillRate, refillTime) => ({
  capacity,
  refillRate,
  refillTime,
  tokens: capacity,
  lastRefill: Date.now(),
  refill: function() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  },
  consume: function(tokens = 1) {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  },
  getTokens: function() {
    this.refill();
    return this.tokens;
  }
});

// Pure functions for rate limiting
const createWindowKey = (key, windowMs) => 
  `${key}:${Math.floor(Date.now() / windowMs)}`;

const createRateLimitHeaders = (current, maxRequests, windowMs) => ({
  'X-RateLimit-Limit': maxRequests,
  'X-RateLimit-Remaining': Math.max(0, maxRequests - current),
  'X-RateLimit-Reset': Math.ceil((Date.now() + windowMs) / 1000)
});

const createRateLimitError = (windowMs) => ({
  status: 429,
  body: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(windowMs / 1000)
  }
});

// Redis client factory
const createRedisClient = async (url) => {
  const client = createClient({ url });
  
  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  try {
    await client.connect();
    console.log('Redis client connected');
    return client;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    return null;
  }
};

// Store implementations
const createMemoryStore = () => {
  const store = new Map();
  
  return {
    increment: (key) => {
      const current = store.get(key) || 0;
      store.set(key, current + 1);
      
      // Clean up old entries
      const currentWindow = Math.floor(Date.now() / 15000);
      for (const k of store.keys()) {
        const window = parseInt(k.split(':')[1]);
        if (window < currentWindow) {
          store.delete(k);
        }
      }
      
      return current + 1;
    },
    get: (key) => store.get(key) || 0,
    close: () => {}
  };
};

const createRedisStore = (client) => ({
  increment: async (key) => {
    try {
      const multi = client.multi();
      multi.incr(key);
      multi.expire(key, 900); // 15 minutes
      const results = await multi.exec();
      return results[0];
    } catch (error) {
      console.error('Redis increment error:', error);
      return 0;
    }
  },
  get: async (key) => {
    try {
      const count = await client.get(key);
      return parseInt(count) || 0;
    } catch (error) {
      console.error('Redis get error:', error);
      return 0;
    }
  },
  close: async () => {
    if (client) {
      await client.quit();
    }
  }
});

// Rate limiter factory
const createRateLimiter = async (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    redisUrl = process.env.REDIS_URL
  } = options;

  const isProduction = process.env.NODE_ENV === 'production';
  const store = isProduction && redisUrl
    ? createRedisStore(await createRedisClient(redisUrl))
    : createMemoryStore();

  const middleware = () => async (req, res, next) => {
    try {
      const key = createWindowKey(req.ip, windowMs);
      const current = await store.increment(key);
      
      // Set rate limit headers
      Object.entries(createRateLimitHeaders(current, maxRequests, windowMs))
        .forEach(([header, value]) => res.setHeader(header, value));

      if (current > maxRequests) {
        const error = createRateLimitError(windowMs);
        return res.status(error.status).json(error.body);
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next();
    }
  };

  return {
    middleware,
    close: () => store.close()
  };
};

// Create and export singleton instance
let rateLimiterInstance = null;

export const getRateLimiter = async (options) => {
  if (!rateLimiterInstance) {
    rateLimiterInstance = await createRateLimiter(options);
  }
  return rateLimiterInstance;
};

export default getRateLimiter; 