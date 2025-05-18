// src/modules/users/tests.js
const assert = require('assert');
const { checkPermissions } = require('../../middlewares/permission');
const { ok, isErr } = require('../../utils/result');

(async () => {
  const adminCtx = { user: { roles: ['admin'] } };
  const userCtx = { user: { roles: ['user'] } };

  const adminResult = await checkPermissions(['create_user'])(adminCtx);
  assert.ok(adminResult.ok, 'Admin should pass permission');

  const userResult = await checkPermissions(['create_user'])(userCtx);
  assert.ok(isErr(userResult), 'User should fail permission');

  console.log('✅ Permission middleware tests passed.');
})();
