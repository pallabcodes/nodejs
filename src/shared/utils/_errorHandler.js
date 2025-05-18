const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const response = {
        error: {
            name: err.name,
            message: err.message,
        },
    };
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(status).json(response);
};

module.exports = errorHandler;