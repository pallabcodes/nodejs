import { Request, Response, NextFunction } from 'express';
import { AuthorizationService } from '../auth/AuthorizationService';
import { AuthContext, AuthorizationError, AuthErrorCodes, AuthResult } from '../auth/types';
import { logger } from '../utils/logger';

// Extend Express types
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        roles?: string[];
        permissions?: string[];
        attributes?: Record<string, unknown>;
        tenantId?: string;
      };
      authSession?: {
        id: string;
        token: string;
        cookie: {
          expires?: Date;
        };
      };
      auth?: {
        context: AuthContext;
        result: AuthResult;
      };
    }
  }
}

export const createAuthMiddleware = (redisUrl: string) => {
  const authService = AuthorizationService.getInstance(redisUrl);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract user from request (assuming you have authentication middleware)
      const user = req.user;
      if (!user) {
        throw new AuthorizationError(
          AuthErrorCodes.INVALID_CONTEXT,
          'User not authenticated'
        );
      }

      // Create authorization context
      const context: AuthContext = {
        subject: {
          id: user.id,
          type: 'user',
          roles: user.roles || [],
          permissions: user.permissions || [],
          attributes: user.attributes || {},
          metadata: {
            tenantId: user.tenantId,
            lastActive: new Date(),
          },
        },
        action: req.method.toLowerCase(),
        resource: {
          id: req.params.id || '*',
          type: req.baseUrl.split('/')[1] || 'unknown',
          attributes: {
            ...req.params,
            ...req.query,
            ...req.body,
          },
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: user.id,
            tenantId: user.tenantId,
          },
        },
        environment: {
          ip: req.ip || '0.0.0.0',
          userAgent: req.headers['user-agent'] || undefined,
          timestamp: new Date(),
          location: req.get('cf-ipcountry') ? {
            country: req.get('cf-ipcountry') || 'unknown',
            city: req.get('cf-ipcity') || 'unknown',
          } : undefined,
          device: {
            type: req.get('sec-ch-ua-platform') || 'unknown',
            os: req.get('sec-ch-ua-platform') || 'unknown',
            browser: req.get('sec-ch-ua') || 'unknown',
          },
        },
        session: req.authSession ? {
          id: req.authSession.id,
          token: req.authSession.token,
          expiresAt: new Date(req.authSession.cookie.expires || Date.now() + 24 * 60 * 60 * 1000),
        } : undefined,
      };

      // Evaluate authorization
      const result = await authService.evaluate(context);

      if (!result.allowed) {
        logger.warn('Authorization denied', {
          context,
          reason: result.reason,
          roles: result.roles,
          policies: result.policies,
          relationships: result.relationships,
        });

        throw new AuthorizationError(
          AuthErrorCodes.INSUFFICIENT_PERMISSIONS,
          result.reason || 'Access denied'
        );
      }

      // Add authorization result to request for downstream use
      req.auth = {
        context,
        result,
      };

      next();
    } catch (error) {
      if (error instanceof AuthorizationError) {
        res.status(403).json({
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        logger.error('Authorization middleware error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
          },
        });
      }
    }
  };
};