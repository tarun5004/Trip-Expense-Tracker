/**
 * @fileoverview Activity routes — audit trail endpoints.
 * @module routes/activity.routes
 */

const { Router } = require('express');
const activityController = require('../controllers/activity.controller');
const authenticate = require('../middleware/auth');

const router = Router();

router.use(authenticate);

/**
 * @route GET /api/v1/activity?groupId=&limit=&cursor=
 * @description Get paginated activity log for a group
 */
router.get('/', activityController.getGroupActivity);

module.exports = router;
