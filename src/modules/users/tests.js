// src/modules/users/tests.js
import assert from 'assert';
import { checkPermissions } from '../../shared/middlewares/permission.js';
import { ok, isErr } from '../../shared/utils/result.js';

// Test suite for permission middleware
const testPermissions = async () => {
  const mockCtx = {
    req: {
      user: {
        permissions: ['CREATE_USER', 'DELETE_USER']
      }
    }
  };

  // Test case: User has required permissions
  const result1 = await checkPermissions(['CREATE_USER'])(mockCtx);
  assert.ok(isOk(result1), 'Should allow user with required permission');

  // Test case: User lacks required permission
  const result2 = await checkPermissions(['ADMIN'])(mockCtx);
  assert.ok(isErr(result2), 'Should deny user without required permission');

  // Test case: No user in context
  const result3 = await checkPermissions(['CREATE_USER'])({ req: {} });
  assert.ok(isErr(result3), 'Should deny request without user');
};

// Run tests
testPermissions().catch(console.error);
