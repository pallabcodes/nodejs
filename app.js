import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import database from './src/config/database.js';
import models from './src/models/index.js';

// Import routes
import userRoutes from './src/modules/users/routes/index.js';

// Pure function to create Express app
const createApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Trust proxy
  app.set('trust proxy', 1);

  return app;
};

// Pure function to setup routes
const setupRoutes = (app) => {
  app.use('/api/users', userRoutes);
  return app;
};

// Pure function to setup health check
const setupHealthCheck = (app) => {
  app.get('/health', async (req, res) => {
    try {
      const dbStatus = await database.operations.getStatus();
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });
  return app;
};

// Pure function to setup error handling
const setupErrorHandling = (app) => {
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      }
    });
  });
  return app;
};

// Pure function to initialize database
const initializeDatabase = async () => {
  try {
    await database.operations.initialize();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Create and configure the application
const app = setupErrorHandling(
  setupHealthCheck(
    setupRoutes(
      createApp()
    )
  )
);

// Initialize database before starting the server
initializeDatabase();

// Graceful shutdown handler
const gracefulShutdown = async () => {
  try {
    await database.operations.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Export application instance with shutdown handler
export const application = {
  app,
  models,
  gracefulShutdown
};
