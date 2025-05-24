import { compose } from '../shared/utils/compose.js';
import { immutableContext } from './immutableContext.js';
import { requestContext } from '../shared/middlewares/requestContext.js';
import { checkRole, checkPermission } from '../shared/middlewares/rbac.js';
import { abac } from '../shared/middlewares/abac.js';
import { pbac } from '../shared/middlewares/pbac.js';
import { rebac } from '../shared/middlewares/rebac.js';

export default compose(
  immutableContext,
  requestContext,
  checkRole(['admin', 'manager']),
  checkPermission(['manage_users']),
  abac((user, req) => user.department === req.body.department),
  pbac('canEditUser'),
  rebac((user, resource) => resource.owners.includes(user.id))
);