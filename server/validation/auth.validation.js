/**
 * @fileoverview Zod validation schemas for authentication endpoints.
 * @module validation/auth.validation
 */

const { z } = require('zod');

/**
 * @description Schema for POST /api/v1/auth/register
 * Validates email format, password strength, and name length.
 */
const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .max(255, 'Email must be at most 255 characters')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
});

/**
 * @description Schema for POST /api/v1/auth/login
 * Validates email and password presence.
 */
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

module.exports = { registerSchema, loginSchema };
