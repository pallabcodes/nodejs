const loggerMiddleware = (logger) => async (ctx) => {
    logger.info(`Request ${ctx.req.method} ${ctx.req.originalUrl} started`, { requestId: ctx.requestId });
    return ok(ctx);
};