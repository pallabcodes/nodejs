// src/middlewares/rateLimiter.js
const { ok, err } = require('../utils/result');

const rateLimiter = (limit, windowMs) => {
  const hits = new Map();

  return async (ctx) => {
    const key = ctx.user?.id || ctx.req.ip;
    const now = Date.now();
    if (!hits.has(key)) hits.set(key, []);
    const timestamps = hits.get(key).filter(ts => ts > now - windowMs);

    if (timestamps.length >= limit) {
      return err(new Error('Rate limit exceeded'), 'RATE_LIMIT');
    }

    timestamps.push(now);
    hits.set(key, timestamps);
    return ok(ctx);
  };
};

module.exports = rateLimiter;
