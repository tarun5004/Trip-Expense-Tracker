/**
 * @fileoverview Activity controller — ONLY handles HTTP request/response.
 * @module controllers/activity.controller
 */

const activityService = require('../services/activity.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @description Get paginated activity log for a group.
 * @route GET /api/v1/activity?groupId=&limit=&cursor=
 * @access Private (group members only)
 * @usedBy activity.routes.js
 */
const getGroupActivity = asyncHandler(async (req, res) => {
  const { groupId } = req.query;
  if (!groupId) {
    const ApiError = require('../utils/ApiError');
    throw ApiError.badRequest('groupId query parameter is required');
  }
  const { data, pagination } = await activityService.getGroupActivity(req.user.id, groupId, req.query);
  return ApiResponse.paginated(res, data, pagination, 'Activity log retrieved successfully');
});

module.exports = { getGroupActivity };
