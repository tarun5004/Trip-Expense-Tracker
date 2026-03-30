/**
 * @fileoverview Balance calculation utilities. Pure functions for transforming
 * raw database balance rows into structured debtor→creditor pairs and
 * per-member summary objects.
 *
 * These functions bridge the gap between the raw SQL output (snake_case,
 * string amounts, possible negative values) and the clean domain objects
 * used by the API layer.
 *
 * @module services/expenseEngine/balanceCalculator
 */

/**
 * @function calculateGroupBalances
 * @description Transform raw database balance rows into normalized debtor→creditor pairs.
 * Handles direction normalization: if net_balance_cents is negative, the direction
 * is flipped so all output amounts are positive with correct debtor/creditor assignment.
 * Filters out zero-balance pairs.
 * @pure true — no side effects, no I/O
 * @usedBy balance.service.js → getGroupBalances, getSimplifiedBalances
 * @param {Array<{ debtor_id: string, creditor_id: string, net_balance_cents: string|number }>} rawBalances
 *   Pre-computed pairwise balances from the database query (note: amounts may be strings from pg)
 * @returns {Array<{ debtorId: string, creditorId: string, amountCents: number }>}
 *   Cleaned balance records. All amountCents are positive integers.
 *   Direction is always debtor→creditor (debtor owes creditor).
 * @example
 * calculateGroupBalances([
 *   { debtor_id: 'A', creditor_id: 'B', net_balance_cents: '500' },
 *   { debtor_id: 'C', creditor_id: 'D', net_balance_cents: '-200' },
 *   { debtor_id: 'E', creditor_id: 'F', net_balance_cents: '0' }
 * ])
 * // Returns: [
 * //   { debtorId: 'A', creditorId: 'B', amountCents: 500 },
 * //   { debtorId: 'D', creditorId: 'C', amountCents: 200 }  // flipped
 * // ]
 * // Note: E↔F pair is excluded (zero balance)
 */
function calculateGroupBalances(rawBalances) {
  if (!Array.isArray(rawBalances) || rawBalances.length === 0) {
    return [];
  }

  const balances = [];

  for (const row of rawBalances) {
    // pg returns bigint/numeric as strings — parse safely
    const netCents = parseInt(row.net_balance_cents, 10);

    if (isNaN(netCents) || netCents === 0) continue;

    if (netCents > 0) {
      // debtor owes creditor (direction matches DB row)
      balances.push({
        debtorId: row.debtor_id,
        creditorId: row.creditor_id,
        amountCents: netCents,
      });
    } else {
      // Negative means creditor actually owes debtor — flip the direction
      balances.push({
        debtorId: row.creditor_id,
        creditorId: row.debtor_id,
        amountCents: Math.abs(netCents),
      });
    }
  }

  return balances;
}

/**
 * @function calculatePairwiseBalances
 * @description Calculate per-member summary balances from pairwise debts.
 * For each member, computes:
 *  - totalOwed: total amount others owe them (they are creditor)
 *  - totalOwing: total amount they owe others (they are debtor)
 *  - netBalance: totalOwed - totalOwing (positive = net creditor, negative = net debtor)
 * @pure true — no side effects, no I/O
 * @usedBy balance.service.js → getGroupBalances (enriched member summaries)
 * @param {Array<{ debtorId: string, creditorId: string, amountCents: number }>} balances
 *   Normalized pairwise balance list (from calculateGroupBalances)
 * @returns {Map<string, { totalOwed: number, totalOwing: number, netBalance: number }>}
 *   Per-member balance summary keyed by userId
 * @example
 * calculatePairwiseBalances([
 *   { debtorId: 'A', creditorId: 'B', amountCents: 500 },
 *   { debtorId: 'A', creditorId: 'C', amountCents: 300 }
 * ])
 * // Returns: Map {
 * //   'A' => { totalOwed: 0,   totalOwing: 800, netBalance: -800 },
 * //   'B' => { totalOwed: 500, totalOwing: 0,   netBalance: 500 },
 * //   'C' => { totalOwed: 300, totalOwing: 0,   netBalance: 300 }
 * // }
 */
function calculatePairwiseBalances(balances) {
  if (!Array.isArray(balances)) {
    return new Map();
  }

  const summary = new Map();

  const getOrCreate = (userId) => {
    if (!summary.has(userId)) {
      summary.set(userId, { totalOwed: 0, totalOwing: 0, netBalance: 0 });
    }
    return summary.get(userId);
  };

  for (const { debtorId, creditorId, amountCents } of balances) {
    if (!Number.isInteger(amountCents) || amountCents <= 0) continue;

    const debtor = getOrCreate(debtorId);
    debtor.totalOwing += amountCents;
    debtor.netBalance -= amountCents;

    const creditor = getOrCreate(creditorId);
    creditor.totalOwed += amountCents;
    creditor.netBalance += amountCents;
  }

  return summary;
}

module.exports = {
  calculateGroupBalances,
  calculatePairwiseBalances,
};
