/**
 * @fileoverview Expense model — raw SQL queries for expense and expense_splits CRUD.
 * Expense + splits creation is done in a single PostgreSQL transaction.
 * @module models/expense.model
 */

const { query, getClient } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * @description Create an expense and its splits in a single database transaction.
 * @usedBy expense.service.js → createExpense
 * @param {{ groupId: string, paidByUserId: string, title: string, description: string|null, totalAmountCents: number, currency: string, splitType: string, category: string|null, expenseDate: string|null, createdBy: string }} expenseData
 * @param {Array<{ userId: string, amountCents: number, percentage?: number, shares?: number }>} splits
 * @returns {Promise<{ expense: object, splits: Array }>} Created expense with its splits
 */
async function createExpense(expenseData, splits) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const expenseId = uuidv4();
    const expenseResult = await client.query(
      `INSERT INTO expenses (id, group_id, paid_by_user_id, title, description,
                             total_amount_cents, currency, split_type, category,
                             expense_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, group_id, paid_by_user_id, title, description,
                 total_amount_cents, currency, split_type, category,
                 expense_date, created_by, created_at, updated_at`,
      [
        expenseId,
        expenseData.groupId,
        expenseData.paidByUserId,
        expenseData.title,
        expenseData.description || null,
        expenseData.totalAmountCents,
        expenseData.currency,
        expenseData.splitType,
        expenseData.category || 'general',
        expenseData.expenseDate || new Date().toISOString().split('T')[0],
        expenseData.createdBy,
      ]
    );

    // Insert all splits
    const splitRows = [];
    for (const split of splits) {
      const splitId = uuidv4();
      const splitResult = await client.query(
        `INSERT INTO expense_splits (id, expense_id, user_id, amount_cents, percentage, shares)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, expense_id, user_id, amount_cents, percentage, shares, created_at`,
        [splitId, expenseId, split.userId, split.amountCents, split.percentage || null, split.shares || null]
      );
      splitRows.push(splitResult.rows[0]);
    }

    await client.query('COMMIT');
    return { expense: expenseResult.rows[0], splits: splitRows };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * @description Find an expense by ID with its splits.
 * @usedBy expense.service.js → getExpenseById, updateExpense, deleteExpense
 * @param {string} expenseId - Expense UUID
 * @returns {Promise<{ expense: object|null, splits: Array }>}
 */
async function findExpenseById(expenseId) {
  const expenseResult = await query(
    `SELECT e.id, e.group_id, e.paid_by_user_id, e.title, e.description,
            e.total_amount_cents, e.currency, e.split_type, e.category,
            e.expense_date, e.created_by, e.created_at, e.updated_at,
            u.name AS payer_name, u.avatar_url AS payer_avatar
     FROM expenses e
     INNER JOIN users u ON u.id = e.paid_by_user_id
     WHERE e.id = $1 AND e.deleted_at IS NULL`,
    [expenseId]
  );

  if (expenseResult.rows.length === 0) {
    return { expense: null, splits: [] };
  }

  const splitsResult = await query(
    `SELECT es.id, es.user_id, es.amount_cents, es.percentage, es.shares,
            u.name AS user_name, u.avatar_url AS user_avatar
     FROM expense_splits es
     INNER JOIN users u ON u.id = es.user_id
     WHERE es.expense_id = $1 AND es.is_active = true
     ORDER BY es.amount_cents DESC`,
    [expenseId]
  );

  return { expense: expenseResult.rows[0], splits: splitsResult.rows };
}

/**
 * @description Find expenses for a group with cursor-based pagination and optional filters.
 * @usedBy expense.service.js → getExpenses
 * @param {string} groupId - Group UUID
 * @param {{ limit: number, cursor: string|null, sortBy: string, sortOrder: string, category?: string }} options
 * @returns {Promise<Array>} Expense rows (limit+1 for hasMore detection)
 */
async function findExpensesByGroupId(groupId, { limit, cursor, sortBy, sortOrder, category }) {
  const params = [groupId, limit + 1];
  const conditions = ['e.group_id = $1', 'e.deleted_at IS NULL'];
  let paramIndex = 3;

  if (cursor) {
    conditions.push(`e.created_at < (SELECT created_at FROM expenses WHERE id = $${paramIndex})`);
    params.push(cursor);
    paramIndex++;
  }

  if (category) {
    conditions.push(`e.category = $${paramIndex}`);
    params.push(category);
    paramIndex++;
  }

  const allowedSortColumns = ['created_at', 'expense_date', 'total_amount_cents'];
  const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const result = await query(
    `SELECT e.id, e.group_id, e.paid_by_user_id, e.title, e.description,
            e.total_amount_cents, e.currency, e.split_type, e.category,
            e.expense_date, e.created_by, e.created_at, e.updated_at,
            u.name AS payer_name, u.avatar_url AS payer_avatar
     FROM expenses e
     INNER JOIN users u ON u.id = e.paid_by_user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY e.${safeSortBy} ${safeSortOrder}
     LIMIT $2`,
    params
  );

  return result.rows;
}

/**
 * @description Update expense fields and optionally replace splits in a transaction.
 * @usedBy expense.service.js → updateExpense
 * @param {string} expenseId - Expense UUID
 * @param {object} fields - Expense fields to update
 * @param {Array|null} newSplits - If provided, replaces all existing splits
 * @returns {Promise<{ expense: object, splits: Array }>}
 */
async function updateExpense(expenseId, fields, newSplits) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Update expense fields
    const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
    if (entries.length > 0) {
      const setClauses = entries.map(([key], i) => `${key} = $${i + 2}`);
      const values = entries.map(([, val]) => val);

      await client.query(
        `UPDATE expenses SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1`,
        [expenseId, ...values]
      );
    }

    // Replace splits if provided
    if (newSplits) {
      await client.query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);

      for (const split of newSplits) {
        const splitId = uuidv4();
        await client.query(
          `INSERT INTO expense_splits (id, expense_id, user_id, amount_cents, percentage, shares)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [splitId, expenseId, split.userId, split.amountCents, split.percentage || null, split.shares || null]
        );
      }
    }

    await client.query('COMMIT');

    // Return updated expense with splits
    return findExpenseById(expenseId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * @description Soft-delete an expense (set deleted_at) within an existing transaction.
 * @usedBy expense.service.js → deleteExpense
 * @param {string} expenseId - Expense UUID
 * @param {object} client - pg transaction client
 * @returns {Promise<void>}
 */
async function softDeleteExpense(expenseId, client) {
  const dbClient = client || { query }; // Fallback to raw query if no client provided
  await dbClient.query(
    `UPDATE expenses SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [expenseId]
  );
}

/**
 * @description Deactivates all splits for an expense within a transaction.
 * @usedBy expense.service.js → deleteExpense
 * @param {string} expenseId - Expense UUID
 * @param {object} client - pg transaction client
 * @returns {Promise<void>}
 */
async function deactivateSplitsByExpenseId(expenseId, client) {
  await client.query(
    `UPDATE expense_splits SET is_active = false WHERE expense_id = $1`,
    [expenseId]
  );
}

/**
 * @description Check if any confirmed payments reference users who have splits on this expense.
 * Used for BR-04 settlement check before edit/delete.
 * @usedBy expense.service.js → updateExpense, deleteExpense
 * @param {string} expenseId - Expense UUID
 * @param {string} groupId - Group UUID
 * @returns {Promise<boolean>} true if settlements exist referencing the expense participants
 */
async function hasRelatedSettlements(expenseId, groupId) {
  const result = await query(
    `SELECT 1 FROM payments p
     WHERE p.group_id = $1
       AND p.status = 'confirmed'
       AND p.deleted_at IS NULL
       AND (p.paid_by_user_id IN (SELECT user_id FROM expense_splits WHERE expense_id = $2)
            OR p.paid_to_user_id IN (SELECT user_id FROM expense_splits WHERE expense_id = $2))
     LIMIT 1`,
    [groupId, expenseId]
  );
  return result.rows.length > 0;
}

module.exports = {
  createExpense,
  findExpenseById,
  findExpensesByGroupId,
  updateExpense,
  softDeleteExpense,
  deactivateSplitsByExpenseId,
  hasRelatedSettlements,
  getClient, // Exporting getClient to allow service to construct transactions
};
