import { v4 as uuidv4 } from 'uuid';
import { ok } from '../utils/result.js';

export const requestContext = async (ctx) => {
  const requestId = ctx.req.headers['x-request-id'] || uuidv4();
  const startTime = Date.now();

  // Add request context to the request object
  ctx.req.requestContext = {
    id: requestId,
    startTime,
    path: ctx.req.path,
    method: ctx.req.method,
    ip: ctx.req.ip,
    userAgent: ctx.req.get('user-agent')
  };

  // Add response tracking
  const originalEnd = ctx.res.end;
  ctx.res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    ctx.res.setHeader('X-Request-ID', requestId);
    ctx.res.setHeader('X-Response-Time', `${duration}ms`);
    return originalEnd.call(this, chunk, encoding);
  };

  return ok(ctx);
};
