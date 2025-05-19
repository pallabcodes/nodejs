import Joi from 'joi';
import { createError } from './error.js';

export const validateSchema = (schema, data) => {
  try {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return {
        isValid: false,
        errors,
        value: null
      };
    }

    return {
      isValid: true,
      errors: null,
      value
    };
  } catch (error) {
    throw createError(500, 'Validation error', 'VALIDATION_ERROR', error);
  }
};

export const createValidator = (schema) => {
  return (data) => validateSchema(schema, data);
}; 