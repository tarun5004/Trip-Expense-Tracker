/**
 * @fileoverview Balance calculation utilities. Pure functions for group balance computation.
 * Transforms raw database rows into structured balance objects.
 * @module services/expenseEngine/balanceCalculator
 */

/**
 * @description Calculate group balances from raw expense and payment data.
 * Takes pre-aggregated rows from the database and computes net amounts.
 * @usedBy balance.service.js → getGroupBalances
 * @param {Array<{ debtor_id: string, creditor_id: string, net_balance_cents: number }>} rawBalances
 *   Pre-computed pairwise balances from the database query
 * @returns {Array<{ debtorId: string, creditorId: string, amountCents: number }>}
 *   Cleaned balance records with positive amounts only (direction is debtor→creditor)
 */
function calculateGroupBalances(rawBalances) {
  if (!rawBalances || rawBalances.length === 0) {
    return [];
  }

  const balances = [];

  for (const row of rawBalances) {
    const netCents = parseInt(row.net_balance_cents, 10);
    if (netCents === 0) continue;

    if (netCents > 0) {
      // debtor owes creditor
      balances.push({
        debtorId: row.debtor_id,
        creditorId: row.creditor_id,
        amountCents: netCents,
      });
    } else {
      // creditor actually owes debtor — flip the direction
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
 * @description Calculate per-member summary balances for a group.
 * Shows each member's total owed and total owing amounts.
 * @usedBy balance.service.js → getGroupBalances
 * @param {Array<{ debtorId: string, creditorId: string, amountCents: number }>} balances
 *   Pairwise balance list
 * @returns {Map<string, { totalOwed: number, totalOwing: number, netBalance: number }>}
 *   Per-member balance summary
 */
function calculatePairwiseBalances(balances) {
  const summary = new Map();

  const getOrCreate = (userId) => {
    if (!summary.has(userId)) {
      summary.set(userId, { totalOwed: 0, totalOwing: 0, netBalance: 0 });
    }
    return summary.get(userId);
  };

  for (const { debtorId, creditorId, amountCents } of balances) {
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
