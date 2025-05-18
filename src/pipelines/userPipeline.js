// src/pipelines/userPipeline.js
const compose = require('../utils/compose');
const requestContext = require('../middlewares/requestContext');
const createAuthMiddleware = require('../middlewares/auth');
const { checkPermissions } = require('../middlewares/permission');
const { PERMISSIONS } = require('../config/permissions');
const { validateUserSchema } = require('../modules/users/schema');
const createValidatedMiddleware = require('../middlewares/validate');
const cancellationMiddleware = require('../middlewares/cancellation');
const logger = require('../utils/logger');
const lazy = require('../middlewares/lazy');

const auth = createAuthMiddleware(require('jsonwebtoken'), process.env.JWT_SECRET);
const validate = createValidatedMiddleware(validateUserSchema, async (ctx) => ({ ok: true, ctx }));

module.exports = compose(
  requestContext,
  auth,
  cancellationMiddleware,
  validate,
  checkPermissions([PERMISSIONS.CREATE_USER])
);
