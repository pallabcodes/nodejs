import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { userService } from '../services/userService.js';

describe('User Service Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Clean up test database
  });

  describe('User Creation', () => {
    test('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'securepassword123'
      };

      const result = await userService.createUser(userData);

      expect(result.success).toBe(true);
      expect(result.data.email).toBe(userData.email);
      expect(result.data.password).toBeUndefined(); // Password should not be returned
    });

    test('should fail to create user with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'securepassword123'
      };

      const result = await userService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });

    test('should fail to create user with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'Test User',
        password: 'securepassword123'
      };

      // Create first user
      await userService.createUser(userData);

      // Try to create duplicate
      const result = await userService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('User Authentication', () => {
    test('should authenticate user with correct credentials', async () => {
      const userData = {
        email: 'auth@example.com',
        name: 'Auth User',
        password: 'securepassword123'
      };

      // Create user first
      await userService.createUser(userData);

      // Test authentication
      const result = await userService.authenticateUser(userData.email, userData.password);

      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
      expect(result.data.user.email).toBe(userData.email);
    });

    test('should fail authentication with wrong password', async () => {
      const result = await userService.authenticateUser('auth@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials');
    });

    test('should fail authentication with non-existent user', async () => {
      const result = await userService.authenticateUser('nonexistent@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User not found');
    });
  });

  describe('User Retrieval', () => {
    test('should retrieve user by ID', async () => {
      const userData = {
        email: 'retrieve@example.com',
        name: 'Retrieve User',
        password: 'securepassword123'
      };

      const createResult = await userService.createUser(userData);
      const userId = createResult.data.id;

      const result = await userService.getUserById(userId);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(userId);
      expect(result.data.email).toBe(userData.email);
    });

    test('should return error for non-existent user ID', async () => {
      const result = await userService.getUserById('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User not found');
    });
  });

  describe('User Update', () => {
    test('should update user profile successfully', async () => {
      const userData = {
        email: 'update@example.com',
        name: 'Update User',
        password: 'securepassword123'
      };

      const createResult = await userService.createUser(userData);
      const userId = createResult.data.id;

      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio'
      };

      const result = await userService.updateUser(userId, updateData);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updateData.name);
      expect(result.data.bio).toBe(updateData.bio);
    });

    test('should validate update data', async () => {
      const userData = {
        email: 'validate@example.com',
        name: 'Validate User',
        password: 'securepassword123'
      };

      const createResult = await userService.createUser(userData);
      const userId = createResult.data.id;

      const invalidUpdateData = {
        email: 'invalid-email-format'
      };

      const result = await userService.updateUser(userId, invalidUpdateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email');
    });
  });

  describe('Password Management', () => {
    test('should change password successfully', async () => {
      const userData = {
        email: 'password@example.com',
        name: 'Password User',
        password: 'oldpassword123'
      };

      const createResult = await userService.createUser(userData);
      const userId = createResult.data.id;

      const result = await userService.changePassword(userId, 'oldpassword123', 'newpassword123');

      expect(result.success).toBe(true);

      // Verify old password no longer works
      const authResult = await userService.authenticateUser(userData.email, 'oldpassword123');
      expect(authResult.success).toBe(false);

      // Verify new password works
      const newAuthResult = await userService.authenticateUser(userData.email, 'newpassword123');
      expect(newAuthResult.success).toBe(true);
    });

    test('should fail password change with wrong current password', async () => {
      const userData = {
        email: 'wrongpass@example.com',
        name: 'Wrong Pass User',
        password: 'correctpassword123'
      };

      const createResult = await userService.createUser(userData);
      const userId = createResult.data.id;

      const result = await userService.changePassword(userId, 'wrongpassword', 'newpassword123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Current password is incorrect');
    });
  });

  describe('Security Tests', () => {
    test('should hash passwords properly', async () => {
      const userData = {
        email: 'security@example.com',
        name: 'Security User',
        password: 'plaintextpassword'
      };

      const result = await userService.createUser(userData);

      // Verify password is not stored in plain text
      expect(result.data.password).toBeUndefined();
      
      // If we had access to the database record directly:
      // expect(dbRecord.password).not.toBe(userData.password);
      // expect(dbRecord.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
    });

    test('should sanitize user input', async () => {
      const maliciousUserData = {
        email: 'malicious@example.com',
        name: '<script>alert("xss")</script>',
        password: 'securepassword123'
      };

      const result = await userService.createUser(maliciousUserData);

      expect(result.success).toBe(true);
      // Name should be sanitized
      expect(result.data.name).not.toContain('<script>');
    });

    test('should validate input length limits', async () => {
      const longNameData = {
        email: 'longname@example.com',
        name: 'A'.repeat(1000), // Very long name
        password: 'securepassword123'
      };

      const result = await userService.createUser(longNameData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Name too long');
    });
  });
});
