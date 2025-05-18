// src/middlewares/lazy.js

const lazy = (fn) => ({
  get: () => fn(),
  cached: false,
  value: undefined,
  eval() {
    if (!this.cached) {
      this.value = this.get();
      this.cached = true;
    }
    return this.value;
  },
});

module.exports = lazy;
