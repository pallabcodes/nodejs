import { createError } from './error.js';

// Response status codes
export const StatusCode = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Response types for different scenarios
export const ResponseType = {
  SUCCESS: 'success',
  ERROR: 'error',
  VALIDATION_ERROR: 'validation_error',
  BUSINESS_ERROR: 'business_error',
  AUTH_ERROR: 'auth_error',
  RATE_LIMIT_ERROR: 'rate_limit_error'
};

// Metadata structure for pagination, filtering, etc.
export const createMetadata = ({
  page = 1,
  limit = 10,
  total = 0,
  filters = {},
  sort = {},
  ...extra
} = {}) => ({
  pagination: {
    page: Number(page),
    limit: Number(limit),
    total: Number(total),
    pages: Math.ceil(total / limit)
  },
  filters,
  sort,
  ...extra
});

// Create a standardized success response
export const createSuccessResponse = (data, metadata = null, message = 'Success') => ({
  type: ResponseType.SUCCESS,
  status: StatusCode.OK,
  message,
  data,
  metadata,
  timestamp: new Date().toISOString()
});

// Create a standardized error response
export const createErrorResponse = (error, type = ResponseType.ERROR) => {
  const status = error.status || StatusCode.INTERNAL_SERVER_ERROR;
  const message = error.message || 'An unexpected error occurred';
  const code = error.code || 'INTERNAL_ERROR';

  const response = {
    type,
    status,
    message,
    code,
    timestamp: new Date().toISOString()
  };

  // Add validation errors if present
  if (type === ResponseType.VALIDATION_ERROR && error.errors) {
    response.errors = error.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  return response;
};

// Response middleware factory
export const createResponseMiddleware = () => {
  return (req, res, next) => {
    try {
      // Store original res.json
      const originalJson = res.json;

      // Override res.json to use our standardized format
      res.json = function(data) {
        // If data is already a standardized response, use it
        if (data && typeof data === 'object' && 'type' in data) {
          return originalJson.call(this, data);
        }

        // Otherwise, wrap it in a success response
        const response = createSuccessResponse(data);
        return originalJson.call(this, response);
      };

      // Add helper methods to response object
      res.success = function(data, metadata, message) {
        return this.status(StatusCode.OK)
          .json(createSuccessResponse(data, metadata, message));
      };

      res.created = function(data, metadata, message = 'Resource created successfully') {
        return this.status(StatusCode.CREATED)
          .json(createSuccessResponse(data, metadata, message));
      };

      res.error = function(error) {
        const response = createErrorResponse(error);
        return this.status(response.status).json(response);
      };

      res.validationError = function(error) {
        const response = createErrorResponse(error, ResponseType.VALIDATION_ERROR);
        return this.status(StatusCode.UNPROCESSABLE_ENTITY).json(response);
      };

      res.businessError = function(error) {
        const response = createErrorResponse(error, ResponseType.BUSINESS_ERROR);
        return this.status(error.status || StatusCode.BAD_REQUEST).json(response);
      };

      res.authError = function(error) {
        const response = createErrorResponse(error, ResponseType.AUTH_ERROR);
        return this.status(StatusCode.UNAUTHORIZED).json(response);
      };

      res.rateLimitError = function(error) {
        const response = createErrorResponse(error, ResponseType.RATE_LIMIT_ERROR);
        return this.status(StatusCode.TOO_MANY_REQUESTS).json(response);
      };

      next();
    } catch (error) {
      // Handle any uncaught errors
      const response = createErrorResponse(error);
      res.status(response.status).json(response);
    }
  };
}; 