/**
 * @fileoverview Client → Server event handlers for Socket.IO.
 * Registers handlers for all incoming client events on each socket connection.
 *
 * @module realtime/eventHandlers
 * @connectsTo socketServer.js (registered per-socket), roomManager.js
 *
 * CLIENT → SERVER EVENTS:
 *   group:join   → validate membership → join room → broadcast member:online
 *   group:leave  → leave room → broadcast member:offline
 *   ping         → emit pong with server timestamp (connection health check)
 *
 * RULES:
 *   - Authentication is already verified by socketServer.js middleware
 *   - All events have try/catch — errors are emitted back to the client via 'error'
 *   - NEVER trust client-supplied data for authorization — always verify from DB
 */

const roomManager = require('./roomManager');
const { v4: uuidv4 } = require('uuid');

/**
 * @function registerEventHandlers
 * @description Register all client→server event handlers on a socket.
 * Called once per connection after authentication passes.
 * @param {import('socket.io').Socket} socket - Authenticated socket instance
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @returns {void}
 */
function registerEventHandlers(socket, io) {
  const user = socket.data.user;

  // ─── group:join ────────────────────────────────────────────────
  /**
   * @event group:join (C→S)
   * @description Client requests to join a specific group room.
   * Verifies membership from DB before joining.
   * @payload {{ groupId: string }}
   * @emits group:join:result → { success, room, memberCount?, error? }
   * @emits member:online → broadcast to group room (excluding sender)
   */
  socket.on('group:join', async (payload, callback) => {
    try {
      const { groupId } = payload || {};

      if (!groupId) {
        const errorResponse = { success: false, error: 'MISSING_GROUP_ID' };
        if (typeof callback === 'function') return callback(errorResponse);
        return socket.emit('group:join:result', errorResponse);
      }

      const result = await roomManager.joinGroupRoom(socket, groupId);

      if (result.success) {
        // Broadcast to other group members that this user came online
        socket.to(`group:${groupId}`).emit('member:online', {
          eventId: uuidv4(),
          userId: user.id,
          name: user.name,
          groupId,
          timestamp: new Date().toISOString(),
        });
      }

      if (typeof callback === 'function') return callback(result);
      socket.emit('group:join:result', result);
    } catch (error) {
      console.error('❌ [Event] group:join error:', error.message);
      const errorResponse = { success: false, error: 'INTERNAL_ERROR' };
      if (typeof callback === 'function') return callback(errorResponse);
      socket.emit('group:join:result', errorResponse);
    }
  });

  // ─── group:leave ───────────────────────────────────────────────
  /**
   * @event group:leave (C→S)
   * @description Client requests to leave a group room.
   * @payload {{ groupId: string }}
   * @emits group:leave:result → { success, room }
   * @emits member:offline → broadcast to group room (excluding sender)
   */
  socket.on('group:leave', async (payload, callback) => {
    try {
      const { groupId } = payload || {};

      if (!groupId) {
        const errorResponse = { success: false, error: 'MISSING_GROUP_ID' };
        if (typeof callback === 'function') return callback(errorResponse);
        return socket.emit('group:leave:result', errorResponse);
      }

      // Broadcast to group BEFORE leaving (so sender is still in room context)
      socket.to(`group:${groupId}`).emit('member:offline', {
        eventId: uuidv4(),
        userId: user.id,
        name: user.name,
        groupId,
        timestamp: new Date().toISOString(),
      });

      const result = await roomManager.leaveGroupRoom(socket, groupId);

      if (typeof callback === 'function') return callback(result);
      socket.emit('group:leave:result', result);
    } catch (error) {
      console.error('❌ [Event] group:leave error:', error.message);
      const errorResponse = { success: false, error: 'INTERNAL_ERROR' };
      if (typeof callback === 'function') return callback(errorResponse);
      socket.emit('group:leave:result', errorResponse);
    }
  });

  // ─── ping ──────────────────────────────────────────────────────
  /**
   * @event ping (C→S)
   * @description Health check — client sends ping, server replies with pong.
   * Useful for measuring latency and confirming connection is alive.
   * @payload {{ clientTimestamp?: string }}
   * @emits pong → { serverTimestamp, clientTimestamp?, latencyMs? }
   */
  socket.on('ping', (payload, callback) => {
    const response = {
      serverTimestamp: new Date().toISOString(),
      clientTimestamp: payload?.clientTimestamp || null,
    };

    if (payload?.clientTimestamp) {
      response.latencyMs = Date.now() - new Date(payload.clientTimestamp).getTime();
    }

    if (typeof callback === 'function') return callback(response);
    socket.emit('pong', response);
  });

  // ─── typing:start / typing:stop ───────────────────────────────
  /**
   * @event typing:start (C→S)
   * @description Indicate user started typing in a group (for live presence).
   * @payload {{ groupId: string }}
   * @broadcasts typing:start to group room (excluding sender)
   */
  socket.on('typing:start', (payload) => {
    const { groupId } = payload || {};
    if (groupId) {
      socket.to(`group:${groupId}`).emit('typing:start', {
        userId: user.id,
        name: user.name,
        groupId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * @event typing:stop (C→S)
   * @description Indicate user stopped typing.
   * @payload {{ groupId: string }}
   * @broadcasts typing:stop to group room (excluding sender)
   */
  socket.on('typing:stop', (payload) => {
    const { groupId } = payload || {};
    if (groupId) {
      socket.to(`group:${groupId}`).emit('typing:stop', {
        userId: user.id,
        groupId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ─── disconnect ────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    roomManager.handleDisconnect(socket, reason);
  });
}

module.exports = { registerEventHandlers };
