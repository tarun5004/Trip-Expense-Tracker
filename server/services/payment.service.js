/**
 * @fileoverview Payment service — ALL settlement business logic.
 * Enforces BR-05 (amount ≤ outstanding balance).
 * @module services/payment.service
 */

const paymentModel = require('../models/payment.model');
const balanceModel = require('../models/balance.model');
const groupModel = require('../models/group.model');
const activityService = require('./activity.service');
const notificationService = require('./notification.service');
const balanceService = require('./balance.service');
const ApiError = require('../utils/ApiError');
const { ACTION_TYPES, ENTITY_TYPES, NOTIFICATION_TYPES } = require('../config/constants');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { emitRealtimeEvent, REALTIME_EVENTS } = require('../realtime/eventEmitter');

/**
 * @description Record a new payment (settlement) between two group members.
 * Enforces BR-05: payment amount cannot exceed the outstanding balance.
 * @usedBy payment.controller.js → createPayment
 * @param {string} userId - Authenticated user (payer/debtor)
 * @param {{ groupId: string, paidToUserId: string, amountCents: number, currency?: string, paymentMethod?: string, note?: string }} data
 * @returns {Promise<object>} Created payment
 * @throws {ApiError} 403 if not a member, 422 if amount exceeds balance or paying self
 */
async function createPayment(userId, data) {
  const { groupId, paidToUserId, amountCents, currency, paymentMethod, note } = data;

  // Cannot pay yourself
  if (userId === paidToUserId) {
    throw ApiError.unprocessable('Cannot make a payment to yourself');
  }

  // Verify both users are group members
  const payerIsMember = await groupModel.isMember(groupId, userId);
  if (!payerIsMember) {
    throw ApiError.forbidden('You are not a member of this group');
  }

  const payeeIsMember = await groupModel.isMember(groupId, paidToUserId);
  if (!payeeIsMember) {
    throw ApiError.unprocessable('Recipient is not a member of this group');
  }

  // BR-05: Check that amount does not exceed outstanding balance
  const outstandingBalance = await balanceModel.getUserPairBalance(groupId, userId, paidToUserId);
  if (outstandingBalance <= 0) {
    throw ApiError.unprocessable(
      'You do not owe anything to this user in this group',
      [{ field: 'amountCents', message: 'No outstanding balance exists' }]
    );
  }

  if (amountCents > outstandingBalance) {
    throw ApiError.unprocessable(
      `Payment amount (${amountCents}) exceeds outstanding balance (${outstandingBalance}) (BR-05)`,
      [{ field: 'amountCents', message: `Maximum allowed: ${outstandingBalance} cents` }]
    );
  }

  // Create the payment
  const payment = await paymentModel.createPayment({
    groupId,
    paidByUserId: userId,
    paidToUserId,
    amountCents,
    currency: currency || 'INR',
    paymentMethod: paymentMethod || 'cash',
    note: note || null,
  });

  // Invalidate balance cache
  await balanceService.invalidateBalanceCache(groupId);

  // Log activity
  await activityService.logActivity(userId, groupId, ACTION_TYPES.PAYMENT_CREATED, ENTITY_TYPES.PAYMENT, payment.id, {
    amountCents,
    paidToUserId,
    paymentMethod: paymentMethod || 'cash',
  });

  // Notify the recipient
  await notificationService.createNotification(
    paidToUserId,
    NOTIFICATION_TYPES.PAYMENT_CONFIRMATION_REQUEST,
    'Payment received',
    `A payment of ${amountCents} cents has been recorded. Please confirm.`,
    { entityType: ENTITY_TYPES.PAYMENT, entityId: payment.id }
  );

  // Emit realtime events for live UI updates
  emitRealtimeEvent(REALTIME_EVENTS.PAYMENT_RECORDED, {
    groupId,
    paymentId: payment.id,
    paidByUserId: userId,
    paidToUserId,
    amountCents,
    actorUserId: userId,
  });

  emitRealtimeEvent(REALTIME_EVENTS.BALANCE_UPDATED, {
    groupId,
    reason: 'payment_recorded',
    paymentId: payment.id,
  });

  return payment;
}

/**
 * @description Get paginated payments for a group.
 * @usedBy payment.controller.js → getPayments
 * @param {string} userId - Requesting user's UUID
 * @param {object} queryParams - { groupId, limit, cursor }
 * @returns {Promise<{ data: Array, pagination: object }>}
 * @throws {ApiError} 403 if not a group member
 */
async function getPayments(userId, queryParams) {
  const { groupId } = queryParams;

  const isMember = await groupModel.isMember(groupId, userId);
  if (!isMember) {
    throw ApiError.forbidden('You are not a member of this group');
  }

  const { limit, cursor } = parsePaginationParams(queryParams);
  const results = await paymentModel.findPaymentsByGroupId(groupId, { limit, cursor });
  const pagination = buildPaginationMeta(results, limit, cursor);
  const data = results.slice(0, limit);

  return { data, pagination };
}

/**
 * @description Delete a pending payment (only by the creator, only if pending).
 * @usedBy payment.controller.js → deletePayment
 * @param {string} userId - Requesting user's UUID
 * @param {string} paymentId - Payment UUID
 * @returns {Promise<void>}
 * @throws {ApiError} 404 if not found, 403 if not creator, 422 if not pending
 */
async function deletePayment(userId, paymentId) {
  const payment = await paymentModel.findPaymentById(paymentId);
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  // Only the payer (creator) can delete
  if (payment.paid_by_user_id !== userId) {
    throw ApiError.forbidden('Only the payment creator can delete this payment');
  }

  // Only pending payments can be deleted
  if (payment.status !== 'pending') {
    throw ApiError.unprocessable(
      `Cannot delete a ${payment.status} payment. Only pending payments can be deleted.`
    );
  }

  await paymentModel.softDeletePayment(paymentId);

  // Invalidate balance cache
  await balanceService.invalidateBalanceCache(payment.group_id);

  // Log activity
  await activityService.logActivity(userId, payment.group_id, ACTION_TYPES.PAYMENT_CREATED, ENTITY_TYPES.PAYMENT, paymentId, {
    action: 'deleted',
    amountCents: payment.amount_cents,
  });

  // Emit realtime events for live UI updates
  emitRealtimeEvent(REALTIME_EVENTS.PAYMENT_DELETED, {
    groupId: payment.group_id,
    paymentId,
    actorUserId: userId,
  });

  emitRealtimeEvent(REALTIME_EVENTS.BALANCE_UPDATED, {
    groupId: payment.group_id,
    reason: 'payment_deleted',
    paymentId,
  });
}

module.exports = { createPayment, getPayments, deletePayment };
