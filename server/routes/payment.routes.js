/**
 * @fileoverview Payment routes — settlement endpoints.
 * @module routes/payment.routes
 */

const { Router } = require('express');
const paymentController = require('../controllers/payment.controller');
const authenticate = require('../middleware/auth');
const { validate, validateQuery, validateParams } = require('../middleware/validate');
const { createPaymentSchema, getPaymentsQuerySchema, paymentIdParamSchema } = require('../validation/payment.validation');
const { settlementLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.use(authenticate);

/**
 * @route GET /api/v1/payments?groupId=
 * @description List payments for a group
 */
router.get('/', validateQuery(getPaymentsQuerySchema), paymentController.getPayments);

/**
 * @route POST /api/v1/payments
 * @description Record a new settlement payment
 */
router.post('/', settlementLimiter, validate(createPaymentSchema), paymentController.createPayment);

/**
 * @route DELETE /api/v1/payments/:id
 * @description Delete a pending payment
 */
router.delete('/:id', validateParams(paymentIdParamSchema), paymentController.deletePayment);

module.exports = router;
