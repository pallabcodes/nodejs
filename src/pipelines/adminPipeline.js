// src/pipelines/adminPipeline.js
const compose = require('../utils/compose');
const requestContext = require('../middlewares/requestContext');
const createAuthMiddleware = require('../middlewares/auth');
const { checkPermissions } = require('../middlewares/permission');
const { PERMISSIONS } = require('../config/permissions');
const snapshotMiddleware = require('../middlewares/snapshot');

const auth = createAuthMiddleware(require('jsonwebtoken'), process.env.JWT_SECRET);

module.exports = compose(
  requestContext,
  auth,
  snapshotMiddleware([]),
  checkPermissions([PERMISSIONS.DELETE_USER])
);
