/**
 * @fileoverview Group model — ONLY raw SQL queries for group and membership operations.
 * @module models/group.model
 */

const { query, getClient } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * @description Create a new group and add the creator as admin in a single transaction.
 * @usedBy group.service.js → createGroup
 * @param {{ name: string, description: string|null, currency: string, createdBy: string }} data
 * @returns {Promise<object>} Created group row
 */
async function createGroup({ name, description, currency, createdBy }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const groupId = uuidv4();
    const groupResult = await client.query(
      `INSERT INTO groups (id, name, description, currency, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, currency, created_by, created_at, updated_at`,
      [groupId, name, description, currency, createdBy]
    );

    // Auto-add creator as admin
    const memberId = uuidv4();
    await client.query(
      `INSERT INTO group_members (id, group_id, user_id, role, joined_at)
       VALUES ($1, $2, $3, 'admin', NOW())`,
      [memberId, groupId, createdBy]
    );

    await client.query('COMMIT');
    return groupResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * @description Find a group by its UUID (non-deleted only).
 * @usedBy group.service.js → getGroupById
 * @param {string} groupId - Group UUID
 * @returns {Promise<object|null>} Group row or null
 */
async function findGroupById(groupId) {
  const result = await query(
    `SELECT id, name, description, currency, created_by, created_at, updated_at
     FROM groups
     WHERE id = $1 AND deleted_at IS NULL`,
    [groupId]
  );
  return result.rows[0] || null;
}

/**
 * @description Find all groups that a user is an active member of.
 * @usedBy group.service.js → getUserGroups
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of group rows with member count
 */
async function findGroupsByUserId(userId) {
  const result = await query(
    `SELECT g.id, g.name, g.description, g.currency, g.created_by,
            g.created_at, g.updated_at,
            gm.role AS user_role,
            (SELECT COUNT(*) FROM group_members
             WHERE group_id = g.id AND left_at IS NULL)::int AS member_count
     FROM groups g
     INNER JOIN group_members gm ON gm.group_id = g.id
     WHERE gm.user_id = $1
       AND gm.left_at IS NULL
       AND g.deleted_at IS NULL
     ORDER BY g.updated_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * @description Update group fields (name, description).
 * @usedBy group.service.js → updateGroup
 * @param {string} groupId - Group UUID
 * @param {object} fields - Key-value pairs to update
 * @returns {Promise<object|null>} Updated group row or null
 */
async function updateGroup(groupId, fields) {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return findGroupById(groupId);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 2}`);
  const values = entries.map(([, val]) => val);

  const result = await query(
    `UPDATE groups
     SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, name, description, currency, created_by, created_at, updated_at`,
    [groupId, ...values]
  );
  return result.rows[0] || null;
}

/**
 * @description Soft-delete (archive) a group.
 * @usedBy group.service.js → deleteGroup
 * @param {string} groupId - Group UUID
 * @returns {Promise<void>}
 */
async function softDeleteGroup(groupId) {
  await query(
    `UPDATE groups SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [groupId]
  );
}

/**
 * @description Add a user as a member of a group.
 * @usedBy group.service.js → addMember
 * @param {{ groupId: string, userId: string, role?: string }} data
 * @returns {Promise<object>} Created membership row
 */
async function addMember({ groupId, userId, role = 'member' }) {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO group_members (id, group_id, user_id, role, joined_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, group_id, user_id, role, joined_at`,
    [id, groupId, userId, role]
  );
  return result.rows[0];
}

/**
 * @description Remove a member from a group (set left_at timestamp).
 * @usedBy group.service.js → removeMember
 * @param {string} groupId - Group UUID
 * @param {string} userId - User UUID to remove
 * @returns {Promise<void>}
 */
async function removeMember(groupId, userId) {
  await query(
    `UPDATE group_members
     SET left_at = NOW(), updated_at = NOW()
     WHERE group_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [groupId, userId]
  );
}

/**
 * @description Get all active members of a group with user details.
 * @usedBy group.service.js → getGroupById
 * @param {string} groupId - Group UUID
 * @returns {Promise<Array>} Array of member objects with user info
 */
async function findMembersByGroupId(groupId) {
  const result = await query(
    `SELECT gm.id AS membership_id, gm.user_id, gm.role, gm.joined_at,
            u.name, u.email, u.avatar_url
     FROM group_members gm
     INNER JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1 AND gm.left_at IS NULL AND u.deleted_at IS NULL
     ORDER BY gm.joined_at ASC`,
    [groupId]
  );
  return result.rows;
}

/**
 * @description Check if a user is an active member of a group.
 * @usedBy group.service.js, expense.service.js, payment.service.js
 * @param {string} groupId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function isMember(groupId, userId) {
  const result = await query(
    `SELECT 1 FROM group_members
     WHERE group_id = $1 AND user_id = $2 AND left_at IS NULL
     LIMIT 1`,
    [groupId, userId]
  );
  return result.rows.length > 0;
}

/**
 * @description Check if a user is an admin of a group.
 * @usedBy group.service.js → updateGroup, deleteGroup, addMember, removeMember
 * @param {string} groupId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function isAdmin(groupId, userId) {
  const result = await query(
    `SELECT 1 FROM group_members
     WHERE group_id = $1 AND user_id = $2 AND role = 'admin' AND left_at IS NULL
     LIMIT 1`,
    [groupId, userId]
  );
  return result.rows.length > 0;
}

/**
 * @description Get the count of active members in a group.
 * @usedBy group.service.js → addMember (BR-07 check)
 * @param {string} groupId
 * @returns {Promise<number>}
 */
async function getMemberCount(groupId) {
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM group_members
     WHERE group_id = $1 AND left_at IS NULL`,
    [groupId]
  );
  return result.rows[0].count;
}

module.exports = {
  createGroup,
  findGroupById,
  findGroupsByUserId,
  updateGroup,
  softDeleteGroup,
  addMember,
  removeMember,
  findMembersByGroupId,
  isMember,
  isAdmin,
  getMemberCount,
};
