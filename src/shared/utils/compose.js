import { isErr } from './result.js';


// Enhance your compose utility to export middleware names and durations

/**
 * * Composes multiple middleware functions into a single middleware function.
 * * * This function executes each middleware in sequence, passing the context
 * *   object to each middleware.
 * * * If a middleware returns an error, the pipeline stops and the error is passed to the next handler.
 * * * If a middleware returns a value, it is merged into the context object.
 * * * * @param {...Function} middlewares - The middleware functions to compose.
 * * @returns {Function} A single middleware function that executes the composed middlewares.
 * *
 * @example
 * import { compose } from './utils/compose.js';
 * import { authMiddleware } from './middlewares/auth.js';
 * import { loggingMiddleware } from './middlewares/logging.js';
 * * const composedMiddleware = compose(
 *   authMiddleware,
 *  loggingMiddleware
 * * );
 * * // Use the composed middleware in an Express route
 * * app.use('/api', composedMiddleware);
 * * @description
 * * This utility function allows you to compose multiple middleware functions into a single
 * * middleware function. Each middleware can modify the context object, and if any middleware
 * * returns an error, the pipeline stops and the error is passed to the next handler.
 * * The function also tracks the names and execution durations of each middleware, which can be
 * * useful for debugging and performance monitoring.
 * * @remarks
 * * - Each middleware should return an object with a `value` property for successful execution,
 * *   or an object with an `error` property for error handling.
 * * - The context object is passed to each middleware, allowing them to share data.
 * * - The function supports skipping or branching logic by returning an object with `skip` or `branch` properties.
 * * - The final context object is available in `req.pipelineMetadata`, which includes the names of the middlewares and their execution timings.
 * how to debug and monitor the performance of your middleware pipeline.
 * * @remarks
 * * - Each middleware should return an object with a `value` property for successful execution,
 * *   or an object with an `error` property for error handling.
 * * - The context object is passed to each middleware, allowing them to share data.
 * * - The function supports skipping or branching logic by returning an object with `skip` or `branch` properties.
 * * - The final context object is available in `req.pipelineMetadata`, which includes the names of the middlewares and their execution timings. 
 * * @example
 * * import { compose } from './utils/compose.js';
 * * * // Example middlewares
 * * const authMiddleware = async (ctx) => {
 *   // Perform authentication logic
 *  if (!ctx.req.user) {
 *   return { error: new Error('Unauthorized') };
 *  }
 *  return { value: { user: ctx.req.user } };
 * * };
 * * const loggingMiddleware = async (ctx) => {
 *  console.log(`Request made by user: ${ctx.req.user.id}`);
 *  return ok(ctx);
 * };
 * * * // Composing middlewares
 * * const composedMiddleware = compose(
 *  authMiddleware,
 * loggingMiddleware
 *  );
 * * // Use the composed middleware in an Express route
 * * app.use('/api', composedMiddleware);
 * * @description
 * * This utility function allows you to compose multiple middleware functions into a single
 * * middleware function. Each middleware can modify the context object, and if any middleware
 * * returns an error, the pipeline stops and the error is passed to the next handler.
 * * The function also tracks the names and execution durations of each middleware, which can be
 * * useful for debugging and performance monitoring.
 * Now, how easy is it for readability and maintainability?
 * * @remarks
 * * - Each middleware should return an object with a `value` property for successful execution,
 * *   or an object with an `error` property for error handling.
 * * - The context object is passed to each middleware, allowing them to share data.
 * * - The function supports skipping or branching logic by returning an object with `skip` or `branch` properties.
 * * - The final context object is available in `req.pipelineMetadata`, which includes the names of the middlewares and their execution timings.
 *  * @example
 * * import { compose } from './utils/compose.js';
 * * // Example middlewares
 * * const authMiddleware = async (ctx) => {
 * *   // Perform authentication logic
 * *   if (!ctx.req.user) {
 * *     return { error: new Error('Unauthorized') };
 * *   }
 * *   return { value: { user: ctx.req.user } };
 * * };
 * * const loggingMiddleware = async (ctx) => {
 * *   console.log(`Request made by user: ${ctx.req.user.id}`);
 * *   return ok(ctx);
 * * };
 * * // Composing middlewares
 * * const composedMiddleware = compose(
 * *   authMiddleware,
 * *   loggingMiddleware
 * * );
 * now, how easy it attach a breakpoint with debugger and inspect the context object? let's see through an actual example, let' see though a code example:
 * 
 *  
 * now, le's write jsdoc for this function
 * * @function compose
 * * @param {...Function} middlewares - The middleware functions to compose.
 * * @returns {Function} A single middleware function that executes the composed middlewares.
 * * @description
 * * This utility function allows you to compose multiple middleware functions into a single
 * * middleware function. Each middleware can modify the context object, and if any middleware
 * * returns an error, the pipeline stops and the error is passed to the next handler.
 * * The function also tracks the names and execution durations of each middleware, which can be
 * * useful for debugging and performance monitoring.
 * 
*/
export const compose = (...middlewares) => {
  const names = middlewares.map(mw => mw.name || 'anonymous');
  return async (req, res, next) => {
    try {
      const ctx = { req, res };
      const timings = [];
      for (const middleware of middlewares) {
        const start = Date.now();
        const result = await middleware(ctx);
        timings.push({ name: middleware.name, duration: Date.now() - start });

        if (isErr(result)) {
          req.pipelineMetadata = { names, timings };
          return next(result.error);
        }
        if (result && result.skip) {
          req.pipelineMetadata = { names, timings, skip: true };
          break; // Stop running further middleware
        }
        if (result && result.branch) {
          req.pipelineMetadata = { names, timings, branch: result.branch };
          break; // Stop running further middleware
        }
        Object.assign(ctx, result.value);
      }
      req.pipelineMetadata = req.pipelineMetadata || { names, timings };
      return next();
    } catch (error) {
      return next(error);
    }
  };
};