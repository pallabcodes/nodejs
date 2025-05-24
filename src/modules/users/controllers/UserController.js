// src/modules/users/controllers/UserController.js
import db from '../../../models/index.js';
import { createUserSchema } from '../schemas/userSchema.js';
import { validateSchema } from '../../../shared/utils/validator.js';
import { createError } from '../../../shared/utils/error.js';
import { createMetadata, response } from '../../../shared/utils/response.js';

const { User } = db;

export const createUser = async (req, res) => {
  try {
    const validationResult = validateSchema(createUserSchema, req.body);
    if (!validationResult.isValid) {
      return res.validationError(createError(400, 'Validation failed', 'VALIDATION_ERROR', validationResult.errors));
    }

    const user = await User.create(req.body);
    const metadata = createMetadata({
      filters: { role: user.role }
    });
    
    return res.created(user, metadata, 'User created successfully');
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.businessError(createError(409, 'User with this email or phone number already exists'));
    }
    return res.error(error);
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'token', 'resetCode', 'resetExpiries'] }
    });

    const metadata = createMetadata({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      total: users.length,
      filters: { role: req.query.role },
      sort: { name: req.query.sort || 'asc' }
    });

    return res.success(users, metadata, 'Users retrieved successfully');
  } catch (error) {
    return res.error(error);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.error(createError(404, 'User not found'));
    }

    await user.destroy();
    return res.success(null, null, 'User deleted successfully');
  } catch (error) {
    return res.error(error);
  }
};

// Sample user controller demonstrating all response features
export const UserController = {
  // Example 1: Basic success response
  async getProfile(req, res) {
    const user = {
      id: 1,
      email: 'user@example.com',
      name: 'John Doe'
    };
    
    // Simple success response
    return res.success(user, null, 'User profile retrieved successfully');
  },

  // Example 2: Created response with metadata
  async createUser(req, res) {
    const newUser = {
      id: 2,
      email: req.body.email,
      name: req.body.name
    };

    // Created response with metadata
    const metadata = createMetadata({
      page: 1,
      limit: 10,
      total: 100,
      filters: { role: 'user' },
      sort: { createdAt: 'desc' }
    });

    return res.created(newUser, metadata, 'User created successfully');
  },

  // Example 3: Validation error
  async updateUser(req, res) {
    const { email } = req.body;
    
    // Simulate validation error
    if (!email || !email.includes('@')) {
      const error = createError(422, 'Invalid email format', 'VALIDATION_ERROR', [
        { field: 'email', message: 'Email must be a valid email address' }
      ]);
      return res.validationError(error);
    }

    // Success case
    return res.success({ email }, null, 'User updated successfully');
  },

  // Example 4: Business error
  async deleteUser(req, res) {
    const userId = req.params.id;
    
    // Simulate business error
    if (userId === '1') {
      const error = createError(400, 'Cannot delete admin user', 'BUSINESS_ERROR');
      return res.businessError(error);
    }

    return res.success(null, null, 'User deleted successfully');
  },

  // Example 5: Auth error
  async getAdminData(req, res) {
    // Simulate auth error
    if (!req.user?.isAdmin) {
      const error = createError(401, 'Unauthorized access', 'AUTH_ERROR');
      return res.authError(error);
    }

    return res.success({ adminData: 'secret' });
  },

  // Example 6: Rate limit error
  async getUsers(req, res) {
    // Simulate rate limit error
    if (req.headers['x-rate-limit-exceeded']) {
      const error = createError(429, 'Too many requests', 'RATE_LIMIT_ERROR');
      return res.rateLimitError(error);
    }

    // Success with pagination
    const users = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ];

    const metadata = createMetadata({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      total: 100,
      filters: { role: req.query.role },
      sort: { name: req.query.sort || 'asc' }
    });

    return res.success(users, metadata, 'Users retrieved successfully');
  },

  // Example 7: General error
  async getComplexData(req, res) {
    try {
      // Simulate an unexpected error
      throw new Error('Database connection failed');
    } catch (error) {
      return res.error(error);
    }
  },

  // List users with pagination
  async listUsers(req, res) {
    // ...fetch users and pagination info...
    const users = [/* ... */];
    const pagination = {
      page: 1,
      pageSize: 10,
      total: 100,
      totalPages: 10
    };
    return response(res, users, 'User list', 200, {}, req.locale || 'en', pagination);
  }
};
