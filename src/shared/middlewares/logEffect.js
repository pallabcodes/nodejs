// src/middlewares/logEffect.js

const logEffect = (message) => ({ type: 'log', message });

const loggingMiddleware = (ctx) => {
  return {
    ctx,
    effects: [logEffect(`Request made to ${ctx.req.originalUrl}`)],
  };
};

module.exports = { logEffect, loggingMiddleware };
