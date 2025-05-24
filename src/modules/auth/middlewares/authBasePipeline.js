import { compose } from '../shared/utils/compose.js';
import { immutableContext } from './immutableContext.js';
import { requestContext } from '../shared/middlewares/requestContext.js';

export const authBasePipeline = compose(
  immutableContext,
  requestContext
);