// shared/utils/createRoute.js
const composeMiddleware = require('./_composeMiddleware.js');
const wrapRouteHandler = require('./wrapRouteHandler');

function createRoute(middlewares, handler) {
    return [composeMiddleware(middlewares), wrapRouteHandler(handler)];
}

module.exports = createRoute;