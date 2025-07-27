// jest.setup.js - Global Jest configuration
import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods in test environment
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'sqlite::memory:';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Global test utilities
global.testUtils = {
  createMockContext: () => ({
    req: {
      user: null,
      headers: {},
      query: {},
      body: {},
      params: {},
    },
    res: {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    },
    next: jest.fn(),
  }),
  
  createMockUser: (overrides = {}) => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    roles: ['user'],
    permissions: ['READ_PROFILE'],
    ...overrides,
  }),
};

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
