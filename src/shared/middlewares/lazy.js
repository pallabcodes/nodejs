// src/middlewares/lazy.js

import { ok } from '../utils/result.js';

export const lazy = (factory) => {
  let instance = null;

  return async (ctx) => {
    try {
      if (!instance) {
        instance = factory();
      }
      await instance(ctx);
      return ok(ctx);
    } catch (error) {
      console.error('Lazy middleware error:', error);
      return ok(ctx); // Don't fail the request
    }
  };
};
