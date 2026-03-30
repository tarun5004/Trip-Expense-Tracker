/**
 * @module server
 * @description Application Entry Point handling external network configurations,
 *              health checks across DBs, and trapping OS signals for Graceful Shutdown.
 */

require('dotenv').config();
const http = require('http');
const app = require('./app');
const pool = require('./config/db'); // Raw pg driver connection
// const redisClient = require('./config/redis'); // Redis connector
const { initSocketServer, closeSocketServer } = require('./realtime/socketServer');

const PORT = process.env.PORT || 5000;

// Base HTTP Server instance extracting it from Express
const server = http.createServer(app);

// Wire Realtime engine onto HTTP frame
initSocketServer(server);

// Boot sequence wrapping Promises
const startServer = async () => {
  try {
    // 1. Verify PostgreSQL Database heartbeat
    console.log('[Boot] Verifying Database Connection...');
    await pool.query('SELECT NOW()'); 
    console.log('[Boot] PostgreSQL connection established successfully.');

    // 2. Verify Redis (If implemented)
    // console.log('[Boot] Verifying Redis...');
    // await redisClient.ping();
    // console.log('[Boot] Redis connected.');

    // 3. Ignite Listeners
    server.listen(PORT, () => {
      console.log(`[Boot] Server is listening on http://localhost:${PORT}`);
      console.log(`[Boot] Environment: ${process.env.NODE_NODE || 'development'}`);
    });

  } catch (err) {
    console.error('[Boot] FATAL ERROR during initialization:', err);
    process.exit(1); 
  }
};

startServer();

// --- Graceful Shutdown Orchestration ---
// Trapping signals from Docker/Kubernetes/PM2

const gracefulShutdown = async (signal) => {
  console.log(`\n[Shutdown] Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new HTTP requests immediately
  server.close(async () => {
    console.log('[Shutdown] Closed HTTP server. No longer accepting fresh connections.');
    
    try {
      // 1. Close active WebSocket circuits
      console.log('[Shutdown] Draining WebSocket pipes...');
      await closeSocketServer();

      // 2. Terminate Database Pool connections cleanly preventing ghost locks
      console.log('[Shutdown] Terminating PostgreSQL Pool...');
      await pool.end();

      // 3. Close Redis
      // console.log('[Shutdown] Closing Redis connection...');
      // await redisClient.quit();

      console.log('[Shutdown] Phase complete. Halting process normally.');
      process.exit(0);

    } catch (err) {
      console.error('[Shutdown] Shutdown sequenced failed:', err);
      process.exit(1);
    }
  });

  // Safe Fallback: if connections hang, force exit after 10s
  setTimeout(() => {
    console.error('[Shutdown] Watchdog timeout triggered (10s). Forcing Process Exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Docker stop
