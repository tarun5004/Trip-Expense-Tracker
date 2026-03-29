/**
 * @fileoverview Zod validation schemas for group endpoints.
 * @module validation/group.validation
 */

const { z } = require('zod');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @description Schema for POST /api/v1/groups
 */
const createGroupSchema = z.object({
  name: z
    .string({ required_error: 'Group name is required' })
    .min(1, 'Group name cannot be empty')
    .max(100, 'Group name must be at most 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional()
    .nullable(),
  currency: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters (ISO 4217)')
    .toUpperCase()
    .default('INR'),
});

/**
 * @description Schema for PATCH /api/v1/groups/:id
 */
const updateGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name cannot be empty')
    .max(100, 'Group name must be at most 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional()
    .nullable(),
});

/**
 * @description Schema for POST /api/v1/groups/:id/members (invite)
 */
const addMemberSchema = z.object({
  userId: z
    .string({ required_error: 'User ID is required' })
    .regex(uuidRegex, 'Invalid user ID format'),
});

/**
 * @description Shared UUID param schema for :id route params
 */
const groupIdParamSchema = z.object({
  id: z.string().regex(uuidRegex, 'Invalid group ID format'),
});

/**
 * @description Schema for :id and :userId route params (remove member)
 */
const memberParamsSchema = z.object({
  id: z.string().regex(uuidRegex, 'Invalid group ID format'),
  userId: z.string().regex(uuidRegex, 'Invalid user ID format'),
});

module.exports = {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  groupIdParamSchema,
  memberParamsSchema,
};
