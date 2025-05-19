import { isErr } from './result.js';

export const toExpress = (pipeline, handler) => {
  return async (req, res, next) => {
    try {
      // Run the pipeline
      await new Promise((resolve, reject) => {
        pipeline(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // If pipeline succeeds, run the handler
      const result = await handler(req, res);
      
      if (isErr(result)) {
        return next(result.error);
      }

      // If handler returns a value and response hasn't been sent
      if (result && !res.headersSent) {
        return res.json(result.value);
      }
    } catch (error) {
      next(error);
    }
  };
};
