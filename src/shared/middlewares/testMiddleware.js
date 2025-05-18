const testMiddleware = async (middleware, ctx) => {
    const result = await middleware(ctx);
    if (isErr(result)) {
        console.log('Middleware failed:', result.error.message);
    } else {
        console.log('Middleware succeeded');
    }
};