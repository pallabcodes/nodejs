// src/middlewares/monoids.js
const { ok, isErr } = require('../utils/result');

const emptyMiddleware = async (ctx) => ok(ctx);

const composePipelines = (mw1, mw2) => async (ctx) => {
  const r1 = await mw1(ctx);
  if (isErr(r1)) return r1;
  return await mw2(r1.ctx);
};

module.exports = { emptyMiddleware, composePipelines };
