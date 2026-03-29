/**
 * @fileoverview Auth controller — ONLY handles HTTP request/response.
 * Zero business logic. Each function calls exactly ONE service method.
 * @module controllers/auth.controller
 */

const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { COOKIE_NAMES } = require('../config/constants');

/**
 * @description Register a new user account.
 * @route POST /api/v1/auth/register
 * @access Public
 * @usedBy auth.routes.js
 * @param {import('express').Request} req - Express request (body: { email, password, name })
 * @param {import('express').Response} res - Express response
 * @returns {Promise<void>} 201 with user data
 */
const register = asyncHandler(async (req, res) => {
  const meta = {
    deviceInfo: req.headers['user-agent'] || null,
    ipAddress: req.ip,
  };
  const result = await authService.register(req.body, res, meta);
  return ApiResponse.created(res, result, 'Account created successfully');
});

/**
 * @description Authenticate a user and issue tokens.
 * @route POST /api/v1/auth/login
 * @access Public
 * @usedBy auth.routes.js
 * @param {import('express').Request} req - Express request (body: { email, password })
 * @param {import('express').Response} res - Express response
 * @returns {Promise<void>} 200 with user data
 */
const login = asyncHandler(async (req, res) => {
  const meta = {
    deviceInfo: req.headers['user-agent'] || null,
    ipAddress: req.ip,
  };
  const result = await authService.login(req.body, res, meta);
  return ApiResponse.success(res, result, 'Logged in successfully');
});

/**
 * @description Refresh the access token using the refresh token cookie.
 * @route POST /api/v1/auth/refresh
 * @access Public (uses refresh token cookie)
 * @usedBy auth.routes.js
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {Promise<void>} 200 with refreshed user data
 */
const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenRaw = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
  const meta = {
    deviceInfo: req.headers['user-agent'] || null,
    ipAddress: req.ip,
  };
  const result = await authService.refresh(refreshTokenRaw, res, meta);
  return ApiResponse.success(res, result, 'Token refreshed successfully');
});

/**
 * @description Log out the current user by revoking the refresh token.
 * @route POST /api/v1/auth/logout
 * @access Private (requires authentication)
 * @usedBy auth.routes.js
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {Promise<void>} 200 success
 */
const logout = asyncHandler(async (req, res) => {
  const refreshTokenRaw = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
  await authService.logout(refreshTokenRaw, res);
  return ApiResponse.success(res, null, 'Logged out successfully');
});

module.exports = { register, login, refreshToken, logout };
