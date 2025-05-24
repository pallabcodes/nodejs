export const response = (
  res,
  data = null,
  message = 'Success',
  status = 200,
  meta = {},
  locale = 'en',
  pagination = null
) => {
  return res.status(status).json({
    success: status < 400,
    message,
    data,
    meta,
    pagination,
    locale,
    timestamp: new Date().toISOString(),
    traceId: res.locals?.traceId || null
  });
};

export const errorResponse = (
  res,
  error,
  status = 500,
  meta = {},
  validation = null,
  locale = 'en'
) => {
  return res.status(status).json({
    success: false,
    message: error.message || 'Internal Server Error',
    error: {
      code: error.code || 'INTERNAL_ERROR',
      details: error.details || null,
      ...(process.env.NODE_ENV !== 'production' && error.stack
        ? { stack: error.stack }
        : {})
    },
    validation,
    meta,
    locale,
    timestamp: new Date().toISOString(),
    traceId: res.locals?.traceId || null
  });
};