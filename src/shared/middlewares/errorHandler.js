// src/middlewares/errorHandler.js
import { Logger } from '../../infrastructure/logger.js';

// Pure function to create error response
const createErrorResponse = (error, status) => ({
  error: {
    message: error.message,
    status,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  }
});

// Pure function to create error handler middleware
const createErrorHandler = () => (err, req, res, next) => {
  const status = err.status || 500;
  const response = createErrorResponse(err, status);
  
  Logger.error(err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    status
  });
  
  res.status(status).json(response);
};

// Export error handler factory
export { createErrorHandler };
