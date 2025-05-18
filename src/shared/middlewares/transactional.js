// src/middlewares/transactional.js
const { isErr, err } = require('../utils/result');

const transactionalMiddleware = (mw) => async (ctx) => {
  const rollbackStack = [];
  ctx.registerRollback = (fn) => rollbackStack.push(fn);

  try {
    const result = await mw(ctx);
    if (isErr(result)) throw result.error;
    return result;
  } catch (e) {
    for (const undo of rollbackStack.reverse()) {
      try { await undo(); } catch (_) {}
    }
    return err(e, 'TXN_ROLLBACK');
  }
};

module.exports = transactionalMiddleware;
