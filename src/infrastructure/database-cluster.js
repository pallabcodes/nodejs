import { Sequelize } from 'sequelize';
import { Logger } from './logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { Metrics } from './metrics.js';

class DatabaseCluster {
  constructor(options = {}) {
    this.logger = options.logger || Logger;
    this.metrics = options.metrics || Metrics;
    this.circuitBreaker = options.circuitBreaker || CircuitBreaker;
    
    this.config = {
      write: options.write || {},
      read: options.read || [],
      pool: {
        max: options.pool?.max || 10,
        min: options.pool?.min || 0,
        acquire: options.pool?.acquire || 30000,
        idle: options.pool?.idle || 10000
      },
      dialect: options.dialect || 'mysql',
      logging: options.logging || false
    };

    this.connections = new Map();
    this.models = new Map();
    this.healthChecks = new Map();
  }

  async initialize() {
    try {
      // Initialize write connection
      const writeConnection = new Sequelize({
        ...this.config.write,
        dialect: this.config.dialect,
        pool: this.config.pool,
        logging: this.config.logging ? (msg) => this.logger.debug(msg) : false
      });

      await writeConnection.authenticate();
      this.connections.set('write', writeConnection);
      this.logger.info('Write database connection established');

      // Initialize read connections
      for (let i = 0; i < this.config.read.length; i++) {
        const readConfig = this.config.read[i];
        const readConnection = new Sequelize({
          ...readConfig,
          dialect: this.config.dialect,
          pool: this.config.pool,
          logging: this.config.logging ? (msg) => this.logger.debug(msg) : false
        });

        await readConnection.authenticate();
        this.connections.set(`read_${i}`, readConnection);
        this.logger.info(`Read database connection ${i} established`);

        // Setup health check
        this.setupHealthCheck(`read_${i}`, readConnection);
      }

      // Setup write connection health check
      this.setupHealthCheck('write', writeConnection);

      // Initialize circuit breakers
      this.setupCircuitBreakers();

      // Initialize metrics
      this.setupMetrics();

      return true;
    } catch (error) {
      this.logger.error('Failed to initialize database cluster', { error: error.message });
      throw error;
    }
  }

  setupHealthCheck(name, connection) {
    const check = async () => {
      try {
        await connection.authenticate();
        this.healthChecks.set(name, { status: 'healthy', lastCheck: new Date() });
        this.metrics.gauge(`db_${name}_health`, 1);
      } catch (error) {
        this.healthChecks.set(name, { 
          status: 'unhealthy', 
          lastCheck: new Date(),
          error: error.message 
        });
        this.metrics.gauge(`db_${name}_health`, 0);
        this.logger.error(`Database health check failed for ${name}`, { error: error.message });
      }
    };

    // Initial health check
    check();

    // Setup periodic health check
    const interval = setInterval(check, 30000); // Check every 30 seconds
    this.healthChecks.set(name, { interval });
  }

  setupCircuitBreakers() {
    // Circuit breaker for write operations
    this.circuitBreaker('db_write', {
      failureThreshold: 5,
      resetTimeout: 30000
    });

    // Circuit breakers for read operations
    this.connections.forEach((_, name) => {
      if (name.startsWith('read_')) {
        this.circuitBreaker(`db_${name}`, {
          failureThreshold: 3,
          resetTimeout: 15000
        });
      }
    });
  }

  setupMetrics() {
    // Track connection pool metrics
    const trackPoolMetrics = () => {
      this.connections.forEach((connection, name) => {
        const pool = connection.connectionManager.pool;
        this.metrics.gauge(`db_${name}_pool_size`, pool.size);
        this.metrics.gauge(`db_${name}_pool_available`, pool.available);
        this.metrics.gauge(`db_${name}_pool_borrowed`, pool.borrowed);
        this.metrics.gauge(`db_${name}_pool_pending`, pool.pending);
      });
    };

    setInterval(trackPoolMetrics, 5000); // Update metrics every 5 seconds
  }

  getWriteConnection() {
    return this.connections.get('write');
  }

  getReadConnection() {
    // Simple round-robin selection of read replicas
    const readConnections = Array.from(this.connections.entries())
      .filter(([name]) => name.startsWith('read_'))
      .filter(([name]) => this.healthChecks.get(name)?.status === 'healthy');

    if (readConnections.length === 0) {
      // Fallback to write connection if no healthy read replicas
      return this.getWriteConnection();
    }

    const index = Math.floor(Math.random() * readConnections.length);
    return readConnections[index][1];
  }

  async transaction(callback, options = {}) {
    const connection = this.getWriteConnection();
    const circuitBreaker = this.circuitBreaker('db_write');

    return circuitBreaker.execute(async () => {
      const transaction = await connection.transaction(options);
      try {
        const result = await callback(transaction);
        await transaction.commit();
        return result;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  async query(sql, options = {}) {
    const { useReadReplica = true, ...queryOptions } = options;
    const connection = useReadReplica ? this.getReadConnection() : this.getWriteConnection();
    const circuitBreaker = this.circuitBreaker(`db_${useReadReplica ? 'read' : 'write'}`);

    return circuitBreaker.execute(async () => {
      const start = Date.now();
      try {
        const result = await connection.query(sql, queryOptions);
        this.metrics.histogram('db_query_duration_seconds', (Date.now() - start) / 1000, {
          type: useReadReplica ? 'read' : 'write'
        });
        return result;
      } catch (error) {
        this.metrics.counter('db_query_errors_total', {
          type: useReadReplica ? 'read' : 'write',
          error: error.name
        });
        throw error;
      }
    });
  }

  defineModel(name, attributes, options = {}) {
    const connection = this.getWriteConnection();
    const model = connection.define(name, attributes, {
      ...options,
      modelName: name
    });

    this.models.set(name, model);
    return model;
  }

  getModel(name) {
    return this.models.get(name);
  }

  async sync(options = {}) {
    const connection = this.getWriteConnection();
    return connection.sync(options);
  }

  getHealthStatus() {
    const status = {};
    this.healthChecks.forEach((check, name) => {
      if (name !== 'interval') {
        status[name] = {
          status: check.status,
          lastCheck: check.lastCheck,
          error: check.error
        };
      }
    });
    return status;
  }

  async close() {
    try {
      // Clear health check intervals
      this.healthChecks.forEach((check, name) => {
        if (check.interval) {
          clearInterval(check.interval);
        }
      });

      // Close all connections
      await Promise.all(
        Array.from(this.connections.values()).map(connection => connection.close())
      );

      this.connections.clear();
      this.models.clear();
      this.healthChecks.clear();

      this.logger.info('Database cluster connections closed');
      return true;
    } catch (error) {
      this.logger.error('Error closing database cluster', { error: error.message });
      throw error;
    }
  }
}

// Create singleton instance
let clusterInstance = null;

const getDatabaseCluster = (options) => {
  if (!clusterInstance) {
    clusterInstance = new DatabaseCluster(options);
  }
  return clusterInstance;
};

export { getDatabaseCluster as DatabaseCluster }; 