/**
 * @fileoverview User routes — profile and search endpoints.
 * @module routes/user.routes
 */

const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const { updateProfileSchema, searchQuerySchema } = require('../validation/user.validation');

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/users/me
 * @description Get current user profile
 * @access Private
 */
router.get('/me', userController.getProfile);

/**
 * @route PATCH /api/v1/users/me
 * @description Update current user profile
 * @access Private
 */
router.patch('/me', validate(updateProfileSchema), userController.updateProfile);

/**
 * @route GET /api/v1/users/search?q=
 * @description Search users by name or email
 * @access Private
 */
router.get('/search', validateQuery(searchQuerySchema), userController.searchUsers);

module.exports = router;
