/**
 * @fileoverview User controller — ONLY handles HTTP request/response.
 * @module controllers/user.controller
 */

const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @description Get the authenticated user's profile.
 * @route GET /api/v1/users/me
 * @access Private
 * @usedBy user.routes.js
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getProfile = asyncHandler(async (req, res) => {
  const result = await userService.getProfile(req.user.id);
  return ApiResponse.success(res, result, 'Profile retrieved successfully');
});

/**
 * @description Update the authenticated user's profile.
 * @route PATCH /api/v1/users/me
 * @access Private
 * @usedBy user.routes.js
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateProfile = asyncHandler(async (req, res) => {
  const result = await userService.updateProfile(req.user.id, req.body);
  return ApiResponse.success(res, result, 'Profile updated successfully');
});

/**
 * @description Search for users by name or email.
 * @route GET /api/v1/users/search?q=
 * @access Private
 * @usedBy user.routes.js
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const searchUsers = asyncHandler(async (req, res) => {
  const result = await userService.searchUsers(req.query.q, req.user.id);
  return ApiResponse.success(res, result, 'Search results');
});

module.exports = { getProfile, updateProfile, searchUsers };
