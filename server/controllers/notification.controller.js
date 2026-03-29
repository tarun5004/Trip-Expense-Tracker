/**
 * @fileoverview Notification controller — ONLY handles HTTP request/response.
 * @module controllers/notification.controller
 */

const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @description Get all notifications for the authenticated user.
 * @route GET /api/v1/notifications
 * @access Private
 * @usedBy notification.routes.js
 */
const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user.id);
  return ApiResponse.success(res, result, 'Notifications retrieved successfully');
});

/**
 * @description Mark a single notification as read.
 * @route PATCH /api/v1/notifications/:id/read
 * @access Private
 * @usedBy notification.routes.js
 */
const markRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markRead(req.user.id, req.params.id);
  return ApiResponse.success(res, result, 'Notification marked as read');
});

/**
 * @description Mark all notifications as read.
 * @route PATCH /api/v1/notifications/read-all
 * @access Private
 * @usedBy notification.routes.js
 */
const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user.id);
  return ApiResponse.success(res, result, 'All notifications marked as read');
});

module.exports = { getNotifications, markRead, markAllRead };
