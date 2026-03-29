/**
 * @fileoverview Wraps async Express route handlers to catch rejected promises
 * and forward them to the Express error handler via next().
 * @module utils/asyncHandler
 */

/**
 * @description Wrap an async route handler function so any thrown/rejected error
 * is automatically passed to Express's next() error middleware.
 * @param {Function} fn - Async Express route handler (req, res, next) => Promise
 * @returns {Function} Wrapped handler that catches errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
