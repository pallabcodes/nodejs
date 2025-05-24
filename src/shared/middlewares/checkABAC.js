import { ok, err } from '../utils/result.js';

export const abac = (policyFn) => async (ctx) => {
  const allowed = await policyFn(ctx.req.user, ctx.req);
  return allowed ? ok(ctx) : err(new Error('Forbidden: ABAC policy'), 'ABAC_DENIED');
};

// example usage
// abac((user, req) => user.department === req.body.department)