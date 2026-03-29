/**
 * @fileoverview Balance routes — balance viewing endpoints.
 * @module routes/balance.routes
 */

const { Router } = require('express');
const balanceController = require('../controllers/balance.controller');
const authenticate = require('../middleware/auth');

const router = Router();

router.use(authenticate);

/**
 * @route GET /api/v1/balances/simplified?groupId=
 * @description Get simplified (min-transactions) balances (MUST be before /:id to avoid collision)
 */
router.get('/simplified', balanceController.getSimplifiedBalances);

/**
 * @route GET /api/v1/balances?groupId=
 * @description Get raw pairwise balances for a group
 */
router.get('/', balanceController.getGroupBalances);

module.exports = router;
