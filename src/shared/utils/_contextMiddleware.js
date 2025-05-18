const { v4: uuidv4 } = require('uuid');

const contextMiddleware = async (ctx) => {
    const { req } = ctx;
    const requestId = req.headers['x-request-id'] || uuidv4();

    const extendedCtx = {
        ...ctx,
        requestId,
        startTime: Date.now(),
        clientIp: req.ip,
        userAgent: req.headers['user-agent'],
    };

    return ok(extendedCtx);
};