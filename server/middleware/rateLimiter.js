/**
 * @fileoverview Rate limiting middleware using express-rate-limit.
 * Provides a factory function and pre-configured limiters for different endpoint categories.
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { ERROR_CODES, HTTP_STATUS } = require('../config/constants');

/**
 * @description Factory function to create a rate limiter with custom options.
 * @param {{ windowMs?: number, max?: number, message?: string }} options - Rate limit config
 * @returns {import('express-rate-limit').RateLimitRequestHandler} Express middleware
 */
function createRateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: options.max || env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        error: {
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: options.message || 'Too many requests, please try again later',
        },
        requestId: req.requestId || 'unknown',
        timestamp: new Date().toISOString(),
      });
    },
  });
}

/** @description Rate limiter for login endpoint: 5 attempts per 15 minutes per IP */
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: env.RATE_LIMIT_LOGIN_MAX,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

/** @description Rate limiter for registration: 3 attempts per hour per IP */
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many registration attempts. Please try again in 1 hour.',
});

/** @description General rate limiter for authenticated API: 100 req/min per IP */
const generalLimiter = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
});

/** @description Rate limiter for expense creation: 30 req/min per IP */
const expenseLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many expense requests. Please slow down.',
});

/** @description Rate limiter for settlement creation: 10 req/min per IP */
const settlementLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many settlement requests. Please slow down.',
});

module.exports = {
  createRateLimiter,
  loginLimiter,
  registerLimiter,
  generalLimiter,
  expenseLimiter,
  settlementLimiter,
};
