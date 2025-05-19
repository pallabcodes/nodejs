// src/pipelines/dslPipeline.js

import { createPipeline } from '../shared/middlewares/dsl.js';
import { createAuthMiddleware } from '../shared/middlewares/auth.js';
import { PERMISSIONS } from '../shared/config/permissions.js';
import { checkPermissions } from '../shared/middlewares/permission.js';
import { requestContext } from '../shared/middlewares/requestContext.js';
import jwt from 'jsonwebtoken';

const auth = createAuthMiddleware(jwt, process.env.JWT_SECRET);

// Create a pipeline using the DSL
export const pipeline = createPipeline()
  .use(requestContext)
  .use(auth)
  .use(checkPermissions([PERMISSIONS.ADMIN]))
  .withErrorHandler((error) => {
    console.error('Pipeline error:', error);
    return { error };
  });

export default pipeline.build();
