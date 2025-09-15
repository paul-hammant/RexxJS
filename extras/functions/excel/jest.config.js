module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.spec.js', '**/*.test.js'],
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};