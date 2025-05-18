const { isErr, ok } = require('./result');

const compose = (...middlewares) => async (ctx) => {
  let currentCtx = ctx;
  
  for (const mw of middlewares) {
    const result = await mw(currentCtx);
    if (isErr(result)) return result;
    currentCtx = result.ctx;
  }
  
  return ok(currentCtx);
};

module.exports = compose;
