const instrumentMiddleware = (mw, name) => async (ctx) => {
    const start = Date.now();
    const result = await mw(ctx);
    const duration = Date.now() - start;

    if (duration > 50) {
        console.warn(`Middleware ${name} took ${duration}ms`);
    }

    return result;
};