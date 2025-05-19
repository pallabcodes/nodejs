import { ok, err } from '../utils/result.js';
import { createError } from '../utils/error.js';

export const checkPermissions = (requiredPermissions) => {
  return async (ctx) => {
    try {
      const { user } = ctx.req;
      
      if (!user) {
        throw createError(401, 'User not authenticated');
      }

      const userPermissions = user.permissions || [];
      const hasAllPermissions = requiredPermissions.every(
        permission => userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        throw createError(403, 'Insufficient permissions');
      }

      return ok(ctx);
    } catch (error) {
      return err(error);
    }
  };
}; 