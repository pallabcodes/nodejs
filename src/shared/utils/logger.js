// Pure function to create log entry
const createLogEntry = (level, message, meta = {}) => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...meta
});

// Pure function to format log entry
const formatLogEntry = (entry) => {
  const { timestamp, level, message, ...meta } = entry;
  return JSON.stringify({ timestamp, level, message, ...meta });
};

// Pure function to write log
const writeLog = (level, message, meta = {}) => {
  const entry = createLogEntry(level, message, meta);
  const formattedLog = formatLogEntry(entry);
  
  if (level === 'error') {
    console.error(formattedLog);
  } else if (level === 'warn') {
    console.warn(formattedLog);
  } else {
    console.log(formattedLog);
  }
  
  return entry;
};

// Pure functions for different log levels
const info = (message, meta = {}) => writeLog('info', message, meta);
const warn = (message, meta = {}) => writeLog('warn', message, meta);
const error = (message, meta = {}) => writeLog('error', message, meta);

// Export all logger functions
export {
  info,
  warn,
  error,
  createLogEntry,
  formatLogEntry,
  writeLog
};
