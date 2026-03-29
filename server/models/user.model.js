/**
 * @fileoverview User model — ONLY raw SQL queries against pg pool.
 * Includes user CRUD and session management (for refresh token storage).
 * @module models/user.model
 */

const { query, getClient } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * @description Insert a new user into the users table.
 * @usedBy auth.service.js → register
 * @param {{ email: string, passwordHash: string, name: string }} data
 * @returns {Promise<{ id: string, email: string, name: string, currency_preference: string, timezone: string, created_at: Date }>}
 * @throws {Error} PostgreSQL unique constraint (23505) if email exists
 */
async function createUser({ email, passwordHash, name }) {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO users (id, email, password_hash, name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, avatar_url, phone, currency_preference, timezone, created_at`,
    [id, email, passwordHash, name]
  );
  return result.rows[0];
}

/**
 * @description Find a user by email address (non-deleted only).
 * @usedBy auth.service.js → login, register (duplicate check)
 * @param {string} email
 * @returns {Promise<object|null>} User row with password_hash, or null
 */
async function findByEmail(email) {
  const result = await query(
    `SELECT id, email, password_hash, name, avatar_url, phone,
            currency_preference, timezone, created_at, updated_at
     FROM users
     WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  );
  return result.rows[0] || null;
}

/**
 * @description Find a user by UUID (non-deleted only).
 * @usedBy auth.service.js, user.service.js, group.service.js
 * @param {string} id - User UUID
 * @returns {Promise<object|null>} User row (WITHOUT password_hash), or null
 */
async function findById(id) {
  const result = await query(
    `SELECT id, email, name, avatar_url, phone,
            currency_preference, timezone, created_at, updated_at
     FROM users
     WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * @description Update user profile fields dynamically.
 * Only specified fields are updated — others remain unchanged.
 * @usedBy user.service.js → updateProfile
 * @param {string} id - User UUID
 * @param {object} fields - Key-value pairs to update (column_name: value)
 * @returns {Promise<object>} Updated user row
 * @throws {Error} If user not found or update fails
 */
async function updateUser(id, fields) {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return findById(id);

  const setClauses = entries.map(([key, ], i) => `${key} = $${i + 2}`);
  const values = entries.map(([, val]) => val);

  const result = await query(
    `UPDATE users
     SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, email, name, avatar_url, phone, currency_preference, timezone, created_at, updated_at`,
    [id, ...values]
  );

  return result.rows[0] || null;
}

/**
 * @description Search users by name or email (ILIKE partial match).
 * Excludes the current user and deleted accounts.
 * @usedBy user.service.js → searchUsers
 * @param {string} searchQuery - Search text
 * @param {string} excludeUserId - Current user's ID to exclude from results
 * @param {number} [limit=20] - Max results
 * @returns {Promise<Array>} Matching user rows (id, email, name, avatar_url)
 */
async function searchUsers(searchQuery, excludeUserId, limit = 20) {
  const result = await query(
    `SELECT id, email, name, avatar_url
     FROM users
     WHERE (name ILIKE $1 OR email ILIKE $1)
       AND id != $2
       AND deleted_at IS NULL
     ORDER BY name ASC
     LIMIT $3`,
    [`%${searchQuery}%`, excludeUserId, limit]
  );
  return result.rows;
}

// ----- Session Management (Refresh Token Storage) -----

/**
 * @description Create a new session record with hashed refresh token.
 * @usedBy auth.service.js → login, register, refresh
 * @param {{ userId: string, refreshTokenHash: string, deviceInfo: string|null, ipAddress: string|null, expiresAt: Date }} data
 * @returns {Promise<object>} Created session row
 */
async function createSession({ userId, refreshTokenHash, deviceInfo, ipAddress, expiresAt }) {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO sessions (id, user_id, refresh_token_hash, device_info, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, created_at, expires_at`,
    [id, userId, refreshTokenHash, deviceInfo, ipAddress, expiresAt]
  );
  return result.rows[0];
}

/**
 * @description Find an active (non-revoked, non-expired) session by refresh token hash.
 * @usedBy auth.service.js → refresh
 * @param {string} tokenHash - SHA-256 hash of the refresh token
 * @returns {Promise<object|null>} Session row or null
 */
async function findSessionByTokenHash(tokenHash) {
  const result = await query(
    `SELECT id, user_id, refresh_token_hash, expires_at, revoked_at
     FROM sessions
     WHERE refresh_token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

/**
 * @description Revoke a specific session (mark as revoked).
 * @usedBy auth.service.js → logout, refresh (token rotation)
 * @param {string} sessionId - Session UUID
 * @returns {Promise<void>}
 */
async function revokeSession(sessionId) {
  await query(
    `UPDATE sessions SET revoked_at = NOW() WHERE id = $1`,
    [sessionId]
  );
}

/**
 * @description Revoke ALL sessions for a user (security: potential token theft).
 * @usedBy auth.service.js → refresh (when revoked token reuse detected)
 * @param {string} userId - User UUID
 * @returns {Promise<void>}
 */
async function revokeAllUserSessions(userId) {
  await query(
    `UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateUser,
  searchUsers,
  createSession,
  findSessionByTokenHash,
  revokeSession,
  revokeAllUserSessions,
};
