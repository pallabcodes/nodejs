// src/middlewares/validate.js
import { ok, err } from '../utils/result.js';
import { createError } from '../utils/error.js';

export const createValidatedMiddleware = (schema) => {
  return async (ctx) => {
    try {
      const validationResult = await schema.validate(ctx.req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (validationResult.error) {
        const errors = validationResult.error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        return err(createError(400, 'Validation failed', 'VALIDATION_ERROR', errors));
      }

      // Replace request body with validated data
      ctx.req.body = validationResult.value;
      return ok(ctx);
    } catch (error) {
      return err(error);
    }
  };
};
