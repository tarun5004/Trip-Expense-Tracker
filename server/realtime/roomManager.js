/**
 * @fileoverview Group room lifecycle management for Socket.IO.
 * Each group has exactly one room: `group:{groupId}`.
 * Each user also has a personal room: `user:{userId}` for targeted notifications.
 *
 * @module realtime/roomManager
 * @connectsTo socketServer.js, eventHandlers.js
 *
 * Room naming convention:
 *   group:{uuid}  — all connected members of a group
 *   user:{uuid}   — personal notification channel for a single user
 */

const groupModel = require('../models/group.model');

/**
 * @function joinGroupRoom
 * @description Verify group membership from DB, then join the socket to the group room.
 * Also joins the user's personal notification room if not already joined.
 * @param {import('socket.io').Socket} socket - Socket instance (must have socket.data.user)
 * @param {string} groupId - Group UUID to join
 * @returns {Promise<{ success: boolean, room: string, memberCount?: number, error?: string }>}
 */
async function joinGroupRoom(socket, groupId) {
  const userId = socket.data.user.id;

  try {
    // Verify membership from DB — NEVER trust the client
    const isMember = await groupModel.isMember(groupId, userId);
    if (!isMember) {
      return { success: false, error: 'NOT_A_MEMBER' };
    }

    const roomName = `group:${groupId}`;
    socket.join(roomName);

    // Also ensure user's personal room is joined
    socket.join(`user:${userId}`);

    // Get live member count in this room
    const io = socket.server;
    const sockets = await io.in(roomName).fetchSockets();
    const memberCount = sockets.length;

    console.log(`📡 [Room] ${userId} joined ${roomName} (${memberCount} online)`);

    return { success: true, room: roomName, memberCount };
  } catch (error) {
    console.error(`❌ [Room] Failed to join room for group ${groupId}:`, error.message);
    return { success: false, error: 'INTERNAL_ERROR' };
  }
}

/**
 * @function leaveGroupRoom
 * @description Remove the socket from a group room. Does NOT affect other rooms.
 * @param {import('socket.io').Socket} socket - Socket instance
 * @param {string} groupId - Group UUID to leave
 * @returns {Promise<{ success: boolean, room: string }>}
 */
async function leaveGroupRoom(socket, groupId) {
  const userId = socket.data.user.id;
  const roomName = `group:${groupId}`;

  socket.leave(roomName);
  console.log(`📡 [Room] ${userId} left ${roomName}`);

  return { success: true, room: roomName };
}

/**
 * @function broadcastToGroup
 * @description Emit an event to all connected sockets in a group room.
 * This is the low-level broadcast function — prefer emitRealtimeEvent() for service-layer usage.
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {string} groupId - Group UUID
 * @param {string} event - Event name to emit
 * @param {object} payload - Event payload
 * @returns {void}
 */
function broadcastToGroup(io, groupId, event, payload) {
  io.to(`group:${groupId}`).emit(event, payload);
}

/**
 * @function getUserActiveGroups
 * @description Query the database for all group IDs that a user belongs to.
 * Used during connection to auto-join the user into all their group rooms.
 * @param {string} userId - User UUID
 * @returns {Promise<string[]>} Array of group UUIDs
 */
async function getUserActiveGroups(userId) {
  try {
    const groups = await groupModel.findGroupsByUserId(userId);
    return groups.map((g) => g.id);
  } catch (error) {
    console.error(`❌ [Room] Failed to get groups for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * @function getRoomMemberCount
 * @description Get the number of connected sockets currently in a group room.
 * Useful for showing "X members online" in the UI.
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {string} groupId - Group UUID
 * @returns {Promise<number>} Number of connected sockets in the room
 */
async function getRoomMemberCount(io, groupId) {
  try {
    const sockets = await io.in(`group:${groupId}`).fetchSockets();
    return sockets.length;
  } catch (error) {
    console.error(`❌ [Room] Failed to count members for group ${groupId}:`, error.message);
    return 0;
  }
}

/**
 * @function joinAllUserRooms
 * @description Auto-join a socket into all group rooms for the authenticated user.
 * Called once after successful authentication during the connection handshake.
 * Also joins the user's personal notification room.
 * @param {import('socket.io').Socket} socket - Authenticated socket
 * @returns {Promise<string[]>} Array of room names joined
 */
async function joinAllUserRooms(socket) {
  const userId = socket.data.user.id;
  const joinedRooms = [];

  // Join personal notification room
  socket.join(`user:${userId}`);
  joinedRooms.push(`user:${userId}`);

  // Join all group rooms
  const groupIds = await getUserActiveGroups(userId);
  for (const groupId of groupIds) {
    const roomName = `group:${groupId}`;
    socket.join(roomName);
    joinedRooms.push(roomName);
  }

  console.log(`📡 [Room] ${userId} auto-joined ${joinedRooms.length} rooms: [${joinedRooms.join(', ')}]`);
  return joinedRooms;
}

/**
 * @function handleDisconnect
 * @description Cleanup when a socket disconnects. Socket.IO automatically removes
 * the socket from all rooms, so we only need to log and handle any custom cleanup.
 * @param {import('socket.io').Socket} socket - Disconnecting socket
 * @param {string} reason - Disconnect reason provided by Socket.IO
 * @returns {void}
 */
function handleDisconnect(socket, reason) {
  const user = socket.data.user;
  if (user) {
    console.log(`📡 [Room] ${user.id} disconnected (reason: ${reason})`);
  }
  // Socket.IO automatically leaves all rooms on disconnect — no manual cleanup needed
}

module.exports = {
  joinGroupRoom,
  leaveGroupRoom,
  broadcastToGroup,
  getUserActiveGroups,
  getRoomMemberCount,
  joinAllUserRooms,
  handleDisconnect,
};
