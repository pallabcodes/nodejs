module.exports = {
  "*.js": [
    "eslint --fix",
    "prettier --write",
    "git add"
  ],
  "*.{json,yml,yaml,md}": [
    "prettier --write",
    "git add"
  ]
};
