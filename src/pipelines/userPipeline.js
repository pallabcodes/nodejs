// src/pipelines/userPipeline.js
import { compose } from '../shared/utils/compose.js';
import { requestContext } from '../shared/middlewares/requestContext.js';
import { createAuthMiddleware } from '../shared/middlewares/auth.js';
import { checkPermissions } from '../shared/middlewares/permission.js';
import { PERMISSIONS } from '../shared/config/permissions.js';
import { validateUserSchema } from '../modules/users/schemas/userSchema.js';
import { createValidatedMiddleware } from '../shared/middlewares/validate.js';
import { cancellationMiddleware } from '../shared/middlewares/cancellation.js';
import { logger } from '../shared/utils/logger.js';
import { lazy } from '../shared/middlewares/lazy.js';
import jwt from 'jsonwebtoken';

const auth = createAuthMiddleware(jwt, process.env.JWT_SECRET);

export default compose(
  requestContext,
  lazy(() => logger),
  cancellationMiddleware,
  createValidatedMiddleware(validateUserSchema),
  auth,
  checkPermissions([PERMISSIONS.CREATE_USER])
);
