/**
 * @fileoverview Auth routes — maps HTTP endpoints to controller functions.
 * @module routes/auth.routes
 */

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validation/auth.validation');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const authenticate = require('../middleware/auth');

const router = Router();

/**
 * @route POST /api/v1/auth/register
 * @description Register a new user account
 * @access Public (rate-limited)
 */
router.post('/register', registerLimiter, validate(registerSchema), authController.register);

/**
 * @route POST /api/v1/auth/login
 * @description Authenticate user with email and password
 * @access Public (rate-limited)
 */
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

/**
 * @route POST /api/v1/auth/refresh
 * @description Refresh access token using refresh token cookie
 * @access Public (uses refresh cookie)
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route POST /api/v1/auth/logout
 * @description Log out user and revoke refresh token
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
