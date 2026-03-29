/**
 * @fileoverview Activity log model — append-only audit trail queries.
 * Activity log entries are NEVER updated or deleted.
 * @module models/activity.model
 */

const { query } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * @description Create an immutable activity log entry.
 * @usedBy activity.service.js → logActivity
 * @param {{ groupId: string, actorUserId: string, actionType: string, entityType: string, entityId: string, metadataJson?: object }} data
 * @returns {Promise<object>} Created activity log row
 */
async function createActivityLog({ groupId, actorUserId, actionType, entityType, entityId, metadataJson }) {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO activity_log (id, group_id, actor_user_id, action_type, entity_type, entity_id, metadata_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, group_id, actor_user_id, action_type, entity_type, entity_id, metadata_json, created_at`,
    [id, groupId, actorUserId, actionType, entityType, entityId, JSON.stringify(metadataJson || {})]
  );
  return result.rows[0];
}

/**
 * @description Get activity log entries for a group with cursor-based pagination.
 * Fetches limit+1 rows to determine if there are more results.
 * @usedBy activity.service.js → getGroupActivity
 * @param {string} groupId - Group UUID
 * @param {{ limit: number, cursor: string|null }} pagination
 * @returns {Promise<Array>} Activity log entries with actor details
 */
async function getActivitiesByGroupId(groupId, { limit, cursor }) {
  const params = [groupId, limit + 1];
  let cursorClause = '';

  if (cursor) {
    cursorClause = 'AND al.created_at < (SELECT created_at FROM activity_log WHERE id = $3)';
    params.push(cursor);
  }

  const result = await query(
    `SELECT al.id, al.group_id, al.actor_user_id, al.action_type,
            al.entity_type, al.entity_id, al.metadata_json, al.created_at,
            u.name AS actor_name, u.avatar_url AS actor_avatar
     FROM activity_log al
     INNER JOIN users u ON u.id = al.actor_user_id
     WHERE al.group_id = $1 ${cursorClause}
     ORDER BY al.created_at DESC
     LIMIT $2`,
    params
  );

  return result.rows;
}

module.exports = { createActivityLog, getActivitiesByGroupId };
