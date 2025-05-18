// src/middlewares/validate.js
const { ok, err } = require('../utils/result');

const createValidatedMiddleware = (schema, middlewareFn) => {
  return async (ctx) => {
    try {
      await schema.validate(ctx.req.body);
    } catch (e) {
      return err(new Error(`Validation failed: ${e.message}`), 'VALIDATION_ERROR');
    }
    return middlewareFn(ctx);
  };
};

module.exports = createValidatedMiddleware;
