import Joi from 'joi';

// Base user schema with common fields
const baseUserSchema = {
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name cannot be empty',
      'string.min': 'Name must be at least {#limit} characters long',
      'string.max': 'Name cannot exceed {#limit} characters',
      'any.required': 'Name is required'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email cannot be empty',
      'any.required': 'Email is required'
    }),

  phone: Joi.string()
    .pattern(/^\+?[\d\s-]{10,}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  role: Joi.string()
    .valid('user', 'admin')
    .default('user')
    .messages({
      'any.only': 'Role must be either "user" or "admin"'
    })
};

// Schema for creating a new user
export const createUserSchema = Joi.object({
  ...baseUserSchema,
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.empty': 'Password cannot be empty',
      'string.min': 'Password must be at least {#limit} characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      'any.required': 'Password is required'
    })
});

// Schema for updating a user
export const updateUserSchema = Joi.object({
  ...baseUserSchema,
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.min': 'Password must be at least {#limit} characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    })
});

// Schema for user login
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email cannot be empty',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password cannot be empty',
      'any.required': 'Password is required'
    })
});

// Schema for password reset
export const passwordResetSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email cannot be empty',
      'any.required': 'Email is required'
    })
});

// Schema for password update
export const passwordUpdateSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password cannot be empty',
      'any.required': 'Current password is required'
    }),

  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.empty': 'New password cannot be empty',
      'string.min': 'New password must be at least {#limit} characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      'any.required': 'New password is required'
    })
}); 