/**
 * @fileoverview Notification routes — user notification endpoints.
 * @module routes/notification.routes
 */

const { Router } = require('express');
const notificationController = require('../controllers/notification.controller');
const authenticate = require('../middleware/auth');

const router = Router();

router.use(authenticate);

/**
 * @route GET /api/v1/notifications
 * @description Get all notifications for the authenticated user
 */
router.get('/', notificationController.getNotifications);

/**
 * @route PATCH /api/v1/notifications/read-all
 * @description Mark all notifications as read (MUST be before /:id/read to avoid route collision)
 */
router.patch('/read-all', notificationController.markAllRead);

/**
 * @route PATCH /api/v1/notifications/:id/read
 * @description Mark a single notification as read
 */
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
