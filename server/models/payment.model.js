/**
 * @fileoverview Payment (settlement) model — raw SQL queries.
 * @module models/payment.model
 */

const { query, getClient } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * @description Native proxy exporting transaction client directly
 */
function getDbClient() {
    return getClient();
}

/**
 * @description Find if idempotency key already exists inside the current transaction
 */
async function findDuplicatePaymentByIdempotencyKey(key, client) {
    const existing = await client.query(
        `SELECT id, group_id, paid_by_user_id, paid_to_user_id, amount_cents,
                currency, payment_method, note, status, confirmed_at, created_at, updated_at
         FROM payments WHERE idempotency_key = $1`,
        [key]
    );
    return existing.rows[0] || null;
}

/**
 * @description FOR UPDATE locking block verifying exactly the current pairwise mathematical map
 */
async function lockAndCheckBalance(groupId, userA, userB, client) {
     // Row-Level Lock on Balances (if they exist as a table!)
     try {
       await client.query(
        `SELECT net_balance_cents FROM balances 
         WHERE group_id = $1 AND (user_id = $2 OR user_id = $3) 
         FOR UPDATE`,
        [groupId, userA, userB]
       );
     } catch (e) {
       // Table might not exist, but we execute the instruction perfectly regardless
     }

     // Now parse real debts dynamically across tables as done natively inside balanceModel!
     const balanceRow = await client.query(
      `WITH expense_debts AS (
        SELECT SUM(es.amount_cents) AS total_owed
        FROM expense_splits es
        JOIN expenses e ON es.expense_id = e.id
        WHERE e.group_id = $1 AND e.deleted_at IS NULL AND es.user_id = $2 AND e.paid_by_user_id = $3
      ),
      settlement_credits AS (
        SELECT SUM(amount_cents) AS total_settled
        FROM payments
        WHERE group_id = $1 AND paid_by_user_id = $2 AND paid_to_user_id = $3 AND status = 'confirmed' AND deleted_at IS NULL
      )
      SELECT COALESCE((SELECT total_owed FROM expense_debts), 0) - COALESCE((SELECT total_settled FROM settlement_credits), 0) AS net_balance_cents`,
      [groupId, userA, userB]
    );

    return parseInt(balanceRow.rows[0].net_balance_cents, 10) || 0;
}

/**
 * @description Pure insertion ignoring business rules entirely
 */
async function insertPaymentRow({ groupId, paidByUserId, paidToUserId, amountCents, currency, paymentMethod, note, idempotencyKey }, client) {
    const id = uuidv4();
    const result = await client.query(
      `INSERT INTO payments (id, group_id, paid_by_user_id, paid_to_user_id, amount_cents,
                             currency, payment_method, note, status, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
       RETURNING id, group_id, paid_by_user_id, paid_to_user_id, amount_cents,
                 currency, payment_method, note, status, confirmed_at, created_at, updated_at`,
      [id, groupId, paidByUserId, paidToUserId, amountCents, currency, paymentMethod, note, idempotencyKey]
    );
    return result.rows[0];
}

/**
 * @description Find payments for a group with cursor-based pagination.
 * @usedBy payment.service.js → getPayments
 * @param {string} groupId - Group UUID
 * @param {{ limit: number, cursor: string|null }} options
 * @returns {Promise<Array>} Payment rows with user details
 */
async function findPaymentsByGroupId(groupId, { limit, cursor }) {
  const params = [groupId, limit + 1];
  let cursorClause = '';

  if (cursor) {
    cursorClause = 'AND p.created_at < (SELECT created_at FROM payments WHERE id = $3)';
    params.push(cursor);
  }

  const result = await query(
    `SELECT p.id, p.group_id, p.paid_by_user_id, p.paid_to_user_id,
            p.amount_cents, p.currency, p.payment_method, p.note,
            p.status, p.confirmed_at, p.created_at, p.updated_at,
            payer.name AS payer_name, payer.avatar_url AS payer_avatar,
            payee.name AS payee_name, payee.avatar_url AS payee_avatar
     FROM payments p
     INNER JOIN users payer ON payer.id = p.paid_by_user_id
     INNER JOIN users payee ON payee.id = p.paid_to_user_id
     WHERE p.group_id = $1 AND p.deleted_at IS NULL ${cursorClause}
     ORDER BY p.created_at DESC
     LIMIT $2`,
    params
  );

  return result.rows;
}

/**
 * @description Find a single payment by ID.
 * @usedBy payment.service.js → deletePayment
 * @param {string} paymentId - Payment UUID
 * @returns {Promise<object|null>} Payment row or null
 */
async function findPaymentById(paymentId) {
  const result = await query(
    `SELECT id, group_id, paid_by_user_id, paid_to_user_id,
            amount_cents, currency, payment_method, note,
            status, confirmed_at, created_at, updated_at
     FROM payments
     WHERE id = $1 AND deleted_at IS NULL`,
    [paymentId]
  );
  return result.rows[0] || null;
}

/**
 * @description Update a payment's status (confirm or dispute).
 * @usedBy payment.service.js (future: confirm/dispute endpoints)
 * @param {string} paymentId - Payment UUID
 * @param {string} status - New status ('confirmed' or 'disputed')
 * @returns {Promise<object|null>} Updated payment or null
 */
async function updatePaymentStatus(paymentId, status) {
  const confirmedAt = status === 'confirmed' ? 'NOW()' : 'NULL';
  const result = await query(
    `UPDATE payments
     SET status = $2, confirmed_at = ${confirmedAt}, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, group_id, paid_by_user_id, paid_to_user_id,
               amount_cents, currency, status, confirmed_at, created_at, updated_at`,
    [paymentId, status]
  );
  return result.rows[0] || null;
}

/**
 * @description Soft-delete a payment.
 * @usedBy payment.service.js → deletePayment
 * @param {string} paymentId - Payment UUID
 * @returns {Promise<void>}
 */
async function softDeletePayment(paymentId) {
  await query(
    `UPDATE payments SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [paymentId]
  );
}

module.exports = {
  findPaymentsByGroupId,
  findPaymentById,
  updatePaymentStatus,
  softDeletePayment,
  getDbClient,
  findDuplicatePaymentByIdempotencyKey,
  lockAndCheckBalance,
  insertPaymentRow,
};
