import { compose } from '../shared/utils/compose.js';
import { immutableContext } from './immutableContext.js'; // <-- ADD THIS
import { requestContext } from '../shared/middlewares/requestContext.js';
import { createAuthMiddleware } from '../shared/middlewares/auth.js';
import { checkPermissions } from '../shared/middlewares/permission.js';
import { PERMISSIONS } from '../shared/config/permissions.js';
import { snapshotMiddleware } from '../shared/middlewares/snapshot.js';
import jwt from 'jsonwebtoken';

const auth = createAuthMiddleware(jwt, process.env.JWT_SECRET);

export default compose(
  immutableContext, // <-- ADD THIS AS FIRST
  cacheCheck, // <-- Will skip if cache is valid/hit
  analyticsBranch, // <-- Will branch if analytics queryParam is present
  requestContext,
  auth,
  checkPermissions([PERMISSIONS.DELETE_USER]),
  snapshotMiddleware
);

// Do the same for userPipeline.js, dslPipeline.js, etc.

/**
 * If cacheCheck returns { skip: true }, the pipeline stops and no further middleware runs.
 * 
 * If analyticsBranch returns { branch: "analytics" }, the pipeline stops, and you can inspect req.pipelineMetadata.branch for custom handling/logging.
 * 
 * If neither returs a skip or branch, the pipeline continues to run the remaining middlewares. 
*/