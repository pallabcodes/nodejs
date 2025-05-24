import { getPolicy } from '../policy/policyRegistry.js';
import { ok, err } from '../utils/result.js';

export const pbac = (policyName) => async (ctx) => {
  const policy = getPolicy(policyName);
  if (!policy) return err(new Error('Policy not found'), 'PBAC_POLICY_NOT_FOUND');
  const allowed = await policy(ctx.req.user, ctx.req);
  return allowed ? ok(ctx) : err(new Error('Forbidden: PBAC policy'), 'PBAC_DENIED');
};