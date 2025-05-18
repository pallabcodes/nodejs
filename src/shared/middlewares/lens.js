// src/middlewares/lens.js
const lens = (getter, setter) => ({ get: getter, set: setter });

const userLens = lens(
  (ctx) => ctx.user,
  (val, ctx) => ({ ...ctx, user: val })
);

module.exports = { lens, userLens };
