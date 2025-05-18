const { ok, err } = require('../utils/result');
const { ROLE_PERMISSIONS } = require('../config/permissions');

const checkPermissions = (required = []) => async (ctx) => {
  const { user } = ctx;
  if (!user) return err(new Error('User not authenticated'), 'UNAUTHENTICATED');

  const userPerms = user.roles.reduce((acc, role) => {
    const perms = ROLE_PERMISSIONS[role] || [];
    perms.includes('*') ? acc.add('*') : perms.forEach(p => acc.add(p));
    return acc;
  }, new Set());

  const missing = required.filter(p => !userPerms.has(p));
  return missing.length ? err(new Error(`Missing permissions: ${missing.join(', ')}`), 'PERMISSION_DENIED') : ok(ctx);
};

module.exports = { checkPermissions };


// const logger = require('../utils/logger');
// const { getUserPermissions } = require('../services/permissionService');

/**
 * Permission middleware factory
 * @param {string[]} requiredPermissions — list of permissions needed to access route
 */
// function permissionMiddleware(requiredPermissions = []) {
//     return async function (req, res, next) {
//         try {
//             const user = req.user;
//
//             if (!user) {
//                 logger.warn(`[Auth] Unauthorized request - no user attached`, { route: req.originalUrl });
//                 return res.status(401).json({ message: 'Unauthorized' });
//             }
//
//             // Check if permissions are cached on the request (optimizing DB calls)
//             if (!req.userPermissions) {
//                 // Example: Fetch from DB or cache and set on req for reuse downstream
//                 req.userPermissions = new Set(await getUserPermissions(user.id));
//             }
//
//             const userPerms = req.userPermissions;
//
//             // Shortcut: wildcard admin permission
//             if (userPerms.has('*')) return next();
//
//             // Check all required permissions exist
//             const missing = requiredPermissions.filter(perm => !userPerms.has(perm));
//
//             if (missing.length > 0) {
//                 logger.warn(`[Auth] Forbidden access: missing permissions [${missing.join(', ')}]`, {
//                     userId: user.id,
//                     roles: user.roles,
//                     route: req.originalUrl,
//                     method: req.method,
//                 });
//
//                 return res.status(403).json({
//                     message: 'Forbidden',
//                     missingPermissions: missing,
//                 });
//             }
//
//             // Access granted
//             next();
//         } catch (err) {
//             logger.error('[Auth] Permission middleware error', { error: err, userId: req.user?.id });
//             next(err);
//         }
//     };
// }

// with Reduce

// const permissionMiddleware = (requiredPermissions = []) => (req, res, next) => {
//     const user = req.user;
//     if (!user) return res.status(401).json({ message: 'Unauthorized' });

//     const userPerms = user.roles.reduce((acc, role) => {
//         const perms = ROLE_PERMISSIONS[role] || [];
//         if (perms.includes('*')) acc.add('*');
//         else perms.forEach(p => acc.add(p));
//         return acc;
//     }, new Set());

//     if (userPerms.has('*') || requiredPermissions.every(p => userPerms.has(p))) {
//         return next();
//     }

//     const missing = requiredPermissions.filter(p => !userPerms.has(p));
//     res.status(403).json({ message: `Forbidden: Missing permissions [${missing.join(', ')}]` });
// };

// module.exports = permissionMiddleware;

// class PermissionMiddleware extends Middleware {
//     constructor(requiredPermissions = []) {
//         super();
//         this.requiredPermissions = requiredPermissions;
//     }
//
//     async handle(ctx, next) {
//         const { user, res } = ctx;
//
//         if (!user) {
//             res.status(401).json({ message: 'Unauthorized' });
//             return;
//         }
//
//         const userPerms = new Set();
//         user.roles.forEach(role => {
//             const perms = ROLE_PERMISSIONS[role] || [];
//             if (perms.includes('*')) {
//                 userPerms.add('*');
//             } else {
//                 perms.forEach(p => userPerms.add(p));
//             }
//         });
//
//         if (userPerms.has('*')) {
//             await next();
//             return;
//         }
//
//         const missing = this.requiredPermissions.filter(p => !userPerms.has(p));
//         if (missing.length) {
//             res.status(403).json({ message: `Forbidden: Missing permissions ${missing.join(', ')}` });
//             return;
//         }
//
//         await next();
//     }
// }

export { permissionMiddleware };