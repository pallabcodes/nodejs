import { Validator } from 'node-input-validator';
import User from "../../models/User.js"; 
import { generateAuthToken } from "../../middlewares/auth.js";
import { response } from "../../helpers/response.js";

export const register = async (req, res) => {
  try {
    const validator = new Validator(req.body, {
      email: 'required|email',
      password: 'required|minLength:8',
      confirm_password: 'required|same:password',
    });

    const matched = await validator.check();
    if (!matched) {
      return response(res, validator.errors, 'Validation failed.', 422);
    }

    const existingUser = await User.findOne({ where: { email: req.body.email } });
    if (existingUser) {
      return response(res, null, 'Email already exists.', 422);
    }

    const { email, password, first_name, last_name, phone_number } = req.body;
    const profilePhotoFilename = req.filesProcessed?.profile_photo?.[0] || null;


    const newUser = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone_number,
      profile_photo: profilePhotoFilename,
    });

    const token = generateAuthToken(newUser);

    return response(res, { token }, 'User successfully registered and logged in.', 201);

  } catch (error) {
    console.error('Registration Error:', error);
    return response(res, null, error.message || 'Internal server error', 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const validator = new Validator(req.body, {
      email: 'required|email',
      password: 'required',
    });

    const matched = await validator.check();
    if (!matched) {
      return response(res, validator.errors, 'Validation failed.', 422);
    }

 
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return response(res, null, 'Invalid credentials.', 422);
    }

    const isPasswordValid = await user.isValidPassword(password);
    if (!isPasswordValid) {
      return response(res, null, 'Invalid credentials.', 401);
    }


    const token = generateAuthToken(user);

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      profile_photo: user.profile_photo
    };

    return response(res, {
      token,
      user: userData
    }, 'Login successful.', 200);

  } catch (error) {
    console.error('Login Error:', error);
    return response(res, null, error.message || 'Server error.', 500);
  }
};
