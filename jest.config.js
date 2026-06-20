module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'games/**/*.js',
    'models/**/*.js',
    'matchmaking.js',
    '!**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true
};
