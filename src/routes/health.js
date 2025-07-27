// src/routes/health.js
import express from 'express';
import { Logger } from '../infrastructure/logger.js';
import db from '../models/index.js';

const router = express.Router();

// Basic health check
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };

    res.status(200).json(health);
  } catch (error) {
    Logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Detailed health check with dependencies
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {},
  };

  let overallStatus = 'healthy';

  // Database check
  try {
    await db.sequelize.authenticate();
    health.checks.database = {
      status: 'healthy',
      responseTime: Date.now(),
    };
  } catch (error) {
    health.checks.database = {
      status: 'unhealthy',
      error: error.message,
    };
    overallStatus = 'unhealthy';
  }

  // Memory check
  const memoryUsage = process.memoryUsage();
  const memoryThreshold = 500 * 1024 * 1024; // 500MB threshold
  health.checks.memory = {
    status: memoryUsage.heapUsed < memoryThreshold ? 'healthy' : 'warning',
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
  };

  health.status = overallStatus;
  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(health);
});

// Readiness probe (for Kubernetes)
router.get('/ready', async (req, res) => {
  try {
    // Check if application is ready to serve requests
    await db.sequelize.authenticate();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// Liveness probe (for Kubernetes)
router.get('/live', (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({ status: 'alive' });
});

export default router;
