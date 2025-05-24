import { ok, err } from '../utils/result.js';

// Example: user can access resource if they are owner or in allowed list
export const rebac = (relationFn) => async (ctx) => {
  const allowed = await relationFn(ctx.req.user, ctx.req.resource);
  return allowed ? ok(ctx) : err(new Error('Forbidden: ReBAC policy'), 'REBAC_DENIED');
};