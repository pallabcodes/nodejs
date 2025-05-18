import { createClient } from 'redis';
import { Logger } from './logger.js';

const EVENT_TYPES = {
  AUTH: 'auth',
  DATA_ACCESS: 'data_access',
  CONFIG_CHANGE: 'config_change',
  SECURITY: 'security',
  SYSTEM: 'system'
};

const SEVERITY_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

class AuditEvent {
  constructor(type, data, options = {}) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.timestamp = new Date();
    this.data = data;
    this.severity = options.severity || SEVERITY_LEVELS.INFO;
    this.userId = options.userId;
    this.ipAddress = options.ipAddress;
    this.userAgent = options.userAgent;
    this.resource = options.resource;
    this.action = options.action;
    this.status = options.status;
    this.metadata = options.metadata || {};
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      data: this.data,
      severity: this.severity,
      userId: this.userId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      resource: this.resource,
      action: this.action,
      status: this.status,
      metadata: this.metadata
    };
  }
}

const createAuditLogger = async (options = {}) => {
  const {
    redisUrl = process.env.REDIS_URL,
    storageType = process.env.AUDIT_LOG_STORAGE || 'memory',
    retentionDays = 90,
    logger = Logger
  } = options;

  let storage;
  let redisClient;

  if (storageType === 'redis' && redisUrl) {
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();

    storage = {
      async append(event) {
        const key = `audit:${event.type}:${event.timestamp.toISOString().split('T')[0]}`;
        await redisClient.lPush(key, JSON.stringify(event));
        // Set expiration for the key
        await redisClient.expire(key, retentionDays * 24 * 60 * 60);
      },
      async query(type, startDate, endDate) {
        const keys = await redisClient.keys(`audit:${type}:*`);
        const events = [];
        
        for (const key of keys) {
          const date = key.split(':')[2];
          if (date >= startDate && date <= endDate) {
            const items = await redisClient.lRange(key, 0, -1);
            events.push(...items.map(item => JSON.parse(item)));
          }
        }
        
        return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
    };
  } else {
    const events = new Map();
    
    storage = {
      async append(event) {
        const date = event.timestamp.toISOString().split('T')[0];
        const key = `audit:${event.type}:${date}`;
        if (!events.has(key)) {
          events.set(key, []);
        }
        events.get(key).push(event);
        
        // Cleanup old events
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - retentionDays);
        
        for (const [key, value] of events.entries()) {
          const date = key.split(':')[2];
          if (new Date(date) < cutoff) {
            events.delete(key);
          }
        }
      },
      async query(type, startDate, endDate) {
        const results = [];
        for (const [key, value] of events.entries()) {
          const [_, eventType, date] = key.split(':');
          if (eventType === type && date >= startDate && date <= endDate) {
            results.push(...value);
          }
        }
        return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
    };
  }

  const log = async (type, data, options = {}) => {
    const event = new AuditEvent(type, data, options);
    
    try {
      await storage.append(event);
      
      // Log to application logger based on severity
      const logMessage = `[AUDIT] ${type}: ${options.action || 'unknown action'} by ${options.userId || 'unknown user'}`;
      const logMeta = {
        auditEventId: event.id,
        ...event.toJSON()
      };

      switch (event.severity) {
        case SEVERITY_LEVELS.CRITICAL:
          logger.error(logMessage, logMeta);
          break;
        case SEVERITY_LEVELS.ERROR:
          logger.error(logMessage, logMeta);
          break;
        case SEVERITY_LEVELS.WARNING:
          logger.warn(logMessage, logMeta);
          break;
        default:
          logger.info(logMessage, logMeta);
      }

      return event;
    } catch (error) {
      logger.error('Failed to log audit event', {
        error: error.message,
        event: event.toJSON()
      });
      throw error;
    }
  };

  const query = async (type, startDate, endDate) => {
    return storage.query(type, startDate, endDate);
  };

  const middleware = () => {
    return async (req, res, next) => {
      const originalEnd = res.end;
      
      // Capture request details
      const requestDetails = {
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        resource: req.path,
        action: req.method,
        metadata: {
          headers: {
            ...req.headers,
            authorization: req.headers.authorization ? '[REDACTED]' : undefined
          },
          query: req.query,
          body: req.body ? '[REDACTED]' : undefined
        }
      };

      // Override end to capture response
      res.end = function(chunk, encoding) {
        const responseDetails = {
          ...requestDetails,
          status: res.statusCode
        };

        // Log the request
        log(EVENT_TYPES.SYSTEM, {
          request: {
            method: req.method,
            path: req.path,
            status: res.statusCode
          }
        }, responseDetails).catch(error => {
          logger.error('Failed to log audit event in middleware', { error: error.message });
        });

        // Call original end
        originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  };

  const cleanup = async () => {
    if (redisClient) {
      await redisClient.quit();
    }
  };

  return {
    log,
    query,
    middleware,
    cleanup,
    EVENT_TYPES,
    SEVERITY_LEVELS
  };
};

// Create singleton instance
let auditLoggerInstance = null;

const getAuditLogger = async (options) => {
  if (!auditLoggerInstance) {
    auditLoggerInstance = await createAuditLogger(options);
  }
  return auditLoggerInstance;
};

export { getAuditLogger as AuditLogger, EVENT_TYPES, SEVERITY_LEVELS }; 