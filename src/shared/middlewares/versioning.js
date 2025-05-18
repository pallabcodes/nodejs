// src/middlewares/versioning.js
const { ok, err } = require('../utils/result');
const semver = require('semver');

const versionedMiddleware = (handlers) => async (ctx) => {
  const version = ctx.version || '1.0.0';
  if (handlers[version]) {
    return handlers[version](ctx);
  }
  return err(new Error(`Unsupported context version: ${version}`), 'VERSION_MISMATCH');
};

const versionedMiddlewareStrict = (mw, requiredVersion) => async (ctx) => {
  if (!semver.satisfies(ctx.version, requiredVersion)) {
    return err(new Error(`Context version ${ctx.version} does not satisfy ${requiredVersion}`), 'VERSION_CHECK_FAILED');
  }
  return mw(ctx);
};

module.exports = { versionedMiddleware, versionedMiddlewareStrict };
