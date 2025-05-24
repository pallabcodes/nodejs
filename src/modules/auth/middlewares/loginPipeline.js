// import { compose } from '../../../shared/utils/compose.js';
// import { immutableContext } from '../../../pipelines/immutableContext.js';
// import { requestContext } from '../../../shared/middlewares/requestContext.js';
// import { createValidatedMiddleware } from '../../../shared/middlewares/validate.js';
// import { loginSchema } from '../schemas/loginSchema.js';
// import { cacheCheck } from './cacheCheck.js';

// export default compose(
//   immutableContext,
//   requestContext,
//   createValidatedMiddleware(loginSchema),
//   cacheCheck
// );


// now, with the authBasePipeline
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