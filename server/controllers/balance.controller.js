/**
 * @fileoverview Balance controller — ONLY handles HTTP request/response.
 * @module controllers/balance.controller
 */

const balanceService = require('../services/balance.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * @description Get raw pairwise balances for a group.
 * @route GET /api/v1/balances?groupId=
 * @access Private (group members only)
 * @usedBy balance.routes.js
 */
const getGroupBalances = asyncHandler(async (req, res) => {
  const { groupId } = req.query;
  if (!groupId) {
    throw ApiError.badRequest('groupId query parameter is required');
  }
  const result = await balanceService.getGroupBalances(req.user.id, groupId);
  return ApiResponse.success(res, result, 'Balances retrieved successfully');
});

/**
 * @description Get simplified (min-transactions) balances for a group.
 * @route GET /api/v1/balances/simplified?groupId=
 * @access Private (group members only)
 * @usedBy balance.routes.js
 */
const getSimplifiedBalances = asyncHandler(async (req, res) => {
  const { groupId } = req.query;
  if (!groupId) {
    throw ApiError.badRequest('groupId query parameter is required');
  }
  const result = await balanceService.getSimplifiedBalances(req.user.id, groupId);
  return ApiResponse.success(res, result, 'Simplified balances retrieved successfully');
});

module.exports = { getGroupBalances, getSimplifiedBalances };
