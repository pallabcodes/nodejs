// server.js
import dotenv from 'dotenv';
import { getApplication, gracefulShutdown } from './app.js';

// Load environment variables
dotenv.config();

// Increase event listener limit
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 20;

// Pure function to create server configuration
const createServerConfig = () => ({
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost'
});

// Pure function to create server logger
const createServerLogger = (config) => ({
  logStart: () => {
    console.log(`
🚀 Server started successfully!
📡 Server running at: http://${config.host}:${config.port}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
⏰ Started at: ${new Date().toISOString()}
    `);
  },
  logError: (error) => {
    console.error(`
❌ Server error:
   Message: ${error.message}
   Stack: ${error.stack}
   Time: ${new Date().toISOString()}
    `);
  }
});

// Pure function to create server instance
const createServer = async (config, logger) => {
  try {
    const { app } = await getApplication();
    return {
      start: () => new Promise((resolve, reject) => {
        const server = app.listen(config.port, config.host, () => {
          logger.logStart();
          resolve(server);
        });

        server.on('error', (error) => {
          logger.logError(error);
          reject(error);
        });

        // Handle server close
        server.on('close', () => {
          console.log('📥 Server closed');
        });
      })
    };
  } catch (error) {
    logger.logError(error);
    throw error;
  }
};

// Pure function to setup process handlers
const setupProcessHandlers = (server) => {
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) {
      console.log('🔄 Shutdown already in progress...');
      return;
    }

    isShuttingDown = true;
    console.log(`\n📥 Received ${signal}. Starting graceful shutdown...`);

    try {
      // Close HTTP server first
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            console.error('Error closing server:', err);
            reject(err);
          } else {
            console.log('✅ HTTP server closed');
            resolve();
          }
        });
      });

      // Then perform application cleanup
      await gracefulShutdown();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle various process events
  const handlers = {
    SIGTERM: () => shutdown('SIGTERM'),
    SIGINT: () => shutdown('SIGINT'),
    uncaughtException: (error) => {
      console.error('❌ Uncaught Exception:', error);
      shutdown('uncaughtException');
    },
    unhandledRejection: (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    }
  };

  // Register all handlers
  Object.entries(handlers).forEach(([event, handler]) => {
    process.on(event, handler);
  });

  // Cleanup function to remove all listeners
  const cleanup = () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      process.removeListener(event, handler);
    });
  };

  return { server, cleanup };
};

// Pure function to start the server
const startServer = async () => {
  const config = createServerConfig();
  const logger = createServerLogger(config);
  
  try {
    const server = await createServer(config, logger);
    const { cleanup } = setupProcessHandlers(await server.start());
    
    // Return cleanup function for testing
    return { cleanup };
  } catch (error) {
    logger.logError(error);
    process.exit(1);
  }
};

// Start the server
startServer();
