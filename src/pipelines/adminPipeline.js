// src/pipelines/adminPipeline.js
import { compose } from '../shared/utils/compose.js';
import { requestContext } from '../shared/middlewares/requestContext.js';
import { createAuthMiddleware } from '../shared/middlewares/auth.js';
import { checkPermissions } from '../shared/middlewares/permission.js';
import { PERMISSIONS } from '../shared/config/permissions.js';
import { snapshotMiddleware } from '../shared/middlewares/snapshot.js';
import jwt from 'jsonwebtoken';

const auth = createAuthMiddleware(jwt, process.env.JWT_SECRET);

export default compose(
  requestContext,
  auth,
  checkPermissions([PERMISSIONS.DELETE_USER]),
  snapshotMiddleware
);
