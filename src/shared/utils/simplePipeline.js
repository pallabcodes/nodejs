// A simplified pipeline interface for common use cases
import { compose } from './compose.js';

/**
 * Creates a simplified, fluent pipeline for common middleware patterns.
 * 
 * Choose this pipeline when:
 * - You need a simple, chainable API
 * - You're working with standard middleware (auth, validation, caching)
 * - You don't need advanced features like snapshots or DSL
 * 
 * For more advanced use cases, consider:
 * - dslPipeline: For complex, conditional routing logic
 * - monoidPipeline: For algebraic composition and pure FP
 * - snapshotWrappedPipeline: For undo/redo support
 * 
 * @example
 * const pipeline = createSimplePipeline()
 *   .auth()
 *   .validate(schema)
 *   .cache()
 *   .requirePermissions(['CREATE_USER'])
 *   .build();
 */
export const createSimplePipeline = () => {
  const middlewares = [];

  return {
    // Authentication
    auth() {
      middlewares.push(createAuthMiddleware());
      return this;
    },

    // Validation
    validate(schema) {
      middlewares.push(createValidatedMiddleware(schema));
      return this;
    },

    // Caching
    cache() {
      middlewares.push(cacheCheck);
      return this;
    },

    // Permissions
    requirePermissions(permissions) {
      middlewares.push(checkPermissions(permissions));
      return this;
    },

    // Role check
    requireRoles(roles) {
      middlewares.push(checkRole(roles));
      return this;
    },

    // Custom middleware
    use(middleware) {
      middlewares.push(middleware);
      return this;
    },

    // Build the pipeline
    build() {
      return compose(...middlewares);
    }
  };
};
