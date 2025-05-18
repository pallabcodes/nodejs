
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { response } from '../helpers/response.js';


// JWT secret (you can modify this if required)
const accessTokenSecret = process.env.JWT_SECRET || 'jwtsecret';

// bcrypt setup
const salt = bcrypt.genSaltSync(10); // Generate a salt

// Global blacklisted tokens set (used for token invalidation)
global.blacklistedTokens = new Set();

// No cache middleware
const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
};

// Generate auth token
const generateAuthToken = ({ id, roles, name, firstName, lastName, email, mobile }) => {
  return jwt.sign(
    { id, roles, name, firstName, lastName, email, mobile },
    accessTokenSecret,
    { expiresIn: '1h' } // Optionally, you can add token expiration
  );
};

// Authentication middleware
const authentication = (req, res, next) => {
  const header = req?.headers?.authorization;
  if (!header) {
    return response(res, req.body, 'Missing authorization token.', 401);
  }

  const token = header.includes(' ') ? header.split(' ')[1] : header;
  
  // Check if the token is blacklisted
  if (global.blacklistedTokens.has(token)) {
    return response(res, req.body, 'Expired authorization token.', 401);
  }

  jwt.verify(token, accessTokenSecret, (error, user) => {
    try {
      if (error) {
        if (error.name === 'TokenExpiredError') {
          return response(res, req.body, 'Expired authorization token.', 401);
        } else if (error.name === 'JsonWebTokenError') {
          return response(res, req.body, 'Invalid authorization token.', 403);
        } else {
          return response(res, req.body, 'Unauthorized.', 403);
        }
      }

      req.user = user;
      next();
    } catch (error) {
      return response(res, req.body, error.message, 500);
    }
  });
};

// Role-based authorization middleware
const roleAuthorization = (roleString) => (req, res, next) => {
  const { roles } = req.user;

  if (!roles?.length || !roles.includes(roleString)) {
    return response(res, req.body, 'Access forbidden.', 403);
  }

  next();
};



// Exporting all middleware and functions
export {
  noCache,
  generateAuthToken,
  authentication,
  roleAuthorization
};
