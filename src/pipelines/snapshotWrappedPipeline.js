// src/pipelines/snapshotWrappedPipeline.js
const compose = require('../utils/compose');
const requestContext = require('../middlewares/requestContext');
const createSnapshotManager = require('../utils/snapshotManager');

const snapshot = createSnapshotManager();

const snapshotWrapper = async (ctx) => {
  snapshot.snapshot(ctx);
  const result = await Promise.resolve({ ok: true, ctx });
  snapshot.snapshot(result.ctx);
  return result;
};

module.exports = compose(
  requestContext,
  snapshotWrapper
);
