// src/middlewares/cancellation.js
import { ok, err } from '../utils/result.js';
import { createError } from '../utils/error.js';

export const cancellationMiddleware = async (ctx) => {
  try {
    const { req } = ctx;
    
    // Check if request was aborted
    if (req.aborted) {
      return err(createError(499, 'Client closed request', 'REQUEST_CANCELLED'));
    }

    // Add abort handler
    req.on('aborted', () => {
      // Clean up any resources if needed
      console.log('Request aborted:', req.requestContext?.id);
    });

    return ok(ctx);
  } catch (error) {
    return err(error);
  }
};
