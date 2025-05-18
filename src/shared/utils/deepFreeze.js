const deepFreeze = (obj) => {
  Object.getOwnPropertyNames(obj).forEach((key) => {
    if (obj[key] && typeof obj[key] === 'object') deepFreeze(obj[key]);
  });
  return Object.freeze(obj);
};

module.exports = deepFreeze;
