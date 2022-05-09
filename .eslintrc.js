module.exports = {
  env: {
    browser: true,
    es2021: true,
      node: true,
      mocha: true
  },
  extends: [
    'airbnb-base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    "indent": ["error", 4],
    "no-use-before-define": ["error", { "functions": false, "classes": true, "variables": true }],
    "object-curly-spacing": ["error", "never"],
    "no-multiple-empty-lines": ["error", { "max": 4, "maxEOF": 0 }],
    "max-len": ["error", { "code": 120 }]
  },
};
