import winston from 'winston';

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

// Custom format for log messages
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create logger instance
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    colorize(),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Export middleware factory
export const createLoggerMiddleware = () => {
  return async (ctx) => {
    const { req } = ctx;
    const start = Date.now();

    // Log request
    logger.info('Incoming request', {
      requestId: req.requestContext?.id,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Log response
    const originalEnd = ctx.res.end;
    ctx.res.end = function(chunk, encoding) {
      const duration = Date.now() - start;
      logger.info('Request completed', {
        requestId: req.requestContext?.id,
        statusCode: ctx.res.statusCode,
        duration: `${duration}ms`
      });
      return originalEnd.call(this, chunk, encoding);
    };

    return ctx;
  };
};
