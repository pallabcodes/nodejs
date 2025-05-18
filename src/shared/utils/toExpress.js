const { isErr } = require('./result');

const toExpress = (middleware, handler) => async (req, res, next) => {
  const ctx = { req, res, meta: {}, user: null };
  try {
    const result = await middleware(ctx);
    
    if (isErr(result)) {
      const { error } = result;
      if (!res.headersSent) {
        res.status(error.status || 400).json({ message: error.message });
      }
      return;
    }

    if (result.ctx?.user) {
      req.user = result.ctx.user;
    }

    await handler(req, res, next);
    
  } catch (err) {
    next(err);
  }
};

module.exports = toExpress;
