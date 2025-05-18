// src/middlewares/cancellation.js
const { ok, err } = require('../utils/result');

const cancellationMiddleware = async (ctx) => {
  if (ctx.cancelToken?.aborted || ctx.cancelToken?.isCancelled?.()) {
    return err(new Error('Request cancelled'), 'CANCELLED');
  }
  return ok(ctx);
};

module.exports = cancellationMiddleware;
