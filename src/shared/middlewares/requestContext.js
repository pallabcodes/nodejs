const { v4: uuidv4 } = require('uuid');
const { ok } = require('../utils/result');

const requestContext = async (ctx) => {
  const { req } = ctx;
  const requestId = req.headers['x-request-id'] || uuidv4();

  return ok({
    ...ctx,
    requestId,
    startTime: Date.now(),
    meta: {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
};

module.exports = requestContext;
