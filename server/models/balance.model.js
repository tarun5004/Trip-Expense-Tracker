/**
 * @fileoverview Balance model — raw SQL queries for computing group balances.
 * Uses the canonical balance computation query from DATABASE_SCHEMA.md.
 * @module models/balance.model
 */

const { query } = require('../config/db');

/**
 * @description Compute net pairwise balances for a group from expenses and confirmed payments.
 * Returns rows where debtor owes creditor a positive net_balance_cents.
 * This is the canonical balance query from the database schema document.
 * @usedBy balance.service.js → getGroupBalances, group.service.js → removeMember
 * @param {string} groupId - Group UUID
 * @returns {Promise<Array<{ debtor_id: string, creditor_id: string, net_balance_cents: string }>>}
 *   Pairwise net balances (net_balance_cents > 0 means debtor owes creditor)
 */
async function getGroupBalances(groupId) {
  const result = await query(
    `WITH expense_debts AS (
        SELECT
            es.user_id AS debtor_id,
            e.paid_by_user_id AS creditor_id,
            SUM(es.amount_cents) AS total_owed
        FROM expense_splits es
        JOIN expenses e ON es.expense_id = e.id
        WHERE e.group_id = $1
          AND e.deleted_at IS NULL
          AND es.user_id != e.paid_by_user_id
        GROUP BY es.user_id, e.paid_by_user_id
    ),
    settlement_credits AS (
        SELECT
            paid_by_user_id AS debtor_id,
            paid_to_user_id AS creditor_id,
            SUM(amount_cents) AS total_settled
        FROM payments
        WHERE group_id = $1
          AND status = 'confirmed'
          AND deleted_at IS NULL
        GROUP BY paid_by_user_id, paid_to_user_id
    )
    SELECT
        COALESCE(d.debtor_id, s.debtor_id) AS debtor_id,
        COALESCE(d.creditor_id, s.creditor_id) AS creditor_id,
        COALESCE(d.total_owed, 0) - COALESCE(s.total_settled, 0) AS net_balance_cents
    FROM expense_debts d
    FULL OUTER JOIN settlement_credits s
        ON d.debtor_id = s.debtor_id AND d.creditor_id = s.creditor_id
    HAVING COALESCE(d.total_owed, 0) - COALESCE(s.total_settled, 0) != 0`,
    [groupId]
  );

  return result.rows;
}

/**
 * @description Get the net balance between a specific pair of users in a group.
 * Positive result means userA owes userB.
 * @usedBy payment.service.js → createPayment (BR-05 check)
 * @param {string} groupId - Group UUID
 * @param {string} userA - First user UUID (potential debtor)
 * @param {string} userB - Second user UUID (potential creditor)
 * @returns {Promise<number>} Net balance in cents (positive = A owes B)
 */
async function getUserPairBalance(groupId, userA, userB) {
  const result = await query(
    `WITH expense_debts AS (
        SELECT SUM(es.amount_cents) AS total_owed
        FROM expense_splits es
        JOIN expenses e ON es.expense_id = e.id
        WHERE e.group_id = $1
          AND e.deleted_at IS NULL
          AND es.user_id = $2
          AND e.paid_by_user_id = $3
    ),
    settlement_credits AS (
        SELECT SUM(amount_cents) AS total_settled
        FROM payments
        WHERE group_id = $1
          AND paid_by_user_id = $2
          AND paid_to_user_id = $3
          AND status = 'confirmed'
          AND deleted_at IS NULL
    )
    SELECT
        COALESCE((SELECT total_owed FROM expense_debts), 0) -
        COALESCE((SELECT total_settled FROM settlement_credits), 0) AS net_balance_cents`,
    [groupId, userA, userB]
  );

  return parseInt(result.rows[0].net_balance_cents, 10);
}

module.exports = { getGroupBalances, getUserPairBalance };
