/**
 * @fileoverview Expense routes — CRUD endpoints with validation.
 * @module routes/expense.routes
 */

const { Router } = require('express');
const expenseController = require('../controllers/expense.controller');
const authenticate = require('../middleware/auth');
const { validate, validateQuery, validateParams } = require('../middleware/validate');
const { createExpenseSchema, updateExpenseSchema, getExpensesQuerySchema, expenseIdParamSchema } = require('../validation/expense.validation');
const { expenseLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.use(authenticate);

/**
 * @route GET /api/v1/expenses?groupId=
 * @description List expenses for a group (paginated)
 */
router.get('/', validateQuery(getExpensesQuerySchema), expenseController.getExpenses);

/**
 * @route POST /api/v1/expenses
 * @description Create a new expense
 */
router.post('/', expenseLimiter, validate(createExpenseSchema), expenseController.createExpense);

/**
 * @route GET /api/v1/expenses/:id
 * @description Get a single expense with splits
 */
router.get('/:id', validateParams(expenseIdParamSchema), expenseController.getExpenseById);

/**
 * @route PATCH /api/v1/expenses/:id
 * @description Update an expense (within 48h, no settlements)
 */
router.patch('/:id', validateParams(expenseIdParamSchema), validate(updateExpenseSchema), expenseController.updateExpense);

/**
 * @route DELETE /api/v1/expenses/:id
 * @description Soft-delete an expense (within 48h, no settlements)
 */
router.delete('/:id', validateParams(expenseIdParamSchema), expenseController.deleteExpense);

module.exports = router;
