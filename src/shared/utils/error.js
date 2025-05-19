export class AppError extends Error {
  constructor(status, message, code = 'APP_ERROR') {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

export const createError = (status, message, code) => {
  return new AppError(status, message, code);
};

export const isAppError = (error) => {
  return error instanceof AppError;
};

export const handleError = (error) => {
  if (isAppError(error)) {
    return {
      status: error.status,
      message: error.message,
      code: error.code,
      timestamp: error.timestamp
    };
  }

  // Handle unknown errors
  return {
    status: 500,
    message: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };
}; 