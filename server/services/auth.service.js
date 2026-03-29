/**
 * @fileoverview Authentication service — ALL auth business logic.
 * Handles registration, login, token refresh (with rotation), and logout.
 * @module services/auth.service
 */

const userModel = require('../models/user.model');
const { hashPassword, comparePassword, hashToken } = require('../utils/hash');
const { generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies } = require('../utils/token');
const ApiError = require('../utils/ApiError');

/**
 * @description Register a new user account.
 * Creates user, generates token pair, stores session, sets cookies.
 * @usedBy auth.controller.js → register
 * @param {{ email: string, password: string, name: string }} data - Registration payload
 * @param {import('express').Response} res - Express response (for setting cookies)
 * @param {{ deviceInfo: string|null, ipAddress: string|null }} meta - Request metadata
 * @returns {Promise<{ user: object }>} Created user (without password_hash)
 * @throws {ApiError} 409 if email already registered
 */
async function register(data, res, meta = {}) {
  // Check for existing user
  const existing = await userModel.findByEmail(data.email);
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Hash password and create user
  const passwordHash = await hashPassword(data.password);
  const user = await userModel.createUser({
    email: data.email,
    passwordHash,
    name: data.name,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token hash in sessions table
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await userModel.createSession({
    userId: user.id,
    refreshTokenHash,
    deviceInfo: meta.deviceInfo || null,
    ipAddress: meta.ipAddress || null,
    expiresAt,
  });

  // Set httpOnly cookies
  setTokenCookies(res, accessToken, refreshToken);

  return { user };
}

/**
 * @description Authenticate a user with email and password.
 * Verifies credentials, generates token pair, stores session, sets cookies.
 * @usedBy auth.controller.js → login
 * @param {{ email: string, password: string }} data - Login credentials
 * @param {import('express').Response} res - Express response (for setting cookies)
 * @param {{ deviceInfo: string|null, ipAddress: string|null }} meta - Request metadata
 * @returns {Promise<{ user: object }>} Authenticated user
 * @throws {ApiError} 401 if credentials are invalid
 */
async function login(data, res, meta = {}) {
  // Find user with password hash for comparison
  const user = await userModel.findByEmail(data.email);
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Verify password
  const isMatch = await comparePassword(data.password, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token hash in sessions table
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await userModel.createSession({
    userId: user.id,
    refreshTokenHash,
    deviceInfo: meta.deviceInfo || null,
    ipAddress: meta.ipAddress || null,
    expiresAt,
  });

  // Set httpOnly cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Return user without password_hash
  const { password_hash, ...safeUser } = user;
  return { user: safeUser };
}

/**
 * @description Refresh the access token using a valid refresh token.
 * Implements token rotation: old refresh token is revoked, new pair issued.
 * If a revoked token is reused, ALL user sessions are invalidated (theft detection).
 * @usedBy auth.controller.js → refresh
 * @param {string} refreshTokenRaw - Raw refresh token from cookie
 * @param {import('express').Response} res - Express response (for setting cookies)
 * @param {{ deviceInfo: string|null, ipAddress: string|null }} meta - Request metadata
 * @returns {Promise<{ user: object }>} User data for the refreshed session
 * @throws {ApiError} 401 if refresh token is invalid, expired, or revoked
 */
async function refresh(refreshTokenRaw, res, meta = {}) {
  const { verifyRefreshToken } = require('../utils/token');

  if (!refreshTokenRaw) {
    throw ApiError.unauthorized('Refresh token is missing');
  }

  // Verify JWT signature and expiry
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshTokenRaw);
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // Look up session by token hash
  const tokenHash = hashToken(refreshTokenRaw);
  const session = await userModel.findSessionByTokenHash(tokenHash);

  if (!session) {
    // Token hash not found — could be reuse of a revoked token (theft)
    // Revoke ALL sessions for this user as a security measure
    await userModel.revokeAllUserSessions(decoded.id);
    throw ApiError.unauthorized('Refresh token has been revoked. All sessions invalidated for security.');
  }

  // Revoke the old session (token rotation)
  await userModel.revokeSession(session.id);

  // Get fresh user data
  const user = await userModel.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('User account not found');
  }

  // Generate new token pair
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Store new refresh token hash
  const newTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await userModel.createSession({
    userId: user.id,
    refreshTokenHash: newTokenHash,
    deviceInfo: meta.deviceInfo || null,
    ipAddress: meta.ipAddress || null,
    expiresAt,
  });

  // Set new cookies
  setTokenCookies(res, newAccessToken, newRefreshToken);

  return { user };
}

/**
 * @description Log out the current user by revoking their refresh token session.
 * Clears both access and refresh token cookies.
 * @usedBy auth.controller.js → logout
 * @param {string} refreshTokenRaw - Raw refresh token from cookie
 * @param {import('express').Response} res - Express response (for clearing cookies)
 * @returns {Promise<void>}
 */
async function logout(refreshTokenRaw, res) {
  if (refreshTokenRaw) {
    const tokenHash = hashToken(refreshTokenRaw);
    const session = await userModel.findSessionByTokenHash(tokenHash);
    if (session) {
      await userModel.revokeSession(session.id);
    }
  }

  clearTokenCookies(res);
}

module.exports = { register, login, refresh, logout };
