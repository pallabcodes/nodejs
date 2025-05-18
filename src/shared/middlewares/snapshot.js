// src/middlewares/snapshot.js
const { ok } = require('../utils/result');

const snapshotMiddleware = (snapshots = []) => async (ctx) => {
  snapshots.push(JSON.parse(JSON.stringify(ctx)));
  return ok(ctx);
};

module.exports = snapshotMiddleware;
