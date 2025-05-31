// import { Request, Response, NextFunction } from 'express';
// import rateLimit from 'express-rate-limit';
// import RedisStore from 'rate-limit-redis';
// import { createClient } from 'redis';
// import { RateLimitError } from '../core/errors/AppError';
// import { logger } from '../core/utils/logger';

// const redisClient = createClient({
//   url: process.env.REDIS_URL,
// });

// redisClient.on('error', (err) => {
//   logger.error('Redis Client Error:', err);
// });

// const createRateLimiter = (options: {
//   windowMs: number;
//   max: number;
//   keyPrefix?: string;
// }) => {
//   return rateLimit({
//     store: new RedisStore({
//       sendCommand: (...args: string[]) => redisClient.sendCommand(args),
//       prefix: options.keyPrefix || 'rl:',
//     }),
//     windowMs: options.windowMs,
//     max: options.max,
//     handler: (req: Request, res: Response) => {
//       logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
//       throw new RateLimitError();
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
//   });
// };

// // Different rate limiters for different endpoints
// export const globalLimiter = createRateLimiter({
//   windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: Number(process.env.RATE_LIMIT_MAX) || 100,
//   keyPrefix: 'global:',
// });

// export const authLimiter = createRateLimiter({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 5, // 5 attempts per hour
//   keyPrefix: 'auth:',
// });

// export const apiLimiter = createRateLimiter({
//   windowMs: 60 * 1000, // 1 minute
//   max: 30, // 30 requests per minute
//   keyPrefix: 'api:',
// });
