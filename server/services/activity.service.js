/**
 * @fileoverview Activity service — audit logging and retrieval business logic.
 * @module services/activity.service
 */

const activityModel = require('../models/activity.model');
const groupModel = require('../models/group.model');
const ApiError = require('../utils/ApiError');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * @description Log an activity event to the audit trail.
 * Called internally by other services after mutations.
 * @usedBy expense.service.js, payment.service.js, group.service.js
 * @param {string} actorId - User who performed the action
 * @param {string} groupId - Group context
 * @param {string} actionType - Action type constant (from ACTION_TYPES)
 * @param {string} entityType - Entity type constant (from ENTITY_TYPES)
 * @param {string} entityId - UUID of the affected entity
 * @param {object} [metadata={}] - Snapshot data for auditing
 * @returns {Promise<object>} Created activity log entry
 */
async function logActivity(actorId, groupId, actionType, entityType, entityId, metadata = {}) {
  return activityModel.createActivityLog({
    groupId,
    actorUserId: actorId,
    actionType,
    entityType,
    entityId,
    metadataJson: metadata,
  });
}

/**
 * @description Get paginated activity log for a group.
 * Verifies the requesting user is a group member.
 * @usedBy activity.controller.js → getGroupActivity
 * @param {string} userId - Requesting user's UUID
 * @param {string} groupId - Group UUID
 * @param {object} queryParams - Raw query params { limit, cursor }
 * @returns {Promise<{ data: Array, pagination: object }>} Activity entries with pagination meta
 * @throws {ApiError} 403 if not a group member
 */
async function getGroupActivity(userId, groupId, queryParams) {
  const memberCheck = await groupModel.isMember(groupId, userId);
  if (!memberCheck) {
    throw ApiError.forbidden('You are not a member of this group');
  }

  const { limit, cursor } = parsePaginationParams(queryParams);
  const results = await activityModel.getActivitiesByGroupId(groupId, { limit, cursor });
  const pagination = buildPaginationMeta(results, limit, cursor);
  const data = results.slice(0, limit);

  return { data, pagination };
}

module.exports = { logActivity, getGroupActivity };
