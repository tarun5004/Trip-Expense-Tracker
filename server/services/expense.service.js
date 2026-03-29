/**
 * @fileoverview Expense service — ALL expense business logic.
 * Enforces BR-01 through BR-04. Uses expenseEngine for split calculations.
 * @module services/expense.service
 */

const expenseModel = require('../models/expense.model');
const groupModel = require('../models/group.model');
const activityService = require('./activity.service');
const notificationService = require('./notification.service');
const balanceService = require('./balance.service');
const {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  validateSplitConsistency,
} = require('./expenseEngine');
const ApiError = require('../utils/ApiError');
const { SPLIT_TYPES, ACTION_TYPES, ENTITY_TYPES, NOTIFICATION_TYPES, EDIT_WINDOW_HOURS } = require('../config/constants');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * @description Create a new expense with computed splits.
 * Enforces: BR-01 (payer is member), BR-02 (splits sum = total), BR-03 (min 2 participants).
 * @usedBy expense.controller.js → createExpense
 * @param {string} userId - Authenticated user's UUID (creator)
 * @param {object} data - Validated expense data from request body
 * @returns {Promise<{ expense: object, splits: Array }>} Created expense with splits
 * @throws {ApiError} 403 if not a member, 422 if business rules violated
 */
async function createExpense(userId, data) {
  const { groupId, title, description, totalAmountCents, currency, splitType, category, expenseDate, paidByUserId, splits: rawSplits, participantIds } = data;

  // Verify creator is a group member
  const isMember = await groupModel.isMember(groupId, userId);
  if (!isMember) {
    throw ApiError.forbidden('You are not a member of this group');
  }

  // Determine payer (defaults to creator)
  const payerId = paidByUserId || userId;

  // BR-01: Payer must be a group member
  if (payerId !== userId) {
    const payerIsMember = await groupModel.isMember(groupId, payerId);
    if (!payerIsMember) {
      throw ApiError.unprocessable('Expense payer must be a group member (BR-01)', [
        { field: 'paidByUserId', message: 'Payer is not a member of this group' },
      ]);
    }
  }

  // Calculate splits based on split type
  let computedSplits;

  if (splitType === SPLIT_TYPES.EQUAL) {
    // For equal splits, use participantIds or all group members
    let participants = participantIds;
    if (!participants || participants.length === 0) {
      const members = await groupModel.findMembersByGroupId(groupId);
      participants = members.map((m) => m.user_id);
    }

    // BR-03: Minimum 2 participants
    if (participants.length < 2) {
      throw ApiError.unprocessable('Expense must have at least 2 participants (BR-03)', [
        { field: 'participantIds', message: 'At least 2 participants required' },
      ]);
    }

    // Validate all participants are group members
    for (const pid of participants) {
      const participantIsMember = await groupModel.isMember(groupId, pid);
      if (!participantIsMember) {
        throw ApiError.unprocessable(`Participant ${pid} is not a group member`, [
          { field: 'participantIds', message: `User ${pid} is not a member of this group` },
        ]);
      }
    }

    computedSplits = calculateEqualSplit(totalAmountCents, participants);

  } else if (splitType === SPLIT_TYPES.EXACT) {
    if (!rawSplits || rawSplits.length < 2) {
      throw ApiError.unprocessable('Exact split requires at least 2 split entries (BR-03)');
    }
    computedSplits = calculateExactSplit(totalAmountCents, rawSplits);

  } else if (splitType === SPLIT_TYPES.PERCENTAGE) {
    if (!rawSplits || rawSplits.length < 2) {
      throw ApiError.unprocessable('Percentage split requires at least 2 split entries (BR-03)');
    }
    computedSplits = calculatePercentageSplit(totalAmountCents, rawSplits);

  } else if (splitType === SPLIT_TYPES.SHARES) {
    if (!rawSplits || rawSplits.length < 2) {
      throw ApiError.unprocessable('Shares split requires at least 2 split entries (BR-03)');
    }
    computedSplits = calculateSharesSplit(totalAmountCents, rawSplits);

  } else {
    throw ApiError.badRequest(`Invalid split type: ${splitType}`);
  }

  // BR-02: Validate split consistency (sum must equal total)
  const consistency = validateSplitConsistency(totalAmountCents, computedSplits);
  if (!consistency.valid) {
    throw ApiError.unprocessable(
      `Split amounts do not sum to the expense total (BR-02). Expected ${totalAmountCents}, got ${consistency.sum}. Difference: ${consistency.difference}`,
      [{ field: 'splits', message: `Split sum mismatch: expected ${totalAmountCents}, got ${consistency.sum}` }]
    );
  }

  // Save to database
  const result = await expenseModel.createExpense(
    {
      groupId,
      paidByUserId: payerId,
      title,
      description,
      totalAmountCents,
      currency: currency || 'INR',
      splitType,
      category,
      expenseDate,
      createdBy: userId,
    },
    computedSplits
  );

  // Invalidate balance cache
  await balanceService.invalidateBalanceCache(groupId);

  // Log activity
  await activityService.logActivity(userId, groupId, ACTION_TYPES.EXPENSE_CREATED, ENTITY_TYPES.EXPENSE, result.expense.id, {
    title,
    totalAmountCents,
    splitType,
    participantCount: computedSplits.length,
  });

  // Notify participants (exclude the creator)
  const participantsToNotify = computedSplits.filter((s) => s.userId !== userId).map((s) => s.userId);
  if (participantsToNotify.length > 0) {
    await notificationService.createBulkNotifications(
      participantsToNotify,
      NOTIFICATION_TYPES.EXPENSE_ADDED,
      `New expense in group`,
      `${title} — Total: ${totalAmountCents} cents`,
      { entityType: ENTITY_TYPES.EXPENSE, entityId: result.expense.id }
    );
  }

  return result;
}

/**
 * @description Get paginated expenses for a group.
 * @usedBy expense.controller.js → getExpenses
 * @param {string} userId - Requesting user's UUID
 * @param {object} queryParams - { groupId, limit, cursor, sortBy, sortOrder, category }
 * @returns {Promise<{ data: Array, pagination: object }>}
 * @throws {ApiError} 403 if not a group member
 */
async function getExpenses(userId, queryParams) {
  const { groupId, category } = queryParams;

  const isMember = await groupModel.isMember(groupId, userId);
  if (!isMember) {
    throw ApiError.forbidden('You are not a member of this group');
  }

  const { limit, cursor, sortBy, sortOrder } = parsePaginationParams(queryParams);
  const results = await expenseModel.findExpensesByGroupId(groupId, {
    limit,
    cursor,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    category,
  });

  const pagination = buildPaginationMeta(results, limit, cursor);
  const data = results.slice(0, limit);

  return { data, pagination };
}

/**
 * @description Get a single expense by ID with full split details.
 * @usedBy expense.controller.js → getExpenseById
 * @param {string} userId - Requesting user's UUID
 * @param {string} expenseId - Expense UUID
 * @returns {Promise<{ expense: object, splits: Array }>}
 * @throws {ApiError} 404 if not found, 403 if not a member
 */
async function getExpenseById(userId, expenseId) {
  const { expense, splits } = await expenseModel.findExpenseById(expenseId);
  if (!expense) {
    throw ApiError.notFound('Expense not found');
  }

  const isMember = await groupModel.isMember(expense.group_id, userId);
  if (!isMember) {
    throw ApiError.forbidden('You are not a member of this group');
  }

  return { expense, splits };
}

/**
 * @description Update an expense and optionally recalculate splits.
 * Enforces BR-04: 48h edit window + no existing settlements.
 * @usedBy expense.controller.js → updateExpense
 * @param {string} userId - Requesting user's UUID
 * @param {string} expenseId - Expense UUID
 * @param {object} data - Fields to update
 * @returns {Promise<{ expense: object, splits: Array }>}
 * @throws {ApiError} 404 if not found, 403 if not creator/admin, 422 if edit window expired or settlements exist
 */
async function updateExpense(userId, expenseId, data) {
  const { expense } = await expenseModel.findExpenseById(expenseId);
  if (!expense) {
    throw ApiError.notFound('Expense not found');
  }

  // Only creator can edit
  if (expense.created_by !== userId) {
    const isGroupAdmin = await groupModel.isAdmin(expense.group_id, userId);
    if (!isGroupAdmin) {
      throw ApiError.forbidden('Only the expense creator or group admin can edit this expense');
    }
  }

  // BR-04: Check 48h edit window
  const createdAt = new Date(expense.created_at);
  const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursElapsed > EDIT_WINDOW_HOURS) {
    throw ApiError.unprocessable(
      `Expenses can only be edited within ${EDIT_WINDOW_HOURS} hours of creation (BR-04)`,
      [{ field: 'created_at', message: `Edit window of ${EDIT_WINDOW_HOURS}h has expired` }]
    );
  }

  // BR-04: Check for related settlements
  const hasSettlements = await expenseModel.hasRelatedSettlements(expenseId, expense.group_id);
  if (hasSettlements) {
    throw ApiError.unprocessable(
      'Cannot edit expense with existing confirmed settlements (BR-04)',
      [{ field: 'settlements', message: 'Settlements exist for participants of this expense' }]
    );
  }

  // Build update fields (map camelCase to snake_case)
  const fields = {};
  if (data.title !== undefined) fields.title = data.title;
  if (data.description !== undefined) fields.description = data.description;
  if (data.totalAmountCents !== undefined) fields.total_amount_cents = data.totalAmountCents;
  if (data.currency !== undefined) fields.currency = data.currency;
  if (data.splitType !== undefined) fields.split_type = data.splitType;
  if (data.category !== undefined) fields.category = data.category;
  if (data.expenseDate !== undefined) fields.expense_date = data.expenseDate;

  // Recalculate splits if amount or split info changed
  let newSplits = null;
  const newTotal = data.totalAmountCents || expense.total_amount_cents;
  const newSplitType = data.splitType || expense.split_type;

  if (data.splits || data.participantIds || data.totalAmountCents || data.splitType) {
    if (newSplitType === SPLIT_TYPES.EQUAL) {
      let participants = data.participantIds;
      if (!participants) {
        const members = await groupModel.findMembersByGroupId(expense.group_id);
        participants = members.map((m) => m.user_id);
      }
      newSplits = calculateEqualSplit(newTotal, participants);
    } else if (newSplitType === SPLIT_TYPES.EXACT && data.splits) {
      newSplits = calculateExactSplit(newTotal, data.splits);
    } else if (newSplitType === SPLIT_TYPES.PERCENTAGE && data.splits) {
      newSplits = calculatePercentageSplit(newTotal, data.splits);
    } else if (newSplitType === SPLIT_TYPES.SHARES && data.splits) {
      newSplits = calculateSharesSplit(newTotal, data.splits);
    }

    if (newSplits) {
      const consistency = validateSplitConsistency(newTotal, newSplits);
      if (!consistency.valid) {
        throw ApiError.unprocessable(
          `Split amounts do not sum to the expense total (BR-02). Difference: ${consistency.difference}`
        );
      }
    }
  }

  const result = await expenseModel.updateExpense(expenseId, fields, newSplits);

  // Invalidate balance cache
  await balanceService.invalidateBalanceCache(expense.group_id);

  // Log activity
  await activityService.logActivity(userId, expense.group_id, ACTION_TYPES.EXPENSE_UPDATED, ENTITY_TYPES.EXPENSE, expenseId, {
    title: data.title || expense.title,
    updatedFields: Object.keys(fields),
  });

  return result;
}

/**
 * @description Soft-delete an expense.
 * Enforces BR-04: 48h edit window + no existing settlements.
 * @usedBy expense.controller.js → deleteExpense
 * @param {string} userId - Requesting user's UUID
 * @param {string} expenseId - Expense UUID
 * @returns {Promise<void>}
 * @throws {ApiError} 404 if not found, 403 if not creator/admin, 422 if rules violated
 */
async function deleteExpense(userId, expenseId) {
  const { expense } = await expenseModel.findExpenseById(expenseId);
  if (!expense) {
    throw ApiError.notFound('Expense not found');
  }

  // Only creator or admin can delete
  if (expense.created_by !== userId) {
    const isGroupAdmin = await groupModel.isAdmin(expense.group_id, userId);
    if (!isGroupAdmin) {
      throw ApiError.forbidden('Only the expense creator or group admin can delete this expense');
    }
  }

  // BR-04: Check 48h edit window
  const createdAt = new Date(expense.created_at);
  const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursElapsed > EDIT_WINDOW_HOURS) {
    throw ApiError.unprocessable(
      `Expenses can only be deleted within ${EDIT_WINDOW_HOURS} hours of creation (BR-04)`
    );
  }

  // BR-04: Check for related settlements
  const hasSettlements = await expenseModel.hasRelatedSettlements(expenseId, expense.group_id);
  if (hasSettlements) {
    throw ApiError.unprocessable(
      'Cannot delete expense with existing confirmed settlements (BR-04)'
    );
  }

  await expenseModel.softDeleteExpense(expenseId);

  // Invalidate balance cache
  await balanceService.invalidateBalanceCache(expense.group_id);

  // Log activity
  await activityService.logActivity(userId, expense.group_id, ACTION_TYPES.EXPENSE_DELETED, ENTITY_TYPES.EXPENSE, expenseId, {
    title: expense.title,
    totalAmountCents: expense.total_amount_cents,
  });
}

module.exports = { createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense };
