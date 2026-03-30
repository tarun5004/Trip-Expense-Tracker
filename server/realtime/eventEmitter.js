/**
 * @fileoverview Internal event bus that decouples business logic from socket infrastructure.
 * Services emit events here after mutations; the socket layer listens and broadcasts.
 *
 * @module realtime/eventEmitter
 * @pattern Observer / Event Bus (Node.js EventEmitter)
 *
 * FLOW:
 *   expense.service.js → realtimeEmitter.emit('expense:created', payload)
 *       ↓
 *   eventEmitter.js listener → socketServer.to('group:xxx').emit('expense:created', payload)
 *
 * This ensures services never import socket.io directly. The realtime layer
 * can be disabled entirely (e.g., in tests) without touching service code.
 *
 * @usedBy expense.service.js, payment.service.js, group.service.js (emit side)
 * @usedBy socketServer.js (listen side — bridges events to Socket.IO rooms)
 */

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

/**
 * Singleton event bus for internal app → socket communication.
 * Increase max listeners since multiple socket connections may register.
 */
const realtimeEmitter = new EventEmitter();
realtimeEmitter.setMaxListeners(50);

/**
 * @description Internal event names that services emit after mutations.
 * Each maps 1:1 to a Socket.IO event broadcast to the group room.
 * @readonly
 */
const REALTIME_EVENTS = Object.freeze({
  // Expense lifecycle
  EXPENSE_CREATED: 'expense:created',
  EXPENSE_UPDATED: 'expense:updated',
  EXPENSE_DELETED: 'expense:deleted',

  // Payment lifecycle
  PAYMENT_RECORDED: 'payment:recorded',
  PAYMENT_DELETED: 'payment:deleted',

  // Balance changes (emitted after any expense or payment mutation)
  BALANCE_UPDATED: 'balance:updated',

  // Group membership
  MEMBER_JOINED: 'member:joined',
  MEMBER_LEFT: 'member:left',

  // Group metadata
  GROUP_UPDATED: 'group:updated',
  GROUP_ARCHIVED: 'group:archived',

  // Notifications
  NOTIFICATION_CREATED: 'notification:created',
});

/**
 * @function emitRealtimeEvent
 * @description Convenience wrapper that injects a unique eventId and timestamp
 * into every emitted payload. Services should use this instead of raw .emit().
 * @param {string} eventName - One of REALTIME_EVENTS constants
 * @param {object} payload - Event-specific data (must include groupId)
 * @returns {void}
 * @example
 * emitRealtimeEvent(REALTIME_EVENTS.EXPENSE_CREATED, {
 *   groupId: 'abc-123',
 *   expense: { id: 'exp-1', title: 'Dinner', totalAmountCents: 5000 },
 *   actorUserId: 'user-1'
 * });
 */
function emitRealtimeEvent(eventName, payload) {
  const enrichedPayload = {
    ...payload,
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
  };

  realtimeEmitter.emit(eventName, enrichedPayload);
}

/**
 * @function registerSocketBridge
 * @description Called once during server startup by socketServer.js.
 * Registers listeners on the internal event bus that forward events
 * to the appropriate Socket.IO group room.
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @returns {void}
 */
function registerSocketBridge(io) {
  // ─── Expense Events ──────────────────────────────────────────

  realtimeEmitter.on(REALTIME_EVENTS.EXPENSE_CREATED, (payload) => {
    const { groupId, ...data } = payload;
    io.to(`group:${groupId}`).emit(REALTIME_EVENTS.EXPENSE_CREATED, data);
  });

  realtimeEmitter.on(REALTIME_EVENTS.EXPENSE_UPDATED, (payload) => {
    const { groupId, ...data } = payload;
    io.to(`group:${groupId}`).emit(REALTIME_EVENTS.EXPENSE_UPDATED, data);
  });

  realtimeEmitter.on(REALTIME_EVENTS.EXPENSE_DELETED, (payload) => {
    const { groupId, ...data } = payload;
    io.to(`group:${groupId}`).emit(REALTIME_EVENTS.EXPENSE_DELETED, data);
  });

  // ─── Payment Events ──────────────────────────────────────────

  realtimeEmitter.on(REALTIME_EVENTS.PAYMENT_RECORDED, (payload) => {
    const { groupId, ...data } = payload;
    io.to(`group:${groupId}`).emit(REALTIME_EVENTS.PAYMENT_RECORDED, data);
  });

  realtimeEmitter.on(REALTIME_EVENTS.PAYMENT_DELETED, (payload) => {
    const { groupId, ...data } = payload;
    io.to(`group:${groupId}`).emit(REALTIME_EVENTS.PAYMENT_DELETED, data);
  });

  // ─── Balance Events ──────────────────────────────────────────

  realtimeEmitter.on(REALTIME_EVENTS.BALANCE_UPDATED, (payload) => {
    const { groupId, ...data } = payload;
    io.to(`group:${groupId}`).emit(REALTIME_EVENTS.BALANCE_UPDATED, data);
  });

  // ─── Membership Events ───────────────────────────────────────

  realtimeEmitter.on(REALTIME_EVENTS.MEMBER_JOINED, (payload) => {
    const { groupId, ...data } = payload;
    io.to(`group:${groupId}`).emit(REALTIME_EVENTS.MEMBER_JOINED, data);
  });

  realtimeEmitter.on(REALTIME_EVENTS.MEMBER_LEFT, (payload) => {
    const { groupId, ...data } = payload;
    io.to(`group:${groupId}`).emit(REALTIME_EVENTS.MEMBER_LEFT, data);
  });

  // ─── Group Events ────────────────────────────────────────────

  realtimeEmitter.on(REALTIME_EVENTS.GROUP_UPDATED, (payload) => {
    const { groupId, ...data } = payload;
    io.to(`group:${groupId}`).emit(REALTIME_EVENTS.GROUP_UPDATED, data);
  });

  realtimeEmitter.on(REALTIME_EVENTS.GROUP_ARCHIVED, (payload) => {
    const { groupId, ...data } = payload;
    io.to(`group:${groupId}`).emit(REALTIME_EVENTS.GROUP_ARCHIVED, data);
  });

  // ─── Notification Events ─────────────────────────────────────

  realtimeEmitter.on(REALTIME_EVENTS.NOTIFICATION_CREATED, (payload) => {
    const { targetUserId, ...data } = payload;
    // Notifications target a specific user, not a group room
    // User rooms are named `user:{userId}`
    if (targetUserId) {
      io.to(`user:${targetUserId}`).emit(REALTIME_EVENTS.NOTIFICATION_CREATED, data);
    }
  });

  console.log('🔌 Realtime event bridge registered (internal → Socket.IO)');
}

module.exports = {
  realtimeEmitter,
  REALTIME_EVENTS,
  emitRealtimeEvent,
  registerSocketBridge,
};
