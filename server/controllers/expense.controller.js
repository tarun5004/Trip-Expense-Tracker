/**
 * @fileoverview Expense controller — ONLY handles HTTP request/response.
 * @module controllers/expense.controller
 */

const expenseService = require('../services/expense.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @description Create a new expense.
 * @route POST /api/v1/expenses
 * @access Private (group members only)
 * @usedBy expense.routes.js
 */
const createExpense = asyncHandler(async (req, res) => {
  const result = await expenseService.createExpense(req.user.id, req.body);
  return ApiResponse.created(res, result, 'Expense created successfully');
});

/**
 * @description Get paginated expenses for a group.
 * @route GET /api/v1/expenses?groupId=
 * @access Private (group members only)
 * @usedBy expense.routes.js
 */
const getExpenses = asyncHandler(async (req, res) => {
  const { data, pagination } = await expenseService.getExpenses(req.user.id, req.query);
  return ApiResponse.paginated(res, data, pagination, 'Expenses retrieved successfully');
});

/**
 * @description Get a single expense by ID.
 * @route GET /api/v1/expenses/:id
 * @access Private (group members only)
 * @usedBy expense.routes.js
 */
const getExpenseById = asyncHandler(async (req, res) => {
  const result = await expenseService.getExpenseById(req.user.id, req.params.id);
  return ApiResponse.success(res, result, 'Expense retrieved successfully');
});

/**
 * @description Update an expense.
 * @route PATCH /api/v1/expenses/:id
 * @access Private (creator or admin, within 48h window)
 * @usedBy expense.routes.js
 */
const updateExpense = asyncHandler(async (req, res) => {
  const result = await expenseService.updateExpense(req.user.id, req.params.id, req.body);
  return ApiResponse.success(res, result, 'Expense updated successfully');
});

/**
 * @description Delete (soft) an expense.
 * @route DELETE /api/v1/expenses/:id
 * @access Private (creator or admin, within 48h window)
 * @usedBy expense.routes.js
 */
const deleteExpense = asyncHandler(async (req, res) => {
  await expenseService.deleteExpense(req.user.id, req.params.id);
  return ApiResponse.success(res, null, 'Expense deleted successfully');
});

module.exports = { createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense };
