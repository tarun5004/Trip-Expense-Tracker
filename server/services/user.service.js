/**
 * @fileoverview User service — profile management and search business logic.
 * @module services/user.service
 */

const userModel = require('../models/user.model');
const ApiError = require('../utils/ApiError');

/**
 * @description Get the authenticated user's profile.
 * @usedBy user.controller.js → getProfile
 * @param {string} userId - Authenticated user's UUID
 * @returns {Promise<object>} User profile (without password_hash)
 * @throws {ApiError} 404 if user not found
 */
async function getProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

/**
 * @description Update the authenticated user's profile.
 * Maps camelCase request fields to snake_case DB columns.
 * @usedBy user.controller.js → updateProfile
 * @param {string} userId - Authenticated user's UUID
 * @param {{ name?: string, phone?: string, currencyPreference?: string, timezone?: string, avatarUrl?: string }} data
 * @returns {Promise<object>} Updated user profile
 * @throws {ApiError} 404 if user not found
 */
async function updateProfile(userId, data) {
  // Map camelCase to snake_case for DB columns
  const fields = {};
  if (data.name !== undefined) fields.name = data.name;
  if (data.phone !== undefined) fields.phone = data.phone;
  if (data.currencyPreference !== undefined) fields.currency_preference = data.currencyPreference;
  if (data.timezone !== undefined) fields.timezone = data.timezone;
  if (data.avatarUrl !== undefined) fields.avatar_url = data.avatarUrl;

  const updated = await userModel.updateUser(userId, fields);
  if (!updated) {
    throw ApiError.notFound('User not found');
  }
  return updated;
}

/**
 * @description Search users by name or email for adding to groups.
 * Excludes the current user from results.
 * @usedBy user.controller.js → searchUsers
 * @param {string} searchQuery - Search text (min 2 chars, validated upstream)
 * @param {string} currentUserId - Current user to exclude
 * @returns {Promise<Array>} Matching users (id, email, name, avatar_url)
 */
async function searchUsers(searchQuery, currentUserId) {
  return userModel.searchUsers(searchQuery, currentUserId);
}

module.exports = { getProfile, updateProfile, searchUsers };
