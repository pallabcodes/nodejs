// src/middlewares/fork.js
const { ok, err, isErr } = require('../utils/result');

const forkMiddleware = (branches) => async (ctx) => {
  const results = await Promise.all(branches.map(mw => mw({ ...ctx })));
  return results.some(isErr) ? err(new Error('One or more branches failed'), 'FORK_FAILURE') : ok(ctx);
};

module.exports = forkMiddleware;
