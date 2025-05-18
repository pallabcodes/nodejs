import { createWriteStream } from 'fs';
import { join } from 'path';
import { format } from 'util';

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

const createLogger = (options = {}) => {
  const {
    level = process.env.LOG_LEVEL || 'INFO',
    serviceName = process.env.SERVICE_NAME || 'api-service',
    logToFile = process.env.LOG_TO_FILE === 'true',
    logDir = process.env.LOG_DIR || 'logs',
    logFormat = process.env.LOG_FORMAT || 'json'
  } = options;

  const currentLevel = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
  let fileStream = null;

  if (logToFile) {
    const logFile = join(logDir, `${serviceName}-${new Date().toISOString().split('T')[0]}.log`);
    fileStream = createWriteStream(logFile, { flags: 'a' });
  }

  const formatLog = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: serviceName,
      message,
      ...meta
    };

    if (logFormat === 'json') {
      return JSON.stringify(logEntry) + '\n';
    }

    // Text format
    return format(
      '[%s] %s %s: %s %s\n',
      timestamp,
      level,
      serviceName,
      message,
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    );
  };

  const writeLog = (level, message, meta = {}) => {
    if (LOG_LEVELS[level] > currentLevel) return;

    const formattedLog = formatLog(level, message, meta);
    
    // Write to console
    if (level === 'ERROR') {
      console.error(formattedLog);
    } else if (level === 'WARN') {
      console.warn(formattedLog);
    } else {
      console.log(formattedLog);
    }

    // Write to file if enabled
    if (fileStream) {
      fileStream.write(formattedLog);
    }
  };

  const error = (message, meta = {}) => {
    writeLog('ERROR', message, meta);
  };

  const warn = (message, meta = {}) => {
    writeLog('WARN', message, meta);
  };

  const info = (message, meta = {}) => {
    writeLog('INFO', message, meta);
  };

  const debug = (message, meta = {}) => {
    writeLog('DEBUG', message, meta);
  };

  const trace = (message, meta = {}) => {
    writeLog('TRACE', message, meta);
  };

  const close = () => {
    if (fileStream) {
      fileStream.end();
      fileStream = null;
    }
  };

  // Add request logging middleware
  const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, url, headers, body } = req;

    // Log request
    info('Incoming request', {
      method,
      url,
      headers: {
        ...headers,
        authorization: headers.authorization ? '[REDACTED]' : undefined
      },
      body: body ? '[REDACTED]' : undefined
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      info('Request completed', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`
      });
    });

    next();
  };

  return {
    error,
    warn,
    info,
    debug,
    trace,
    close,
    requestLogger,
    LOG_LEVELS
  };
};

// Singleton instance
const logger = createLogger();

export { logger as Logger, LOG_LEVELS }; 