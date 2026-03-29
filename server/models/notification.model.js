/**
 * @fileoverview Notification model — ONLY raw SQL queries.
 * @module models/notification.model
 */

const { query } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * @description Create a new notification for a user.
 * @usedBy notification.service.js → createNotification
 * @param {{ userId: string, type: string, title: string, body: string, relatedEntityType?: string, relatedEntityId?: string }} data
 * @returns {Promise<object>} Created notification row
 */
async function createNotification({ userId, type, title, body, relatedEntityType, relatedEntityId }) {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO notifications (id, user_id, type, title, body, related_entity_type, related_entity_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id, type, title, body, related_entity_type, related_entity_id, is_read, created_at`,
    [id, userId, type, title, body, relatedEntityType || null, relatedEntityId || null]
  );
  return result.rows[0];
}

/**
 * @description Get notifications for a user, ordered by most recent first.
 * @usedBy notification.service.js → getUserNotifications
 * @param {string} userId - User UUID
 * @param {number} [limit=50] - Max notifications to return
 * @returns {Promise<Array>} Notification rows
 */
async function findByUserId(userId, limit = 50) {
  const result = await query(
    `SELECT id, user_id, type, title, body, related_entity_type, related_entity_id,
            is_read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

/**
 * @description Mark a single notification as read.
 * @usedBy notification.service.js → markRead
 * @param {string} notificationId - Notification UUID
 * @param {string} userId - Owner user UUID (for authorization)
 * @returns {Promise<object|null>} Updated notification or null if not found/not owned
 */
async function markAsRead(notificationId, userId) {
  const result = await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, type, title, body, is_read, created_at`,
    [notificationId, userId]
  );
  return result.rows[0] || null;
}

/**
 * @description Mark all notifications as read for a user.
 * @usedBy notification.service.js → markAllRead
 * @param {string} userId - User UUID
 * @returns {Promise<number>} Number of notifications marked as read
 */
async function markAllAsRead(userId) {
  const result = await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return result.rowCount;
}

module.exports = { createNotification, findByUserId, markAsRead, markAllAsRead };
