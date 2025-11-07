module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.spec.js',
    '**/tests/**/*.spec.ts',
    '**/__tests__/**/*.js',
    '**/__tests__/**/*.ts',
    '<rootDir>/../examples/**/tests/**/*.spec.js',
    '<rootDir>/../examples/**/tests/**/*.spec.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/core/tests/web/',
    'require-nodejs-wrapper\\.spec\\.js'  // Playwright test
  ],
  coverageDirectory: './coverage/',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/cli.js',
    '!src/rexxjs-cli.js',
    '!src/standalone-tools/**/*.js',
    '!src/output/**/*.js'
  ]
};