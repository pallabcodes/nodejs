import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import db from './src/models/index.js';
import { swaggerMiddleware } from './src/config/swagger.js';
import { createResponseMiddleware } from './src/shared/utils/response.js';
import { apm } from './src/infrastructure/apm.js';
import { getRateLimiter } from './src/infrastructure/rate-limiter.js';

// Import routes
import userRoutes from './src/modules/users/routes/index.js';

// Pure function to create Express app
const createApp = async () => {
  const app = express();
  const rateLimiter = await getRateLimiter();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());

  // APM middleware (should be as early as possible)
  app.use(apm.middleware());

  // Rate limiter middleware
  app.use(rateLimiter.middleware());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Response middleware
  app.use(createResponseMiddleware());

  // Trust proxy
  app.set('trust proxy', 1);

  return { app, rateLimiter };
};

// Pure function to setup routes
const setupRoutes = ({ app }) => {
  // API Documentation
  app.use('/api-docs', ...swaggerMiddleware);
  
  // API Routes
  app.use('/api/users', userRoutes);
  return { app };
};

// Pure function to setup health check
const setupHealthCheck = ({ app }) => {
  app.get('/health', async (req, res) => {
    try {
      // Test database connection
      await db.sequelize.authenticate();
      
      res.success({
        status: 'ok',
        database: 'connected',
        environment: process.env.NODE_ENV || 'development',
        apm: apm.isEnabled ? 'enabled' : 'disabled'
      });
    } catch (error) {
      res.error(error);
    }
  });
  return { app };
};

// Pure function to setup error handling
const setupErrorHandling = ({ app }) => {
  app.use((err, req, res, next) => {
    // Log error to APM if transaction exists
    if (req.apmTransactionId) {
      apm.setTransactionTag(req.apmTransactionId, 'error', err.message);
      apm.endTransaction(req.apmTransactionId, 'error');
    }
    
    console.error(err.stack);
    res.error(err);
  });
  return { app };
};

// Pure function to initialize database
const initializeDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models with database
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync({ alter: true });
      console.log('Database models synchronized.');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Pure function to compose application
const composeApp = async () => {
  const { app, rateLimiter } = await createApp();
  const appWithRoutes = setupRoutes({ app });
  const appWithHealth = setupHealthCheck(appWithRoutes);
  const appWithErrorHandling = setupErrorHandling(appWithHealth);
  
  return { app: appWithErrorHandling.app, rateLimiter };
};

// Initialize application
let application = null;
let initializationPromise = null;

const initializeApplication = async () => {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await initializeDatabase();
      application = await composeApp();
      return application;
    })();
  }
  return initializationPromise;
};

// Initialize application before starting the server
initializeApplication();

// Graceful shutdown handler
const gracefulShutdown = async () => {
  try {
    await db.sequelize.close();
    if (application?.rateLimiter) {
      await application.rateLimiter.close();
    }
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Export application instance with shutdown handler
export { gracefulShutdown };

// Export getter for application instance
export const getApplication = async () => {
  if (!application) {
    await initializeApplication();
  }
  return application;
};
