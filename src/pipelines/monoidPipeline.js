// src/pipelines/monoidPipeline.js
import { composePipelines, emptyMiddleware } from '../shared/middlewares/monoids.js';
import { requestContext } from '../shared/middlewares/requestContext.js';
import { cancellationMiddleware } from '../shared/middlewares/cancellation.js';

// Create a base pipeline with common middleware
const basePipeline = composePipelines(
  requestContext,
  cancellationMiddleware
);

// Create an extended pipeline that adds custom middleware
export const createExtendedPipeline = (customMiddleware) => {
  return composePipelines(
    basePipeline,
    customMiddleware || emptyMiddleware
  );
};

// Export a default pipeline with no custom middleware
export default basePipeline;
