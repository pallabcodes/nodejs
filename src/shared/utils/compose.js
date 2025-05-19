import { isErr, ok } from './result.js';

export const compose = (...middlewares) => {
  return async (req, res, next) => {
    try {
      const ctx = { req, res };
      
      for (const middleware of middlewares) {
        const result = await middleware(ctx);
        if (isErr(result)) {
          return next(result.error);
        }
        Object.assign(ctx, result.value);
      }
      
      return next();
    } catch (error) {
      return next(error);
    }
  };
};
