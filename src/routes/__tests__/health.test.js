import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { getApplication } from '../../../app.js';

describe('Health Check Endpoints', () => {
  let app;

  beforeEach(async () => {
    const { app: testApp } = await getApplication();
    app = testApp;
  });

  afterEach(async () => {
    // Clean up after tests
  });

  describe('GET /health', () => {
    test('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        version: expect.any(String),
      });

      // Validate timestamp format
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });

    test('should return consistent response format', async () => {
      const response1 = await request(app).get('/health');
      const response2 = await request(app).get('/health');

      expect(Object.keys(response1.body)).toEqual(Object.keys(response2.body));
      expect(response2.body.uptime).toBeGreaterThanOrEqual(response1.body.uptime);
    });
  });

  describe('GET /health/detailed', () => {
    test('should return detailed health information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(healthy|unhealthy|warning)$/),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        version: expect.any(String),
        checks: expect.any(Object),
      });

      // Validate checks structure
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('memory');

      // Validate database check
      expect(response.body.checks.database).toMatchObject({
        status: expect.stringMatching(/^(healthy|unhealthy)$/),
      });

      // Validate memory check
      expect(response.body.checks.memory).toMatchObject({
        status: expect.stringMatching(/^(healthy|warning|unhealthy)$/),
        heapUsed: expect.stringMatching(/^\d+MB$/),
        heapTotal: expect.stringMatching(/^\d+MB$/),
        external: expect.stringMatching(/^\d+MB$/),
      });
    });

    test('should return 503 when database is unhealthy', async () => {
      // Mock database failure
      const originalAuthenticate = app.locals.db?.sequelize?.authenticate;
      if (app.locals.db?.sequelize) {
        app.locals.db.sequelize.authenticate = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      }

      const response = await request(app)
        .get('/health/detailed')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.checks.database.status).toBe('unhealthy');

      // Restore original function
      if (originalAuthenticate && app.locals.db?.sequelize) {
        app.locals.db.sequelize.authenticate = originalAuthenticate;
      }
    });
  });

  describe('GET /ready', () => {
    test('should return 200 when application is ready', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ready',
      });
    });

    test('should return 503 when database is not ready', async () => {
      // Mock database failure
      const originalAuthenticate = app.locals.db?.sequelize?.authenticate;
      if (app.locals.db?.sequelize) {
        app.locals.db.sequelize.authenticate = jest.fn().mockRejectedValue(new Error('Database not ready'));
      }

      const response = await request(app)
        .get('/ready')
        .expect(503);

      expect(response.body).toMatchObject({
        status: 'not ready',
        error: expect.any(String),
      });

      // Restore original function
      if (originalAuthenticate && app.locals.db?.sequelize) {
        app.locals.db.sequelize.authenticate = originalAuthenticate;
      }
    });
  });

  describe('GET /live', () => {
    test('should always return 200 when server is running', async () => {
      const response = await request(app)
        .get('/live')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'alive',
      });
    });

    test('should respond quickly', async () => {
      const startTime = Date.now();
      await request(app).get('/live');
      const responseTime = Date.now() - startTime;

      // Should respond within 100ms
      expect(responseTime).toBeLessThan(100);
    });
  });

  describe('Performance Tests', () => {
    test('health endpoints should respond within acceptable time', async () => {
      const endpoints = ['/health', '/health/detailed', '/ready', '/live'];
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        await request(app).get(endpoint);
        const responseTime = Date.now() - startTime;

        // Health checks should be fast (under 1 second)
        expect(responseTime).toBeLessThan(1000);
      }
    });

    test('should handle concurrent health check requests', async () => {
      const concurrentRequests = 10;
      const promises = Array(concurrentRequests).fill().map(() => 
        request(app).get('/health')
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });
  });
});
