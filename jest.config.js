/** @type {import('jest').Config} */
const config = {
  // Indicate whether each individual test should be reported during the run
  verbose: true,

  // Node environment for backend testing
  testEnvironment: 'node',

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Collect coverage information
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Patterns to include in coverage reporting
  collectCoverageFrom: [
    'server/services/**/*.js',
    'server/middleware/**/*.js',
    '!server/node_modules/**',
  ],

  // Fail below 80% globally and 100% strictly for expenseEngine financial math
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './server/services/expenseEngine/**/*.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },

  // Setup files to run before tests (e.g., seeding mocks, configuring env)
  setupFilesAfterEnv: ['./tests/setup.js'],

  // Test Matchers separating Unit vs Integration
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js'
  ],
};

module.exports = config;
