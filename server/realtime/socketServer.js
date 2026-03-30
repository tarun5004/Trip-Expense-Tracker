/**
 * @fileoverview Socket.IO server initialization, authentication middleware,
 * and handler registration.
 *
 * @module realtime/socketServer
 * @connectsTo server.js (receives httpServer), roomManager, eventHandlers, eventEmitter
 *
 * LIFECYCLE:
 *   1. server.js creates httpServer and passes it to initSocketServer()
 *   2. This module creates the Socket.IO server attached to httpServer
 *   3. Authentication middleware verifies JWT from handshake.auth.token
 *   4. On valid auth: auto-join user to all their group rooms
 *   5. Register event handlers for the connection
 *   6. Emit 'connection:established' to the client
 *   7. Register the internal event bridge (eventEmitter → Socket.IO)
 */

const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/token');
const { registerEventHandlers } = require('./eventHandlers');
const { joinAllUserRooms, handleDisconnect } = require('./roomManager');
const { registerSocketBridge } = require('./eventEmitter');
const env = require('../config/env');

/** @type {import('socket.io').Server|null} */
let io = null;

/**
 * @function initSocketServer
 * @description Initialize Socket.IO server with authentication middleware
 * and register all event handlers. Called once during server startup.
 * @param {import('http').Server} httpServer - Node.js HTTP server instance
 * @returns {import('socket.io').Server} Configured Socket.IO server instance
 */
function initSocketServer(httpServer) {
  const corsOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,        // How often to send ping packets (ms)
    pingTimeout: 20000,         // How long to wait for pong before disconnect (ms)
    maxHttpBufferSize: 1e6,     // 1MB max message size
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,  // 2 minutes
      skipMiddlewares: false,                     // Always re-auth
    },
  });

  // ─── Authentication Middleware ──────────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        console.warn('🔒 [Socket Auth] No token provided');
        return next(new Error('UNAUTHORIZED'));
      }

      // Verify JWT — same secret as REST API auth middleware
      const decoded = verifyAccessToken(token);

      // Attach user data to socket for use in handlers
      socket.data.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.warn('🔒 [Socket Auth] Token expired');
        return next(new Error('TOKEN_EXPIRED'));
      }
      console.warn('🔒 [Socket Auth] Invalid token:', error.message);
      return next(new Error('UNAUTHORIZED'));
    }
  });

  // ─── Connection Handler ────────────────────────────────────────
  io.on('connection', async (socket) => {
    const user = socket.data.user;
    console.log(`🔌 [Socket] Connected: ${user.id} (${user.email}) — socket: ${socket.id}`);

    try {
      // Auto-join user to all their group rooms + personal notification room
      const joinedRooms = await joinAllUserRooms(socket);

      // Register all client→server event handlers
      registerEventHandlers(socket, io);

      // Emit connection established event to the client
      socket.emit('connection:established', {
        userId: user.id,
        socketId: socket.id,
        serverTimestamp: new Date().toISOString(),
        joinedRooms,
        message: 'Connected to SplitSmart realtime server',
      });
    } catch (error) {
      console.error(`❌ [Socket] Connection setup failed for ${user.id}:`, error.message);
      socket.emit('connection:error', {
        error: 'CONNECTION_SETUP_FAILED',
        message: 'Failed to initialize realtime connection',
      });
    }
  });

  // ─── Register Internal Event Bridge ────────────────────────────
  // Links internal Node.js EventEmitter events to Socket.IO broadcasts
  registerSocketBridge(io);

  console.log('🔌 Socket.IO server initialized');
  return io;
}

/**
 * @function getIO
 * @description Get the Socket.IO server instance. Throws if not initialized.
 * @returns {import('socket.io').Server}
 * @throws {Error} If socket server is not initialized
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO server not initialized. Call initSocketServer() first.');
  }
  return io;
}

/**
 * @function closeSocketServer
 * @description Gracefully close the Socket.IO server. Disconnects all clients.
 * Called during graceful shutdown.
 * @returns {Promise<void>}
 */
async function closeSocketServer() {
  if (io) {
    await new Promise((resolve) => {
      io.close(() => {
        console.log('🔌 Socket.IO server closed');
        resolve();
      });
    });
    io = null;
  }
}

module.exports = { initSocketServer, getIO, closeSocketServer };
