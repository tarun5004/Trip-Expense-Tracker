/**
 * @fileoverview Zod validation schemas for user endpoints.
 * @module validation/user.validation
 */

const { z } = require('zod');

/**
 * @description Schema for PATCH /api/v1/users/me
 * All fields optional — partial update.
 */
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be at most 100 characters')
    .trim()
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  currencyPreference: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters (ISO 4217)')
    .toUpperCase()
    .optional(),
  timezone: z
    .string()
    .min(1, 'Timezone cannot be empty')
    .max(50, 'Timezone must be at most 50 characters')
    .optional(),
  avatarUrl: z
    .string()
    .url('Invalid avatar URL format')
    .max(500, 'Avatar URL must be at most 500 characters')
    .optional()
    .nullable(),
});

/**
 * @description Schema for GET /api/v1/users/search?q=
 * Validates search query parameter.
 */
const searchQuerySchema = z.object({
  q: z
    .string({ required_error: 'Search query is required' })
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be at most 100 characters')
    .trim(),
});

module.exports = { updateProfileSchema, searchQuerySchema };
