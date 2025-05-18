import jwt from 'jsonwebtoken';
import { Logger } from '../../infrastructure/logger.js';

// Pure function to extract token from header
const extractToken = (authHeader) => {
  if (!authHeader) return null;
  const [bearer, token] = authHeader.split(' ');
  return bearer === 'Bearer' ? token : null;
};

// Pure function to verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Pure function to create user context
const createUserContext = (decoded) => ({
  id: decoded.id,
  roles: decoded.roles || ['user']
});

// Pure function to create auth middleware
const createAuthMiddleware = () => async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }

    const decoded = verifyToken(token);
    req.user = createUserContext(decoded);
    next();
  } catch (error) {
    Logger.error('Auth middleware error', { error: error.message });
    res.status(401).json({ message: error.message });
  }
};

// Export all auth-related functions
export {
  createAuthMiddleware,
  extractToken,
  verifyToken,
  createUserContext
};


// export function authMiddleware(req, res, next) {
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });
//
//         const token = authHeader.split(' ')[1]; // Bearer token
//
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//
//         // decoded payload example: { id: 'userId', roles: ['admin', 'editor'], iat, exp }
//         req.user = {
//             id: decoded.id,
//             roles: decoded.roles || ['user'], // default to user if no roles
//         };
//
//         next();
//     } catch (error) {
//         logger.warn('Auth middleware error', error);
//         res.status(401).json({ message: 'Invalid or expired token' });
//     }
// };

class AuthMiddleware extends Middleware {
    async handle(ctx, next) {
        const { req, res } = ctx;
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).json({ message: 'Authorization header missing' });
                return;
            }
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user info on context (not just req)
            ctx.user = {
                id: decoded.id,
                roles: decoded.roles || ['user']
            };

            await next();
        } catch (error) {
            res.status(401).json({ message: 'Invalid token' });
        }
    }
}

export  { AuthMiddleware };