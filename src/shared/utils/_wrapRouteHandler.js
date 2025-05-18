/**
 * Wraps async route handler to catch errors and forward to express error handler
 * @param {Function} handler async (req, res) => {}
 */
function wrapRouteHandler(handler) {
    return async function (req, res, next) {
        try {
            await handler(req, res);
        } catch (err) {
            next(err);
        }
    };
}

export { wrapRouteHandler };