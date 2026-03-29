/**
 * @fileoverview Zod validation schemas for payment/settlement endpoints.
 * @module validation/payment.validation
 */

const { z } = require('zod');
const { PAYMENT_METHODS } = require('../config/constants');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @description Schema for POST /api/v1/payments
 */
const createPaymentSchema = z.object({
  groupId: z
    .string({ required_error: 'Group ID is required' })
    .regex(uuidRegex, 'Invalid group ID format'),
  paidToUserId: z
    .string({ required_error: 'Recipient user ID is required' })
    .regex(uuidRegex, 'Invalid recipient user ID format'),
  amountCents: z
    .number({ required_error: 'Amount is required' })
    .int('Amount must be an integer (cents)')
    .positive('Amount must be positive'),
  currency: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters')
    .toUpperCase()
    .default('INR'),
  paymentMethod: z
    .enum([PAYMENT_METHODS.CASH, PAYMENT_METHODS.UPI, PAYMENT_METHODS.BANK_TRANSFER, PAYMENT_METHODS.OTHER])
    .default(PAYMENT_METHODS.CASH),
  note: z
    .string()
    .max(500, 'Note must be at most 500 characters')
    .trim()
    .optional()
    .nullable(),
});

/**
 * @description Schema for GET /api/v1/payments?groupId= query params
 */
const getPaymentsQuerySchema = z.object({
  groupId: z
    .string({ required_error: 'groupId query parameter is required' })
    .regex(uuidRegex, 'Invalid group ID format'),
  cursor: z.string().optional(),
  limit: z.string().optional(),
});

/**
 * @description UUID param schema for :id
 */
const paymentIdParamSchema = z.object({
  id: z.string().regex(uuidRegex, 'Invalid payment ID format'),
});

module.exports = {
  createPaymentSchema,
  getPaymentsQuerySchema,
  paymentIdParamSchema,
};
