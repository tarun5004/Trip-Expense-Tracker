/**
 * @fileoverview Notification service — notification creation and management.
 * @module services/notification.service
 */

const notificationModel = require('../models/notification.model');
const ApiError = require('../utils/ApiError');

/**
 * @description Create a notification for a user. Called internally by other services.
 * @usedBy expense.service.js, payment.service.js, group.service.js
 * @param {string} userId - Recipient user UUID
 * @param {string} type - Notification type constant (from NOTIFICATION_TYPES)
 * @param {string} title - Notification headline
 * @param {string} body - Notification body text
 * @param {{ entityType?: string, entityId?: string }} [relatedEntity={}] - Deep-link context
 * @returns {Promise<object>} Created notification
 */
async function createNotification(userId, type, title, body, relatedEntity = {}) {
  return notificationModel.createNotification({
    userId,
    type,
    title,
    body,
    relatedEntityType: relatedEntity.entityType || null,
    relatedEntityId: relatedEntity.entityId || null,
  });
}

/**
 * @description Create notifications for multiple users at once.
 * @usedBy expense.service.js → createExpense (notify all participants)
 * @param {string[]} userIds - Array of recipient user UUIDs
 * @param {string} type - Notification type
 * @param {string} title - Notification headline
 * @param {string} body - Notification body
 * @param {{ entityType?: string, entityId?: string }} [relatedEntity={}]
 * @returns {Promise<Array>} Created notifications
 */
async function createBulkNotifications(userIds, type, title, body, relatedEntity = {}) {
  const results = [];
  for (const userId of userIds) {
    const notification = await createNotification(userId, type, title, body, relatedEntity);
    results.push(notification);
  }
  return results;
}

/**
 * @description Get all notifications for the authenticated user.
 * @usedBy notification.controller.js → getNotifications
 * @param {string} userId - Authenticated user's UUID
 * @returns {Promise<Array>} User's notifications
 */
async function getUserNotifications(userId) {
  return notificationModel.findByUserId(userId);
}

/**
 * @description Mark a specific notification as read.
 * @usedBy notification.controller.js → markRead
 * @param {string} userId - Authenticated user's UUID
 * @param {string} notificationId - Notification UUID
 * @returns {Promise<object>} Updated notification
 * @throws {ApiError} 404 if notification not found or not owned by the user
 */
async function markRead(userId, notificationId) {
  const updated = await notificationModel.markAsRead(notificationId, userId);
  if (!updated) {
    throw ApiError.notFound('Notification not found');
  }
  return updated;
}

/**
 * @description Mark all notifications as read for the authenticated user.
 * @usedBy notification.controller.js → markAllRead
 * @param {string} userId - Authenticated user's UUID
 * @returns {Promise<{ markedCount: number }>} Number of notifications marked
 */
async function markAllRead(userId) {
  const count = await notificationModel.markAllAsRead(userId);
  return { markedCount: count };
}

module.exports = {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markRead,
  markAllRead,
};
