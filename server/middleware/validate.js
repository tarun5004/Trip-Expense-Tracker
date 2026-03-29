/**
 * @fileoverview Request validation middleware using Zod schemas.
 * Provides middleware factories for body, query, and params validation.
 * @module middleware/validate
 */

const ApiError = require('../utils/ApiError');

/**
 * @description Create middleware that validates req.body against a Zod schema.
 * On success, replaces req.body with the parsed (clean) result.
 * On failure, throws a 400 ApiError with field-level details.
 * @param {import('zod').ZodSchema} schema - Zod validation schema
 * @returns {Function} Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw ApiError.badRequest('Validation failed', errors);
    }
    req.body = result.data;
    next();
  };
}

/**
 * @description Create middleware that validates req.query against a Zod schema.
 * On success, replaces req.query with the parsed result.
 * @param {import('zod').ZodSchema} schema - Zod validation schema for query params
 * @returns {Function} Express middleware
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw ApiError.badRequest('Query validation failed', errors);
    }
    req.query = result.data;
    next();
  };
}

/**
 * @description Create middleware that validates req.params against a Zod schema.
 * On success, replaces req.params with the parsed result.
 * @param {import('zod').ZodSchema} schema - Zod validation schema for URL params
 * @returns {Function} Express middleware
 */
function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw ApiError.badRequest('Parameter validation failed', errors);
    }
    req.params = result.data;
    next();
  };
}

module.exports = { validate, validateQuery, validateParams };
