async function runMiddlewarePipeline(ctx, middlewares) {
    let index = -1;

    async function next() {
        index++;
        if (index < middlewares.length) {
            await middlewares[index].handle(ctx, next);
        }
    }

    await next();
}

// async function* middlewarePipeline(ctx, middlewares) {
//     for (const mw of middlewares) {
//         const result = await mw(ctx);
//         if (isErr(result)) {
//             yield result;
//             break;
//         }
//         ctx = result.ctx;
//         yield ok(ctx);
//     }
//     return ok(ctx);
// }