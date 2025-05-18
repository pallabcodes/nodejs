const pipelineProxy = (middlewares) => {
  let active = compose(...middlewares);
  return new Proxy(active, {
    get(_, prop) {
      if (prop === 'reload') {
        return (newMws) => {
          active = compose(...newMws);
        };
      }
      return active[prop];
    },
    apply(target, thisArg, args) {
      return active.apply(thisArg, args);
    },
  });
};

const compose = require('./compose');

module.exports = pipelineProxy;
