/**
 * @fileoverview HTTP server entry point.
 * Creates the server, connects to PostgreSQL + Redis, and handles graceful shutdown.
 * @module server
 */

const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { testConnection, closePool } = require('./config/db');
const { testRedisConnection, closeRedis } = require('./config/redis');

const server = http.createServer(app);

/**
 * @description Start the server after connecting to all external services.
 * @returns {Promise<void>}
 */
async function startServer() {
  try {
    // Connect to PostgreSQL
    console.log('🔄 Connecting to PostgreSQL...');
    await testConnection();

    // Connect to Redis
    console.log('🔄 Connecting to Redis...');
    await testRedisConnection();

    // Start HTTP server
    server.listen(env.PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 SplitSmart API Server                       ║
║                                                   ║
║   Environment:  ${env.NODE_ENV.padEnd(15)}              ║
║   Port:         ${String(env.PORT).padEnd(15)}              ║
║   API Version:  ${env.API_VERSION.padEnd(15)}              ║
║   Health:       http://localhost:${env.PORT}/health    ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║   Endpoints:    /api/${env.API_VERSION}/auth               ║
║                 /api/${env.API_VERSION}/users              ║
║                 /api/${env.API_VERSION}/groups             ║
║                 /api/${env.API_VERSION}/expenses           ║
║                 /api/${env.API_VERSION}/payments           ║
║                 /api/${env.API_VERSION}/balances           ║
║                 /api/${env.API_VERSION}/activity           ║
║                 /api/${env.API_VERSION}/notifications      ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────

/**
 * @description Gracefully shut down the server and all connections.
 * @param {string} signal - The OS signal that triggered shutdown
 */
async function gracefulShutdown(signal) {
  console.log(`\n⚠️ Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('🔌 HTTP server closed');

    try {
      // Close database connection pool
      await closePool();
    } catch (err) {
      console.error('Error closing PostgreSQL pool:', err.message);
    }

    try {
      // Close Redis connection
      await closeRedis();
    } catch (err) {
      console.error('Error closing Redis:', err.message);
    }

    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  });

  // Force kill after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('❌ Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
}

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  // In production, we'd want to log and potentially restart
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // This is a programming error — exit and let process manager restart
  process.exit(1);
});

// Start the server
startServer();

module.exports = server;
