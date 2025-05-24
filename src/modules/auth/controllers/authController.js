import { Validator } from 'node-input-validator';
import { response, errorResponse } from '../../../shared/utils/response.js';

export const register = async (req, res) => {
  try {
    const validator = new Validator(req.body, {
      email: 'required|email',
      password: 'required|minLength:8',
      confirm_password: 'required|same:password',
    });

    const matched = await validator.check();
    if (!matched) {
      return errorResponse(
        res,
        { message: 'Validation failed', code: 'VALIDATION_ERROR' },
        422,
        {},
        validator.errors
      );
    }

    // ...rest of registration logic...
  } catch (error) {
    return errorResponse(res, error, 500);
  }
};
