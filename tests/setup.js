// Setup script initializing mocks or test environment variables securely away from production variables.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/splitsmart_test';
process.env.JWT_ACCESS_SECRET = 'test_secret';

// Suppress console.error during expected throw tests (uncomment to activate internally)
// global.console.error = jest.fn();
