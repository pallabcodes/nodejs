import { ROLE_PERMISSIONS } from '../config/roles.js';
import { err, ok } from '../utils/result.js';

export const checkRole = (roles = []) => async (ctx) => {
  const userRoles = ctx.req.user?.roles || [];
  const hasRole = userRoles.some(role => roles.includes(role));
  return hasRole ? ok(ctx) : err(new Error('Forbidden: Insufficient role'), 'RBAC_DENIED');
};

export const checkPermission = (permissions = []) => async (ctx) => {
  const userRoles = ctx.req.user?.roles || [];
  const userPerms = userRoles.flatMap(role => ROLE_PERMISSIONS[role] || []);
  const hasPerm = permissions.every(p => userPerms.includes(p) || userPerms.includes('*'));
  return hasPerm ? ok(ctx) : err(new Error('Forbidden: Missing permission'), 'RBAC_DENIED');
};