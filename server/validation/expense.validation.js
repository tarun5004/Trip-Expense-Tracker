/**
 * @fileoverview Zod validation schemas for expense endpoints.
 * @module validation/expense.validation
 */

const { z } = require('zod');
const { SPLIT_TYPES, EXPENSE_CATEGORIES } = require('../config/constants');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @description Individual split entry for exact split type */
const exactSplitEntry = z.object({
  userId: z.string().regex(uuidRegex, 'Invalid user ID'),
  amountCents: z.number().int('Amount must be an integer').min(0, 'Amount cannot be negative'),
});

/** @description Individual split entry for percentage split type */
const percentageSplitEntry = z.object({
  userId: z.string().regex(uuidRegex, 'Invalid user ID'),
  percentage: z.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100'),
});

/** @description Individual split entry for shares split type */
const sharesSplitEntry = z.object({
  userId: z.string().regex(uuidRegex, 'Invalid user ID'),
  shares: z.number().int('Shares must be an integer').min(0, 'Shares cannot be negative'),
});

/**
 * @description Schema for POST /api/v1/expenses
 */
const createExpenseSchema = z.object({
  groupId: z
    .string({ required_error: 'Group ID is required' })
    .regex(uuidRegex, 'Invalid group ID format'),
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .trim()
    .optional()
    .nullable(),
  totalAmountCents: z
    .number({ required_error: 'Total amount is required' })
    .int('Amount must be an integer (cents)')
    .positive('Amount must be positive'),
  currency: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters')
    .toUpperCase()
    .default('INR'),
  splitType: z
    .enum([SPLIT_TYPES.EQUAL, SPLIT_TYPES.EXACT, SPLIT_TYPES.PERCENTAGE, SPLIT_TYPES.SHARES], {
      errorMap: () => ({ message: `Split type must be one of: ${Object.values(SPLIT_TYPES).join(', ')}` }),
    })
    .default(SPLIT_TYPES.EQUAL),
  category: z
    .string()
    .max(50, 'Category must be at most 50 characters')
    .default('general')
    .optional(),
  expenseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  paidByUserId: z
    .string()
    .regex(uuidRegex, 'Invalid payer user ID')
    .optional(),
  splits: z
    .array(
      z.union([exactSplitEntry, percentageSplitEntry, sharesSplitEntry])
    )
    .min(2, 'At least 2 participants required (BR-03)')
    .optional(),
  participantIds: z
    .array(z.string().regex(uuidRegex, 'Invalid participant ID'))
    .min(2, 'At least 2 participants required (BR-03)')
    .optional(),
});

/**
 * @description Schema for PATCH /api/v1/expenses/:id
 */
const updateExpenseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be at most 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .trim()
    .optional()
    .nullable(),
  totalAmountCents: z
    .number()
    .int('Amount must be an integer (cents)')
    .positive('Amount must be positive')
    .optional(),
  currency: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters')
    .toUpperCase()
    .optional(),
  splitType: z
    .enum([SPLIT_TYPES.EQUAL, SPLIT_TYPES.EXACT, SPLIT_TYPES.PERCENTAGE, SPLIT_TYPES.SHARES])
    .optional(),
  category: z
    .string()
    .max(50)
    .optional(),
  expenseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  splits: z
    .array(z.union([exactSplitEntry, percentageSplitEntry, sharesSplitEntry]))
    .min(2, 'At least 2 participants required')
    .optional(),
  participantIds: z
    .array(z.string().regex(uuidRegex, 'Invalid participant ID'))
    .min(2, 'At least 2 participants required')
    .optional(),
});

/**
 * @description Schema for GET /api/v1/expenses?groupId= query params
 */
const getExpensesQuerySchema = z.object({
  groupId: z
    .string({ required_error: 'groupId query parameter is required' })
    .regex(uuidRegex, 'Invalid group ID format'),
  cursor: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(['created_at', 'expense_date', 'total_amount_cents']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  category: z.string().optional(),
});

/**
 * @description UUID param schema for :id
 */
const expenseIdParamSchema = z.object({
  id: z.string().regex(uuidRegex, 'Invalid expense ID format'),
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
  getExpensesQuerySchema,
  expenseIdParamSchema,
};
