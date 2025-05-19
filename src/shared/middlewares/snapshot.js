// src/middlewares/snapshot.js
import { ok } from '../utils/result.js';

export const snapshotMiddleware = async (ctx) => {
  try {
    const { req } = ctx;
    const snapshot = {
      timestamp: new Date().toISOString(),
      requestId: req.requestContext?.id,
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      user: req.user ? {
        id: req.user.id,
        email: req.user.email
      } : null
    };

    // Store snapshot in request context for later use
    req.requestContext.snapshot = snapshot;

    return ok(ctx);
  } catch (error) {
    // Don't fail the request if snapshot fails
    console.error('Snapshot middleware error:', error);
    return ok(ctx);
  }
};
