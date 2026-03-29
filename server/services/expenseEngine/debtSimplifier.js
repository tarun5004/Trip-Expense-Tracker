/**
 * @fileoverview Debt simplification algorithm. Pure function, NO database calls.
 * Implements greedy min-transactions algorithm: largest debtor pays largest creditor.
 * @module services/expenseEngine/debtSimplifier
 */

/**
 * @description Calculate net balances from a list of pairwise debts.
 * Positive net = user is owed money (creditor), Negative = user owes money (debtor).
 * @usedBy balance.service.js → getSimplifiedBalances
 * @param {Array<{ debtorId: string, creditorId: string, amountCents: number }>} transactions
 *   Array of pairwise net debts (post expense/settlement aggregation)
 * @returns {Map<string, number>} Map of userId → net balance in cents (positive = owed, negative = owes)
 */
function calculateNetBalances(transactions) {
  const balances = new Map();

  for (const { debtorId, creditorId, amountCents } of transactions) {
    balances.set(debtorId, (balances.get(debtorId) || 0) - amountCents);
    balances.set(creditorId, (balances.get(creditorId) || 0) + amountCents);
  }

  return balances;
}

/**
 * @description Simplify a set of debts into the minimum number of transactions.
 * Uses a greedy algorithm: repeatedly match the largest debtor with the largest creditor.
 *
 * Algorithm:
 * 1. Calculate net balance for each person
 * 2. Separate into debtors (negative) and creditors (positive)
 * 3. Match largest debtor → largest creditor, settle min(abs(debt), credit)
 * 4. Repeat until all settled
 *
 * @usedBy balance.service.js → getSimplifiedBalances
 * @param {Array<{ debtorId: string, creditorId: string, amountCents: number }>} transactions
 *   Array of pairwise net debts
 * @returns {Array<{ from: string, to: string, amountCents: number }>} Simplified settlement plan
 */
function simplifyDebts(transactions) {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const netBalances = calculateNetBalances(transactions);
  const simplified = [];

  // Separate into debtors and creditors
  const debtors = []; // people who owe (negative balance)
  const creditors = []; // people who are owed (positive balance)

  for (const [userId, balance] of netBalances) {
    if (balance < 0) {
      debtors.push({ userId, amount: Math.abs(balance) });
    } else if (balance > 0) {
      creditors.push({ userId, amount: balance });
    }
    // balance === 0 means settled, skip
  }

  // Sort both by amount descending (greedy: handle largest first)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const debtor = debtors[di];
    const creditor = creditors[ci];

    // Settle the minimum of what debtor owes and what creditor is owed
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0) {
      simplified.push({
        from: debtor.userId,
        to: creditor.userId,
        amountCents: settleAmount,
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount === 0) di++;
    if (creditor.amount === 0) ci++;
  }

  return simplified;
}

module.exports = {
  calculateNetBalances,
  simplifyDebts,
};
