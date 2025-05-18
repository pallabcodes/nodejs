import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Pure function to get environment
const getEnvironment = () => process.env.NODE_ENV || 'development';

// Pure function to validate configuration
const validateConfig = (config) => {
  const requiredFields = ['username', 'password', 'database', 'host', 'dialect'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required database configuration fields: ${missingFields.join(', ')}`);
  }
  return true;
};

// Pure function to create database configuration
const createDatabaseConfig = (environment) => ({
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'admin#123',
    database: process.env.DB_DATABASE || 'smartvalut',
    host: process.env.DB_HOST || '0.0.0.0',
    dialect: process.env.DB_DIALECT || 'mysql',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    benchmark: true,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    logging: false,
    benchmark: false,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
}[environment]);

// Pure function to create dialect options
const createDialectOptions = (environment) => ({
  // Enable SSL in production
  ...(environment === 'production' && {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }),
  // Connection timeout
  connectTimeout: 60000,
  // Statement timeout
  statement_timeout: 60000,
  // Idle timeout
  idle_in_transaction_session_timeout: 60000
});

// Pure function to create Sequelize instance
const createSequelizeInstance = (config, environment) => {
  validateConfig(config);
  
  return new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      dialect: config.dialect,
      pool: config.pool,
      logging: config.logging,
      benchmark: config.benchmark,
      define: config.define,
      dialectOptions: createDialectOptions(environment)
    }
  );
};

// Pure function to create database operations
const createDatabaseOperations = (sequelizeInstance, environment) => ({
  initialize: async () => {
    try {
      await sequelizeInstance.authenticate();
      console.log('✅ Database connection established successfully');
      
      if (environment === 'development') {
        await createDatabaseOperations(sequelizeInstance, environment).syncDatabase();
      }
      
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  },

  syncDatabase: async (options = {}) => {
    const defaultOptions = {
      alter: process.env.DB_ALTER === 'true',
      force: process.env.DB_FORCE === 'true',
      logging: console.log
    };

    try {
      await sequelizeInstance.sync({ ...defaultOptions, ...options });
      console.log('✅ Database synchronized successfully');
      return true;
    } catch (error) {
      console.error('❌ Database synchronization failed:', error);
      throw error;
    }
  },

  close: async () => {
    try {
      await sequelizeInstance.close();
      console.log('✅ Database connection closed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
      throw error;
    }
  },

  getStatus: async () => {
    try {
      await sequelizeInstance.authenticate();
      return {
        status: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
});

// Pure function to create database manager
const createDatabaseManager = (sequelizeInstance, environment) => ({
  operations: createDatabaseOperations(sequelizeInstance, environment),
  getSequelize: () => sequelizeInstance
});

// Create database instance
const environment = getEnvironment();
const dbConfig = createDatabaseConfig(environment);
const sequelize = createSequelizeInstance(dbConfig, environment);
const database = createDatabaseManager(sequelize, environment);

// Export all necessary functions and objects
export {
  database,
  createDatabaseManager,
  createDatabaseOperations,
  createSequelizeInstance,
  createDatabaseConfig,
  createDialectOptions,
  validateConfig,
  getEnvironment
};