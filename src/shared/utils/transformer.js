// src/utils/transformer.js

const addTransformer = (ctx, key, fn) => {
  Object.defineProperty(ctx, key, {
    get: () => fn(ctx),
    configurable: true,
  });
  return ctx;
};

module.exports = addTransformer;
