/**
 * @fileoverview Group service — ALL group business logic.
 * Handles CRUD, membership management, and authorization checks.
 * @module services/group.service
 */

const groupModel = require('../models/group.model');
const userModel = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { MAX_GROUP_MEMBERS } = require('../config/constants');

/**
 * @description Create a new expense group.
 * Auto-adds the creator as admin (handled in model transaction).
 * @usedBy group.controller.js → createGroup
 * @param {string} userId - Creator's UUID
 * @param {{ name: string, description?: string, currency?: string }} data
 * @returns {Promise<object>} Created group
 */
async function createGroup(userId, data) {
  const group = await groupModel.createGroup({
    name: data.name,
    description: data.description || null,
    currency: data.currency || 'INR',
    createdBy: userId,
  });

  const members = await groupModel.findMembersByGroupId(group.id);
  return { ...group, members };
}

/**
 * @description Get all groups the authenticated user belongs to.
 * @usedBy group.controller.js → getUserGroups
 * @param {string} userId - Authenticated user's UUID
 * @returns {Promise<Array>} User's groups with member counts
 */
async function getUserGroups(userId) {
  return groupModel.findGroupsByUserId(userId);
}

/**
 * @description Get group details including member list.
 * Verifies the requesting user is a member.
 * @usedBy group.controller.js → getGroupById
 * @param {string} groupId - Group UUID
 * @param {string} userId - Requesting user's UUID
 * @returns {Promise<object>} Group with members array
 * @throws {ApiError} 404 if group not found, 403 if not a member
 */
async function getGroupById(groupId, userId) {
  const group = await groupModel.findGroupById(groupId);
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  const memberCheck = await groupModel.isMember(groupId, userId);
  if (!memberCheck) {
    throw ApiError.forbidden('You are not a member of this group');
  }

  const members = await groupModel.findMembersByGroupId(groupId);
  return { ...group, members };
}

/**
 * @description Update group details (admin only).
 * @usedBy group.controller.js → updateGroup
 * @param {string} groupId - Group UUID
 * @param {string} userId - Requesting user's UUID
 * @param {{ name?: string, description?: string }} data - Fields to update
 * @returns {Promise<object>} Updated group
 * @throws {ApiError} 404 if group not found, 403 if not an admin
 */
async function updateGroup(groupId, userId, data) {
  const group = await groupModel.findGroupById(groupId);
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  const adminCheck = await groupModel.isAdmin(groupId, userId);
  if (!adminCheck) {
    throw ApiError.forbidden('Only group admins can update group details');
  }

  const fields = {};
  if (data.name !== undefined) fields.name = data.name;
  if (data.description !== undefined) fields.description = data.description;

  return groupModel.updateGroup(groupId, fields);
}

/**
 * @description Archive (soft-delete) a group (admin only).
 * @usedBy group.controller.js → deleteGroup
 * @param {string} groupId - Group UUID
 * @param {string} userId - Requesting user's UUID
 * @returns {Promise<void>}
 * @throws {ApiError} 404 if group not found, 403 if not an admin
 */
async function deleteGroup(groupId, userId) {
  const group = await groupModel.findGroupById(groupId);
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  const adminCheck = await groupModel.isAdmin(groupId, userId);
  if (!adminCheck) {
    throw ApiError.forbidden('Only group admins can archive a group');
  }

  await groupModel.softDeleteGroup(groupId);
}

/**
 * @description Add a member to a group (admin only).
 * Enforces BR-07: Max 50 members per group.
 * @usedBy group.controller.js → addMember
 * @param {string} groupId - Group UUID
 * @param {string} adminId - Requesting admin's UUID
 * @param {string} targetUserId - User to add
 * @returns {Promise<object>} Created membership
 * @throws {ApiError} 404 if group/user not found, 403 if not admin, 409 if already member, 422 if member limit reached
 */
async function addMember(groupId, adminId, targetUserId) {
  const group = await groupModel.findGroupById(groupId);
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  const adminCheck = await groupModel.isAdmin(groupId, adminId);
  if (!adminCheck) {
    throw ApiError.forbidden('Only group admins can add members');
  }

  // Verify target user exists
  const targetUser = await userModel.findById(targetUserId);
  if (!targetUser) {
    throw ApiError.notFound('User not found');
  }

  // Check if already a member
  const alreadyMember = await groupModel.isMember(groupId, targetUserId);
  if (alreadyMember) {
    throw ApiError.conflict('User is already a member of this group');
  }

  // BR-07: Check member limit
  const memberCount = await groupModel.getMemberCount(groupId);
  if (memberCount >= MAX_GROUP_MEMBERS) {
    throw ApiError.unprocessable(
      `Group has reached the maximum of ${MAX_GROUP_MEMBERS} members`,
      [{ field: 'members', message: `Maximum ${MAX_GROUP_MEMBERS} members allowed per group (BR-07)` }]
    );
  }

  return groupModel.addMember({ groupId, userId: targetUserId });
}

/**
 * @description Remove a member from a group or leave a group.
 * Admins can remove others; any member can leave (remove themselves).
 * BR-06: Cannot remove if user has outstanding balance.
 * @usedBy group.controller.js → removeMember
 * @param {string} groupId - Group UUID
 * @param {string} requesterId - Requesting user's UUID
 * @param {string} targetUserId - User to remove
 * @returns {Promise<void>}
 * @throws {ApiError} 404 if group not found, 403 if not permitted
 */
async function removeMember(groupId, requesterId, targetUserId) {
  const group = await groupModel.findGroupById(groupId);
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  const isSelf = requesterId === targetUserId;

  if (!isSelf) {
    // Only admins can remove other members
    const adminCheck = await groupModel.isAdmin(groupId, requesterId);
    if (!adminCheck) {
      throw ApiError.forbidden('Only group admins can remove other members');
    }
  }

  // Verify target is actually a member
  const targetIsMember = await groupModel.isMember(groupId, targetUserId);
  if (!targetIsMember) {
    throw ApiError.notFound('User is not a member of this group');
  }

  // BR-06: Check for outstanding balances (import balance model lazily to avoid circular deps)
  const balanceModel = require('../models/balance.model');
  const balances = await balanceModel.getGroupBalances(groupId);
  const hasOutstanding = balances.some(
    (b) =>
      (b.debtor_id === targetUserId || b.creditor_id === targetUserId) &&
      parseInt(b.net_balance_cents, 10) !== 0
  );

  if (hasOutstanding) {
    throw ApiError.unprocessable(
      'Cannot remove member with outstanding balance. Please settle all debts first.',
      [{ field: 'balance', message: 'Outstanding balance exists (BR-06)' }]
    );
  }

  await groupModel.removeMember(groupId, targetUserId);
}

module.exports = {
  createGroup,
  getUserGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
};
