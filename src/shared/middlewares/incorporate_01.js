// how to incorporate below in the current architecture

const pipelineConfig = [
    'authMiddleware',
    ['permissionMiddleware', ['create_user']],
    'loggingMiddleware',
];

const middlewareMap = {
    authMiddleware,
    permissionMiddleware: (perms) => permissionMiddleware(perms),
    loggingMiddleware: loggerMiddleware(customLogger),
};

const buildPipeline = (config) =>
    compose(config.map(c => Array.isArray(c) ? middlewareMap[c[0]](...c.slice(1)) : middlewareMap[c]));