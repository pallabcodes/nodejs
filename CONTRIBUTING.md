# Contributing to SmartVault Backend

First off, thank you for considering contributing to SmartVault Backend! It's people like you that make this project great.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Security Guidelines](#security-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be collaborative**: Work together to build something great
- **Be inclusive**: Welcome newcomers and help them learn
- **Be constructive**: Provide helpful feedback and suggestions

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

```bash
# Required versions
node >= 18.0.0
npm >= 8.0.0
git >= 2.25.0
mysql >= 8.0 (or postgresql >= 14)
redis >= 7.0
```

### Local Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/nodejs.git
   cd nodejs
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Database Setup**
   ```bash
   # Run migrations
   npm run migrate
   
   # Seed data (optional)
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Verify Setup**
   ```bash
   # Run tests
   npm test
   
   # Check linting
   npm run lint
   ```

## 🔄 Development Process

### Branch Strategy

We use a modified Git Flow strategy:

- **`main`**: Production-ready code
- **`develop`**: Development branch (not used currently, direct to main)
- **`feature/feature-name`**: New features
- **`fix/bug-description`**: Bug fixes
- **`chore/task-description`**: Maintenance tasks

### Workflow

1. **Create Issue**: Describe the feature/bug before coding
2. **Create Branch**: Use descriptive branch names
   ```bash
   git checkout -b feature/user-authentication
   git checkout -b fix/memory-leak-cache
   git checkout -b chore/update-dependencies
   ```
3. **Code**: Follow our coding standards
4. **Test**: Ensure all tests pass
5. **Commit**: Use conventional commits
6. **Push**: Push to your fork
7. **Pull Request**: Create a detailed PR

## 📝 Coding Standards

### JavaScript Style Guide

We follow the **Airbnb JavaScript Style Guide** with some modifications:

#### Key Principles

- **Pure Functions**: Prefer pure functions where possible
- **Immutability**: Use immutable data structures
- **Composition**: Favor composition over inheritance
- **Error Handling**: Always handle errors gracefully
- **Documentation**: Document complex logic and APIs

#### Code Examples

```javascript
// ✅ Good: Pure function with proper error handling
const validateUser = (userData) => {
  try {
    if (!userData.email) {
      return { success: false, error: 'Email is required' };
    }
    return { success: true, data: userData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ❌ Bad: Impure function with side effects
let globalUser = null;
const validateUser = (userData) => {
  globalUser = userData; // Side effect
  if (!userData.email) throw new Error('Email required'); // Unhandled error
  return userData;
};
```

### File and Folder Structure

```javascript
// File naming conventions
userController.js      // ✅ camelCase for files
user-service.test.js   // ✅ kebab-case for test files
UserModel.js          // ✅ PascalCase for classes/models

// Folder structure
src/
├── modules/users/           // ✅ Kebab-case for folders
│   ├── controllers/
│   ├── services/
│   ├── models/
│   └── tests/
```

### Import/Export Standards

```javascript
// ✅ Good: Named exports with clear imports
export const userService = {
  createUser,
  getUserById,
  updateUser
};

import { userService } from './services/userService.js';

// ✅ Good: Default export for main class/function
export default class UserController {
  // implementation
}

import UserController from './controllers/UserController.js';
```

## 🧪 Testing Guidelines

### Testing Strategy

We aim for **80%+ code coverage** with a focus on:

1. **Unit Tests**: Individual functions and modules
2. **Integration Tests**: API endpoints and database interactions
3. **Security Tests**: Authentication and authorization
4. **Performance Tests**: Load testing critical paths

### Testing Structure

```bash
src/
├── modules/users/
│   ├── services/
│   │   ├── userService.js
│   │   └── userService.test.js     # Unit tests
│   ├── controllers/
│   │   ├── userController.js
│   │   └── userController.test.js  # Integration tests
│   └── __tests__/
│       └── users.integration.test.js # Full integration tests
```

### Test Examples

```javascript
// Unit test example
describe('userService', () => {
  describe('validateUserData', () => {
    it('should return success for valid user data', () => {
      const userData = { email: 'test@example.com', name: 'Test User' };
      const result = userService.validateUserData(userData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(userData);
    });

    it('should return error for missing email', () => {
      const userData = { name: 'Test User' };
      const result = userService.validateUserData(userData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });
  });
});

// Integration test example
describe('POST /api/users', () => {
  beforeEach(async () => {
    await testDb.clear();
  });

  it('should create a new user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'securepassword'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);

    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.user.password).toBeUndefined(); // Password should not be returned
  });
});
```

### Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- userService.test.js

# Run tests matching pattern
npm test -- --grep "user authentication"
```

## 🔒 Security Guidelines

### Security First Approach

Every contribution must consider security implications:

1. **Input Validation**: Always validate and sanitize inputs
2. **Authentication**: Secure JWT implementation
3. **Authorization**: Proper permission checks
4. **SQL Injection**: Use parameterized queries only
5. **XSS Prevention**: Proper output encoding
6. **CSRF Protection**: Implement CSRF tokens
7. **Rate Limiting**: Implement appropriate rate limits

### Security Checklist

Before submitting a PR, ensure:

- [ ] All inputs are validated and sanitized
- [ ] No SQL queries use string concatenation
- [ ] Authentication is properly implemented
- [ ] Authorization checks are in place
- [ ] No sensitive data is logged
- [ ] Error messages don't leak sensitive information
- [ ] Rate limiting is considered for new endpoints
- [ ] Security headers are properly set

### Security Testing

```javascript
// Example security test
describe('Authentication Security', () => {
  it('should not accept malicious JWT tokens', async () => {
    const maliciousToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0...';
    
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${maliciousToken}`)
      .expect(401);
      
    expect(response.body.error).toContain('Invalid token');
  });

  it('should sanitize user input to prevent XSS', async () => {
    const maliciousInput = '<script>alert("xss")</script>';
    
    const response = await request(app)
      .post('/api/users')
      .send({ name: maliciousInput })
      .expect(400);
      
    expect(response.body.error).toContain('Invalid input');
  });
});
```

## 🔀 Pull Request Process

### Before Submitting

1. **Issue First**: Create or reference an existing issue
2. **Branch**: Create a feature branch from `main`
3. **Code**: Implement your changes
4. **Test**: Ensure all tests pass
5. **Document**: Update documentation if needed

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and security scans
2. **Code Review**: At least one maintainer reviews the code
3. **Security Review**: Security-sensitive changes require additional review
4. **Testing**: Reviewer tests the changes locally
5. **Approval**: Changes are approved and merged

## 🚀 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Steps

1. **Version Bump**: Update version in `package.json`
2. **Changelog**: Update `CHANGELOG.md`
3. **Tag**: Create git tag with version
4. **Release**: Create GitHub release
5. **Deploy**: Deploy to staging, then production

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Email**: technical@smartvault.com for technical questions
- **Security**: security@smartvault.com for security issues

### Resources

- [Architecture Documentation](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [Security Guidelines](./SECURITY.md)
- [Deployment Guide](./docs/deployment.md)

## 🏆 Recognition

We appreciate all contributions! Contributors will be:

- Listed in our contributors section
- Mentioned in release notes for significant contributions
- Invited to join our contributors team for regular contributors

---

**Thank you for contributing to SmartVault Backend!** 🚀

Your contributions help make this project better for everyone. We appreciate your time and effort in helping us build something great together.
