/**
 * @fileoverview JWT authentication middleware.
 * Extracts JWT from httpOnly cookie, verifies it, and attaches user to req.
 * @module middleware/auth
 */

const { verifyAccessToken } = require('../utils/token');
const ApiError = require('../utils/ApiError');
const { COOKIE_NAMES } = require('../config/constants');

/**
 * @description Express middleware that verifies the JWT access token from cookies.
 * Attaches the decoded user payload to req.user on success.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @throws {ApiError} 401 if no token is found or token is invalid/expired
 */
function authenticate(req, res, next) {
  const token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

  if (!token) {
    throw ApiError.unauthorized('Access token is missing. Please log in.');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token has expired. Please refresh your session.');
    }
    throw ApiError.unauthorized('Invalid access token.');
  }
}

module.exports = authenticate;
