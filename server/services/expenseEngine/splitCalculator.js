/**
 * @fileoverview Split calculation engine. Pure functions, NO database calls.
 * Handles equal, exact, percentage, and shares split types.
 * All math in integers (cents). Remainders distributed 1 cent at a time.
 * @module services/expenseEngine/splitCalculator
 */

const { SPLIT_TYPES } = require('../../config/constants');

/**
 * @description Calculate equal split amounts for an expense.
 * Distributes remainder cents (1 per person) to the first N participants.
 * Example: 1000 cents / 3 people = [334, 333, 333]
 * @usedBy expense.service.js → createExpense
 * @param {number} totalAmountCents - Total expense amount in cents (integer)
 * @param {string[]} participantIds - Array of participant user UUIDs
 * @returns {Array<{ userId: string, amountCents: number }>} Calculated splits
 * @throws {Error} If totalAmountCents is not a positive integer or fewer than 2 participants
 */
function calculateEqualSplit(totalAmountCents, participantIds) {
  if (!Number.isInteger(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error('totalAmountCents must be a positive integer');
  }
  if (!Array.isArray(participantIds) || participantIds.length < 2) {
    throw new Error('At least 2 participants required for a split');
  }

  const count = participantIds.length;
  const baseAmount = Math.floor(totalAmountCents / count);
  const remainder = totalAmountCents - baseAmount * count;

  return participantIds.map((userId, index) => ({
    userId,
    amountCents: index < remainder ? baseAmount + 1 : baseAmount,
  }));
}

/**
 * @description Calculate custom (exact) split amounts.
 * Each participant's amount is explicitly specified. Validates they sum to total.
 * @usedBy expense.service.js → createExpense
 * @param {number} totalAmountCents - Total expense amount in cents
 * @param {Array<{ userId: string, amountCents: number }>} splits - Explicit amounts per user
 * @returns {Array<{ userId: string, amountCents: number }>} Validated splits (pass-through)
 * @throws {Error} If splits don't sum to total or fewer than 2 participants
 */
function calculateExactSplit(totalAmountCents, splits) {
  if (!Number.isInteger(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error('totalAmountCents must be a positive integer');
  }
  if (!Array.isArray(splits) || splits.length < 2) {
    throw new Error('At least 2 participants required for a split');
  }

  const sum = splits.reduce((acc, s) => acc + s.amountCents, 0);
  if (sum !== totalAmountCents) {
    throw new Error(
      `Exact split amounts sum to ${sum} but total is ${totalAmountCents}. Difference: ${totalAmountCents - sum}`
    );
  }

  return splits.map(({ userId, amountCents }) => ({
    userId,
    amountCents,
  }));
}

/**
 * @description Calculate percentage-based split amounts.
 * Percentages must sum to exactly 100. Remainders distributed to first N participants.
 * @usedBy expense.service.js → createExpense
 * @param {number} totalAmountCents - Total expense amount in cents
 * @param {Array<{ userId: string, percentage: number }>} splits - Percentage per user (must sum to 100)
 * @returns {Array<{ userId: string, amountCents: number, percentage: number }>} Calculated splits
 * @throws {Error} If percentages don't sum to 100 or fewer than 2 participants
 */
function calculatePercentageSplit(totalAmountCents, splits) {
  if (!Number.isInteger(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error('totalAmountCents must be a positive integer');
  }
  if (!Array.isArray(splits) || splits.length < 2) {
    throw new Error('At least 2 participants required for a split');
  }

  // Percentages are stored as numbers (e.g., 33.33). Sum must be 100.
  const totalPercentage = splits.reduce((acc, s) => acc + s.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Percentages must sum to 100, got ${totalPercentage}`);
  }

  // Calculate raw amounts and track remainders
  const rawAmounts = splits.map((s) => ({
    userId: s.userId,
    percentage: s.percentage,
    rawAmount: (totalAmountCents * s.percentage) / 100,
    amountCents: Math.floor((totalAmountCents * s.percentage) / 100),
  }));

  // Distribute remainder by largest fractional part
  const currentTotal = rawAmounts.reduce((acc, s) => acc + s.amountCents, 0);
  let remainder = totalAmountCents - currentTotal;

  if (remainder > 0) {
    const sorted = rawAmounts
      .map((s, i) => ({ index: i, fraction: s.rawAmount - s.amountCents }))
      .sort((a, b) => b.fraction - a.fraction);

    for (let i = 0; i < remainder; i++) {
      rawAmounts[sorted[i].index].amountCents += 1;
    }
  }

  return rawAmounts.map(({ userId, amountCents, percentage }) => ({
    userId,
    amountCents,
    percentage,
  }));
}

/**
 * @description Calculate shares-based split amounts.
 * Each participant has N shares; amount = total * (myShares / totalShares).
 * Remainders distributed by largest fractional part.
 * @usedBy expense.service.js → createExpense
 * @param {number} totalAmountCents - Total expense amount in cents
 * @param {Array<{ userId: string, shares: number }>} splits - Share units per user
 * @returns {Array<{ userId: string, amountCents: number, shares: number }>} Calculated splits
 * @throws {Error} If total shares is 0 or fewer than 2 participants
 */
function calculateSharesSplit(totalAmountCents, splits) {
  if (!Number.isInteger(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error('totalAmountCents must be a positive integer');
  }
  if (!Array.isArray(splits) || splits.length < 2) {
    throw new Error('At least 2 participants required for a split');
  }

  const totalShares = splits.reduce((acc, s) => acc + s.shares, 0);
  if (totalShares <= 0) {
    throw new Error('Total shares must be greater than 0');
  }

  const rawAmounts = splits.map((s) => ({
    userId: s.userId,
    shares: s.shares,
    rawAmount: (totalAmountCents * s.shares) / totalShares,
    amountCents: Math.floor((totalAmountCents * s.shares) / totalShares),
  }));

  // Distribute remainder by largest fractional part
  const currentTotal = rawAmounts.reduce((acc, s) => acc + s.amountCents, 0);
  let remainder = totalAmountCents - currentTotal;

  if (remainder > 0) {
    const sorted = rawAmounts
      .map((s, i) => ({ index: i, fraction: s.rawAmount - s.amountCents }))
      .sort((a, b) => b.fraction - a.fraction);

    for (let i = 0; i < remainder; i++) {
      rawAmounts[sorted[i].index].amountCents += 1;
    }
  }

  return rawAmounts.map(({ userId, amountCents, shares }) => ({
    userId,
    amountCents,
    shares,
  }));
}

/**
 * @description Validate that computed splits are consistent with the total amount.
 * MUST be called before every expense save. Zero tolerance for mismatches.
 * @usedBy expense.service.js → createExpense, updateExpense
 * @param {number} totalAmountCents - Expected total in cents
 * @param {Array<{ userId: string, amountCents: number }>} splits - Computed splits
 * @returns {{ valid: boolean, sum: number, difference: number }} Validation result
 */
function validateSplitConsistency(totalAmountCents, splits) {
  const sum = splits.reduce((acc, s) => acc + s.amountCents, 0);
  const difference = totalAmountCents - sum;

  return {
    valid: difference === 0,
    sum,
    difference,
  };
}

module.exports = {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  validateSplitConsistency,
};
