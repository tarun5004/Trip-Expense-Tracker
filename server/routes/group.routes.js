/**
 * @fileoverview Group routes — CRUD and membership endpoints.
 * @module routes/group.routes
 */

const { Router } = require('express');
const groupController = require('../controllers/group.controller');
const authenticate = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validate');
const {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  groupIdParamSchema,
  memberParamsSchema,
} = require('../validation/group.validation');

const router = Router();

// All group routes require authentication
router.use(authenticate);

/**
 * @route POST /api/v1/groups
 * @description Create a new group
 */
router.post('/', validate(createGroupSchema), groupController.createGroup);

/**
 * @route GET /api/v1/groups
 * @description List all groups for the authenticated user
 */
router.get('/', groupController.getUserGroups);

/**
 * @route GET /api/v1/groups/:id
 * @description Get group details with members
 */
router.get('/:id', validateParams(groupIdParamSchema), groupController.getGroupById);

/**
 * @route PATCH /api/v1/groups/:id
 * @description Update group details (admin only)
 */
router.patch('/:id', validateParams(groupIdParamSchema), validate(updateGroupSchema), groupController.updateGroup);

/**
 * @route DELETE /api/v1/groups/:id
 * @description Archive a group (admin only)
 */
router.delete('/:id', validateParams(groupIdParamSchema), groupController.deleteGroup);

/**
 * @route POST /api/v1/groups/:id/members
 * @description Add a member to a group (admin only)
 */
router.post('/:id/members', validateParams(groupIdParamSchema), validate(addMemberSchema), groupController.addMember);

/**
 * @route DELETE /api/v1/groups/:id/members/:userId
 * @description Remove a member from a group (admin or self)
 */
router.delete('/:id/members/:userId', validateParams(memberParamsSchema), groupController.removeMember);

module.exports = router;
