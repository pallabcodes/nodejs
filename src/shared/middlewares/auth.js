import { ok, err } from '../utils/result.js';
import { createError } from '../utils/error.js';

export const createAuthMiddleware = (jwt, secret) => {
  return async (ctx) => {
    try {
      const authHeader = ctx.req.headers.authorization;
      
      if (!authHeader) {
        throw createError(401, 'No authorization header');
      }

      const [type, token] = authHeader.split(' ');
      
      if (type !== 'Bearer' || !token) {
        throw createError(401, 'Invalid authorization format');
      }

      const decoded = jwt.verify(token, secret);
      ctx.req.user = decoded;

      return ok(ctx);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return err(createError(401, 'Invalid token'));
      }
      if (error.name === 'TokenExpiredError') {
        return err(createError(401, 'Token expired'));
      }
      return err(error);
    }
  };
}; 