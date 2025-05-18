/**
 * Wraps multiple middlewares + final handler for express routes.
 * Usage:
 * app.get('/foo', withMiddlewares(m1, m2, ..., handler))
 */
const withMiddlewares = (...fns) => (req, res, next) => {
    let i = 0;
    const nextMiddleware = (err) => {
        if (err) return next(err);
        if (i >= fns.length) return next();
        const fn = fns[i++];
        try {
            fn(req, res, nextMiddleware);
        } catch (e) {
            next(e);
        }
    };
    nextMiddleware();
};

module.exports = withMiddlewares;