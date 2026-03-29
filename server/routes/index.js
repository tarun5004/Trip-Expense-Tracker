/**
 * @fileoverview Route index — mounts all route modules under /api/v1.
 * @module routes/index
 */

const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const groupRoutes = require('./group.routes');
const expenseRoutes = require('./expense.routes');
const paymentRoutes = require('./payment.routes');
const balanceRoutes = require('./balance.routes');
const activityRoutes = require('./activity.routes');
const notificationRoutes = require('./notification.routes');

const router = Router();

/**
 * @description Mount all API route modules.
 * Each module handles its own authentication and validation middleware.
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/expenses', expenseRoutes);
router.use('/payments', paymentRoutes);
router.use('/balances', balanceRoutes);
router.use('/activity', activityRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
