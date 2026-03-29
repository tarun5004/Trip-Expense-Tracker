/**
 * @fileoverview Custom API error class for consistent error handling.
 * Extends native Error with statusCode, code, errors[], and isOperational flag.
 * Provides static factory methods for common HTTP error types.
 * @module utils/ApiError
 */

const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

class ApiError extends Error {
  /**
   * @description Create a new API error instance.
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {string} [code='INTERNAL_ERROR'] - Application error code from ERROR_CODES
   * @param {Array<{field?: string, message: string}>} [errors=[]] - Field-level error details
   * @param {boolean} [isOperational=true] - true = expected error, false = programming bug
   */
  constructor(statusCode, message, code = ERROR_CODES.INTERNAL_ERROR, errors = [], isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * @description Create a 400 Bad Request error (validation failures).
   * @param {string} [message='Bad request'] - Error message
   * @param {Array} [errors=[]] - Field-level validation errors
   * @returns {ApiError} A 400 ApiError instance
   */
  static badRequest(message = 'Bad request', errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, ERROR_CODES.VALIDATION_ERROR, errors);
  }

  /**
   * @description Create a 401 Unauthorized error (authentication failures).
   * @param {string} [message='Authentication required'] - Error message
   * @returns {ApiError} A 401 ApiError instance
   */
  static unauthorized(message = 'Authentication required') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, ERROR_CODES.UNAUTHORIZED);
  }

  /**
   * @description Create a 403 Forbidden error (authorization failures).
   * @param {string} [message='Access denied'] - Error message
   * @returns {ApiError} A 403 ApiError instance
   */
  static forbidden(message = 'Access denied') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, ERROR_CODES.FORBIDDEN);
  }

  /**
   * @description Create a 404 Not Found error.
   * @param {string} [message='Resource not found'] - Error message
   * @returns {ApiError} A 404 ApiError instance
   */
  static notFound(message = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, ERROR_CODES.NOT_FOUND);
  }

  /**
   * @description Create a 409 Conflict error (duplicate resources).
   * @param {string} [message='Resource already exists'] - Error message
   * @returns {ApiError} A 409 ApiError instance
   */
  static conflict(message = 'Resource already exists') {
    return new ApiError(HTTP_STATUS.CONFLICT, message, ERROR_CODES.CONFLICT);
  }

  /**
   * @description Create a 422 Unprocessable Entity error (business rule violations).
   * @param {string} [message='Unprocessable entity'] - Error message
   * @param {Array} [errors=[]] - Detail errors
   * @returns {ApiError} A 422 ApiError instance
   */
  static unprocessable(message = 'Unprocessable entity', errors = []) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE, message, ERROR_CODES.BUSINESS_RULE_VIOLATION, errors);
  }

  /**
   * @description Create a 500 Internal Server Error (unexpected failures).
   * @param {string} [message='Internal server error'] - Error message
   * @returns {ApiError} A 500 ApiError instance (isOperational=false)
   */
  static internal(message = 'Internal server error') {
    return new ApiError(HTTP_STATUS.INTERNAL_ERROR, message, ERROR_CODES.INTERNAL_ERROR, [], false);
  }

  /**
   * @description Create a 429 Rate Limit Exceeded error.
   * @param {string} [message='Too many requests, please try again later'] - Error message
   * @returns {ApiError} A 429 ApiError instance
   */
  static rateLimited(message = 'Too many requests, please try again later') {
    return new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}

module.exports = ApiError;
