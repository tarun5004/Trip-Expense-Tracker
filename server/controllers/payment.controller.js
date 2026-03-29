/**
 * @fileoverview Payment controller — ONLY handles HTTP request/response.
 * @module controllers/payment.controller
 */

const paymentService = require('../services/payment.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @description Record a new payment (settlement).
 * @route POST /api/v1/payments
 * @access Private
 * @usedBy payment.routes.js
 */
const createPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.createPayment(req.user.id, req.body);
  return ApiResponse.created(res, result, 'Payment recorded successfully');
});

/**
 * @description Get paginated payments for a group.
 * @route GET /api/v1/payments?groupId=
 * @access Private
 * @usedBy payment.routes.js
 */
const getPayments = asyncHandler(async (req, res) => {
  const { data, pagination } = await paymentService.getPayments(req.user.id, req.query);
  return ApiResponse.paginated(res, data, pagination, 'Payments retrieved successfully');
});

/**
 * @description Delete a pending payment.
 * @route DELETE /api/v1/payments/:id
 * @access Private (creator only, pending only)
 * @usedBy payment.routes.js
 */
const deletePayment = asyncHandler(async (req, res) => {
  await paymentService.deletePayment(req.user.id, req.params.id);
  return ApiResponse.success(res, null, 'Payment deleted successfully');
});

module.exports = { createPayment, getPayments, deletePayment };
