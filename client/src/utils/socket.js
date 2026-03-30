/**
 * @fileoverview Singleton Socket.IO client with auto-reconnection,
 * JWT auth injection, and typed event subscription helpers.
 *
 * @module client/utils/socket
 * @usedBy useRealtime() custom hook, React Query invalidation layer
 *
 * USAGE:
 *   import { createSocketClient, subscribeToGroup, getConnectionStatus } from '@/utils/socket';
 *
 *   // Initialize once at app startup
 *   const socket = createSocketClient(() => localStorage.getItem('accessToken'));
 *
 *   // Join a group's realtime channel
 *   subscribeToGroup('group-uuid');
 *
 *   // Listen for events
 *   on('expense:created', (data) => {
 *     queryClient.invalidateQueries(['expenses', data.groupId]);
 *   });
 */

import { io } from 'socket.io-client';

/** @type {import('socket.io-client').Socket | null} */
let socket = null;

/** @type {Set<string>} Track processed eventIds for client-side idempotency */
const processedEvents = new Set();

/** Maximum number of processed event IDs to retain (prevents memory leak) */
const MAX_PROCESSED_EVENTS = 1000;

/**
 * @function createSocketClient
 * @description Factory that creates and configures a Socket.IO client instance.
 * Uses lazy token injection — calls getToken() on each connection attempt
 * to pick up refreshed tokens automatically.
 *
 * @param {() => string | null} getToken - Function that returns the current JWT access token.
 *   Called on every connection/reconnection attempt to always use the freshest token.
 * @param {string} [serverUrl] - Socket.IO server URL. Defaults to window.location.origin.
 * @returns {import('socket.io-client').Socket} Configured Socket.IO client instance
 *
 * @example
 * const socket = createSocketClient(
 *   () => localStorage.getItem('accessToken'),
 *   'http://localhost:3000'
 * );
 */
export function createSocketClient(getToken, serverUrl) {
  if (socket) {
    console.warn('[Socket] Client already initialized. Returning existing instance.');
    return socket;
  }

  const url = serverUrl || window.location.origin;

  socket = io(url, {
    // Transport configuration
    transports: ['websocket'],
    upgrade: false,

    // Authentication — call getToken() on each attempt, don't store stale token
    auth: (cb) => {
      const token = getToken();
      if (!token) {
        console.warn('[Socket] No auth token available');
      }
      cb({ token: token || '' });
    },

    // Reconnection with exponential backoff
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,        // Start at 1s
    reconnectionDelayMax: 30000,    // Cap at 30s
    randomizationFactor: 0.5,       // Jitter to prevent thundering herd

    // Don't auto-connect — let the app control when to connect
    autoConnect: false,

    // Timeouts
    timeout: 10000,
  });

  // ─── Connection lifecycle logging ─────────────────────────────

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('connection:established', (data) => {
    console.log('[Socket] Server handshake complete:', {
      userId: data.userId,
      rooms: data.joinedRooms.length,
      serverTime: data.serverTimestamp,
    });
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server forcefully disconnected — likely auth issue, don't auto-reconnect
      console.error('[Socket] Server disconnected us. Token may be expired.');
    }
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
    if (error.message === 'UNAUTHORIZED' || error.message === 'TOKEN_EXPIRED') {
      console.error('[Socket] Auth failed — stopping reconnection.');
      socket.disconnect(); // Stop reconnection attempts
    }
  });

  socket.io.on('reconnect', (attemptNumber) => {
    console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
  });

  socket.io.on('reconnect_attempt', (attemptNumber) => {
    console.log(`[Socket] Reconnection attempt ${attemptNumber}/5`);
  });

  socket.io.on('reconnect_failed', () => {
    console.error('[Socket] All reconnection attempts failed');
  });

  return socket;
}

/**
 * @function getSocket
 * @description Get the current socket instance. Returns null if not initialized.
 * @returns {import('socket.io-client').Socket | null}
 */
export function getSocket() {
  return socket;
}

/**
 * @function connect
 * @description Manually connect the socket (since autoConnect is false).
 * Call this after the user logs in and a valid token is available.
 * @returns {void}
 */
export function connect() {
  if (!socket) {
    console.error('[Socket] Client not initialized. Call createSocketClient() first.');
    return;
  }
  if (!socket.connected) {
    socket.connect();
  }
}

/**
 * @function disconnect
 * @description Manually disconnect the socket. Call on logout.
 * @returns {void}
 */
export function disconnect() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

/**
 * @function subscribeToGroup
 * @description Join a group's realtime channel. Server will verify membership.
 * @param {string} groupId - Group UUID to subscribe to
 * @returns {Promise<{ success: boolean, room?: string, memberCount?: number, error?: string }>}
 */
export function subscribeToGroup(groupId) {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      return resolve({ success: false, error: 'NOT_CONNECTED' });
    }

    socket.emit('group:join', { groupId }, (response) => {
      if (response.success) {
        console.log(`[Socket] Subscribed to group:${groupId} (${response.memberCount} online)`);
      } else {
        console.warn(`[Socket] Failed to subscribe to group:${groupId}:`, response.error);
      }
      resolve(response);
    });
  });
}

/**
 * @function unsubscribeFromGroup
 * @description Leave a group's realtime channel.
 * @param {string} groupId - Group UUID to unsubscribe from
 * @returns {Promise<{ success: boolean }>}
 */
export function unsubscribeFromGroup(groupId) {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      return resolve({ success: false, error: 'NOT_CONNECTED' });
    }

    socket.emit('group:leave', { groupId }, (response) => {
      console.log(`[Socket] Unsubscribed from group:${groupId}`);
      resolve(response);
    });
  });
}

/**
 * @function on
 * @description Subscribe to a server→client event with automatic idempotency.
 * If the payload contains an `eventId`, duplicate events are silently dropped.
 * @param {string} event - Event name (e.g., 'expense:created')
 * @param {(data: any) => void} handler - Event handler
 * @returns {void}
 */
export function on(event, handler) {
  if (!socket) {
    console.error('[Socket] Client not initialized. Call createSocketClient() first.');
    return;
  }

  socket.on(event, (data) => {
    // Idempotency guard — skip duplicate events
    if (data?.eventId) {
      if (processedEvents.has(data.eventId)) {
        console.debug(`[Socket] Duplicate event skipped: ${event} (${data.eventId})`);
        return;
      }
      processedEvents.add(data.eventId);

      // Prevent unbounded memory growth
      if (processedEvents.size > MAX_PROCESSED_EVENTS) {
        const iterator = processedEvents.values();
        // Remove oldest 20% of entries
        const toRemove = Math.floor(MAX_PROCESSED_EVENTS * 0.2);
        for (let i = 0; i < toRemove; i++) {
          processedEvents.delete(iterator.next().value);
        }
      }
    }

    handler(data);
  });
}

/**
 * @function off
 * @description Unsubscribe from a server→client event. Cleanup helper.
 * @param {string} event - Event name
 * @param {(data: any) => void} [handler] - Specific handler to remove.
 *   If omitted, removes ALL handlers for this event.
 * @returns {void}
 */
export function off(event, handler) {
  if (!socket) return;

  if (handler) {
    socket.off(event, handler);
  } else {
    socket.removeAllListeners(event);
  }
}

/**
 * @function getConnectionStatus
 * @description Get the current connection status of the socket.
 * @returns {'connected' | 'disconnected' | 'reconnecting'}
 */
export function getConnectionStatus() {
  if (!socket) return 'disconnected';
  if (socket.connected) return 'connected';
  if (socket.io?._reconnecting) return 'reconnecting';
  return 'disconnected';
}

/**
 * @function emitPing
 * @description Send a ping to the server and measure round-trip latency.
 * @returns {Promise<{ serverTimestamp: string, latencyMs: number }>}
 */
export function emitPing() {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      return reject(new Error('NOT_CONNECTED'));
    }

    const clientTimestamp = new Date().toISOString();
    const start = Date.now();

    socket.emit('ping', { clientTimestamp }, (response) => {
      resolve({
        ...response,
        roundTripMs: Date.now() - start,
      });
    });
  });
}

/**
 * @function destroySocket
 * @description Completely destroy the socket instance. Used on logout or app unmount.
 * Clears all listeners, disconnects, and resets the singleton.
 * @returns {void}
 */
export function destroySocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  processedEvents.clear();
}

export default {
  createSocketClient,
  getSocket,
  connect,
  disconnect,
  subscribeToGroup,
  unsubscribeFromGroup,
  on,
  off,
  getConnectionStatus,
  emitPing,
  destroySocket,
};
