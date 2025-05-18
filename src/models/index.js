import database from '../config/database.js';
import User from '../modules/users/models/UserModel.js';
// Add service discovery
import { ServiceRegistry } from '../infrastructure/service-registry.js';
// Add circuit breaker
import { CircuitBreaker } from '../infrastructure/circuit-breaker.js';
// Add distributed tracing
import { Tracer } from '../infrastructure/tracer.js';
// Add structured logging
import { Logger } from '../infrastructure/logger.js';
// Add metrics
import { Metrics } from '../infrastructure/metrics.js';
// Add APM
import { APM } from '../infrastructure/apm.js';
// Add rate limiting
import { RateLimiter } from '../infrastructure/rate-limiter.js';
// Add API key management
import { APIKeyManager } from '../infrastructure/api-key-manager.js';
// Add audit logging
import { AuditLogger } from '../infrastructure/audit-logger.js';
// Add caching
import { Cache } from '../infrastructure/cache.js';
// Add read/write separation
import { DatabaseCluster } from '../infrastructure/database-cluster.js';

// Pure function to initialize model associations
const initializeAssociations = (models) => {
  Object.values(models).forEach(model => {
    if (typeof model.associate === 'function') {
      model.associate(models);
    }
  });
  return models;
};

// Pure function to create model registry
const createModelRegistry = () => ({
  User
});

// Pure function to create database configuration
const createDatabaseConfig = () => ({
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Pure function to create application dependencies
const createAppDependencies = () => ({
  database,
  models: createModelRegistry(),
  config: createDatabaseConfig()
});

// Initialize models with associations
const models = initializeAssociations(createModelRegistry());

// Export all necessary functions and objects
export {
  models,
  createModelRegistry,
  createDatabaseConfig,
  createAppDependencies,
  initializeAssociations
};

// Instead of direct imports
const createApp = (dependencies) => {
  const { database, models, routes } = dependencies;
  // ... rest of the code
};

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const app = pipe(
  createApp,
  setupRoutes,
  setupHealthCheck,
  setupErrorHandling
)({ database, models, routes });