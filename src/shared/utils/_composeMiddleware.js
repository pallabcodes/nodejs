// async function runMiddlewarePipeline(ctx, middlewares) {
//     let index = -1;
//     async function next() {
//         index++;
//         if (index < middlewares.length) {
//             await middlewares[index].handle(ctx, next);
//         }
//     }
//     await next();
// }

const runPipeline = async (ctx, fns) => {
    let index = -1;
    const next = async () => {
        index++;
        if (index < fns.length) await fns[index](ctx.req, ctx.res, next);
    };
    await next();
};

const _composeMiddleware = (middlewareFns) => (req, res, next) => {
    const ctx = { req, res };
    runPipeline(ctx, middlewareFns).then(() => {
        if (!res.headersSent) next();
    }).catch(next);
};

/**
 * Compose multiple Middleware instances into one express middleware function.
 * @param {Middleware[]} middlewareInstances
 * @returns {Function} Express middleware function (req, res, next)
 */
// function _composeMiddleware(middlewareInstances) {
//     return async function (req, res, next) {
//         const ctx = { req, res };
//         try {
//             await runMiddlewarePipeline(ctx, middlewareInstances);
//             if (!res.headersSent) {
//                 next();
//             }
//         } catch (err) {
//             next(err);
//         }
//     };
// }

export { _composeMiddleware };