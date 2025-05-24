import { compose } from '../shared/utils/compose.js';
import { authBasePipeline } from './authBasePipeline.js';
import { createValidatedMiddleware } from '../shared/middlewares/validate.js';
import { loginSchema } from '../modules/auth/schemas/loginSchema.js';
import { cacheCheck } from '../modules/auth/middlewares/cacheCheck.js';

export default compose(
  authBasePipeline,
  createValidatedMiddleware(loginSchema),
  cacheCheck
);