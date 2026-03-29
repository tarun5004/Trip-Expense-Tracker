/**
 * @fileoverview Group controller — ONLY handles HTTP request/response.
 * @module controllers/group.controller
 */

const groupService = require('../services/group.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @description Create a new group.
 * @route POST /api/v1/groups
 * @access Private
 * @usedBy group.routes.js
 */
const createGroup = asyncHandler(async (req, res) => {
  const result = await groupService.createGroup(req.user.id, req.body);
  return ApiResponse.created(res, result, 'Group created successfully');
});

/**
 * @description Get all groups for the authenticated user.
 * @route GET /api/v1/groups
 * @access Private
 * @usedBy group.routes.js
 */
const getUserGroups = asyncHandler(async (req, res) => {
  const result = await groupService.getUserGroups(req.user.id);
  return ApiResponse.success(res, result, 'Groups retrieved successfully');
});

/**
 * @description Get a single group by ID with member list.
 * @route GET /api/v1/groups/:id
 * @access Private (group members only)
 * @usedBy group.routes.js
 */
const getGroupById = asyncHandler(async (req, res) => {
  const result = await groupService.getGroupById(req.params.id, req.user.id);
  return ApiResponse.success(res, result, 'Group retrieved successfully');
});

/**
 * @description Update group details.
 * @route PATCH /api/v1/groups/:id
 * @access Private (admin only)
 * @usedBy group.routes.js
 */
const updateGroup = asyncHandler(async (req, res) => {
  const result = await groupService.updateGroup(req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, result, 'Group updated successfully');
});

/**
 * @description Archive (soft-delete) a group.
 * @route DELETE /api/v1/groups/:id
 * @access Private (admin only)
 * @usedBy group.routes.js
 */
const deleteGroup = asyncHandler(async (req, res) => {
  await groupService.deleteGroup(req.params.id, req.user.id);
  return ApiResponse.success(res, null, 'Group archived successfully');
});

/**
 * @description Add a member to a group.
 * @route POST /api/v1/groups/:id/members
 * @access Private (admin only)
 * @usedBy group.routes.js
 */
const addMember = asyncHandler(async (req, res) => {
  const result = await groupService.addMember(req.params.id, req.user.id, req.body.userId);
  return ApiResponse.created(res, result, 'Member added successfully');
});

/**
 * @description Remove a member from a group or leave the group.
 * @route DELETE /api/v1/groups/:id/members/:userId
 * @access Private (admin or self)
 * @usedBy group.routes.js
 */
const removeMember = asyncHandler(async (req, res) => {
  await groupService.removeMember(req.params.id, req.user.id, req.params.userId);
  return ApiResponse.success(res, null, 'Member removed successfully');
});

module.exports = {
  createGroup,
  getUserGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
};
