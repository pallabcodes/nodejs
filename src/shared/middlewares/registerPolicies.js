const policies = {};

export const registerPolicy = (name, fn) => { policies[name] = fn; };
export const getPolicy = (name) => policies[name];