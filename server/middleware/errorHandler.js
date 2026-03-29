/**
 * @fileoverview Centralized error handler middleware.
 * Catches all errors, formats them consistently, and never exposes stack traces in production.
 * @module middleware/errorHandler
 */

const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { ERROR_CODES, HTTP_STATUS } = require('../config/constants');

/**
 * @description Global Express error handler. Catches all errors and returns
 * a consistent JSON error envelope. Logs programming errors at ERROR level.
 * @param {Error} err - The error that was thrown or passed to next()
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle ApiError (operational, expected errors)
  if (err instanceof ApiError) {
    const response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.errors.length > 0 ? err.errors : undefined,
      },
      requestId: req.requestId || 'unknown',
      timestamp: new Date().toISOString(),
    };

    if (env.NODE_ENV === 'development') {
      response.error.stack = err.stack;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle Zod validation errors (from validate middleware)
  if (err.name === 'ZodError') {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
      requestId: req.requestId || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  // Handle JSON parse errors (malformed request body)
  if (err.type === 'entity.parse.failed') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid JSON in request body',
      },
      requestId: req.requestId || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  // Handle PostgreSQL unique constraint violations
  if (err.code === '23505') {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      error: {
        code: ERROR_CODES.CONFLICT,
        message: 'A resource with that value already exists',
      },
      requestId: req.requestId || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  // Unknown / programming errors — log fully, respond generically
  console.error('❌ Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    requestId: req.requestId,
  });

  const response = {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
    requestId: req.requestId || 'unknown',
    timestamp: new Date().toISOString(),
  };

  if (env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  return res.status(HTTP_STATUS.INTERNAL_ERROR).json(response);
}

module.exports = errorHandler;
