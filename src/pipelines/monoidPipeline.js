// src/pipelines/monoidPipeline.js
const { composePipelines, emptyMiddleware } = require('../middlewares/monoids');
const requestContext = require('../middlewares/requestContext');
const cancellationMiddleware = require('../middlewares/cancellation');

const basic = composePipelines(
  requestContext,
  cancellationMiddleware
);

const extended = composePipelines(
  basic,
  async (ctx) => ({ ok: true, ctx: { ...ctx, fromMonoid: true } })
);

module.exports = extended;
