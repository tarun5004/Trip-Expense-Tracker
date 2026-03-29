/**
 * @fileoverview JWT token creation and verification utilities.
 * Access tokens: 15 min, Refresh tokens: 7 days, both via httpOnly cookies.
 * @module utils/token
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { COOKIE_NAMES } = require('../config/constants');

/**
 * @description Generate a short-lived JWT access token.
 * @param {{ id: string, email: string, name: string }} payload - User data to encode
 * @returns {string} Signed JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(
    { id: payload.id, email: payload.email, name: payload.name },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );
}

/**
 * @description Generate a long-lived JWT refresh token.
 * @param {{ id: string }} payload - User data to encode (minimal for refresh)
 * @returns {string} Signed JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(
    { id: payload.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY }
  );
}

/**
 * @description Verify and decode a JWT access token.
 * @param {string} token - The JWT access token string
 * @returns {{ id: string, email: string, name: string, iat: number, exp: number }} Decoded payload
 * @throws {jwt.JsonWebTokenError} When token is invalid
 * @throws {jwt.TokenExpiredError} When token has expired
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

/**
 * @description Verify and decode a JWT refresh token.
 * @param {string} token - The JWT refresh token string
 * @returns {{ id: string, iat: number, exp: number }} Decoded payload
 * @throws {jwt.JsonWebTokenError} When token is invalid
 * @throws {jwt.TokenExpiredError} When token has expired
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

/**
 * @description Cookie configuration for access token (httpOnly, secure, SameSite).
 * @returns {import('express').CookieOptions} Cookie options
 */
function getAccessCookieOptions() {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes in ms
    path: '/',
  };
}

/**
 * @description Cookie configuration for refresh token (httpOnly, secure, SameSite).
 * @returns {import('express').CookieOptions} Cookie options
 */
function getRefreshCookieOptions() {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  };
}

/**
 * @description Set both access and refresh token cookies on the response.
 * @param {import('express').Response} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, getAccessCookieOptions());
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, getRefreshCookieOptions());
}

/**
 * @description Clear both access and refresh token cookies from the response.
 * @param {import('express').Response} res - Express response object
 */
function clearTokenCookies(res) {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, { path: '/' });
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { path: '/' });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getAccessCookieOptions,
  getRefreshCookieOptions,
  setTokenCookies,
  clearTokenCookies,
};
