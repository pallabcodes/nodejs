// server.js
import dotenv from 'dotenv';
import { application } from './app.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
const server = application.app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('🛑 Shutting down server...');
  
  try {
    // Close HTTP server
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Close database connections
    await application.gracefulShutdown();
    
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  shutdown();
});
