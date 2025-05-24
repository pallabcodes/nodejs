import { ok } from '../../../shared/utils/result.js';

export const cacheCheck = async (ctx) => {
  const { req, res } = ctx;
  // Example: simulate a cache hit for a specific email
  if (req.body.email === 'cached@example.com') {
    res.json({ message: 'Cached login', user: { email: req.body.email } });
    return { skip: true };
  }
  return ok(ctx);
};