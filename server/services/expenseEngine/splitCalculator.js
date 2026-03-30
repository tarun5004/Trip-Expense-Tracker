/**
 * @fileoverview Split calculation engine. Pure functions, NO database calls.
 * Handles equal, exact, percentage, and shares split types.
 *
 * MONEY RULES:
 *  - All math in integers (cents). NEVER use parseFloat on money.
 *  - Remainders from integer division are distributed 1 cent at a time
 *    to the FIRST N participants (deterministic, reproducible).
 *  - validateSplitConsistency() MUST be called before every expense save.
 *
 * @module services/expenseEngine/splitCalculator
 */

const { SPLIT_TYPES } = require('../../config/constants');

/**
 * @function calculateEqualSplit
 * @description Calculate equal split amounts for an expense.
 * Divides total evenly; distributes remainder cents (1 per person)
 * to the first N participants for cent-perfect totals.
 * @pure true — no side effects, no I/O
 * @usedBy expense.service.js → createExpense, updateExpense
 * @param {number} totalAmountCents - Total expense amount in cents (positive integer)
 * @param {string[]} participantIds - Array of participant user UUIDs (min 2)
 * @returns {Array<{ userId: string, amountCents: number }>} Calculated splits that sum exactly to totalAmountCents
 * @throws {Error} If totalAmountCents is not a positive integer
 * @throws {Error} If fewer than 2 participants
 * @example
 * calculateEqualSplit(1000, ['u1', 'u2', 'u3'])
 * // Returns: [
 * //   { userId: 'u1', amountCents: 334 },
 * //   { userId: 'u2', amountCents: 333 },
 * //   { userId: 'u3', amountCents: 333 }
 * // ]
 *
 * calculateEqualSplit(100, ['u1', 'u2'])
 * // Returns: [
 * //   { userId: 'u1', amountCents: 50 },
 * //   { userId: 'u2', amountCents: 50 }
 * // ]
 */
function calculateEqualSplit(totalAmountCents, participantIds) {
  if (!Number.isInteger(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error(`calculateEqualSplit: totalAmountCents must be a positive integer, got ${totalAmountCents}`);
  }
  if (!Array.isArray(participantIds) || participantIds.length < 2) {
    throw new Error(`calculateEqualSplit: at least 2 participants required, got ${Array.isArray(participantIds) ? participantIds.length : 0}`);
  }

  const count = participantIds.length;
  const baseAmount = Math.floor(totalAmountCents / count);
  const remainder = totalAmountCents - baseAmount * count; // always 0 <= remainder < count

  return participantIds.map((userId, index) => ({
    userId,
    amountCents: index < remainder ? baseAmount + 1 : baseAmount,
  }));
}

/**
 * @function calculateExactSplit
 * @description Validate and pass through explicit per-participant amounts.
 * Each participant's amountCents is provided directly. This function
 * verifies they sum to the total and all values are non-negative integers.
 * @pure true — no side effects, no I/O
 * @usedBy expense.service.js → createExpense, updateExpense
 * @param {number} totalAmountCents - Total expense amount in cents (positive integer)
 * @param {Array<{ userId: string, amountCents: number }>} splits - Explicit amounts per user
 * @returns {Array<{ userId: string, amountCents: number }>} Validated splits (pass-through)
 * @throws {Error} If splits don't sum to totalAmountCents
 * @throws {Error} If fewer than 2 participants
 * @throws {Error} If any amountCents is not a non-negative integer
 * @example
 * calculateExactSplit(1000, [
 *   { userId: 'u1', amountCents: 700 },
 *   { userId: 'u2', amountCents: 300 }
 * ])
 * // Returns: [{ userId: 'u1', amountCents: 700 }, { userId: 'u2', amountCents: 300 }]
 */
function calculateExactSplit(totalAmountCents, splits) {
  if (!Number.isInteger(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error(`calculateExactSplit: totalAmountCents must be a positive integer, got ${totalAmountCents}`);
  }
  if (!Array.isArray(splits) || splits.length < 2) {
    throw new Error(`calculateExactSplit: at least 2 participants required, got ${Array.isArray(splits) ? splits.length : 0}`);
  }

  // Validate each split entry
  for (let i = 0; i < splits.length; i++) {
    const s = splits[i];
    if (!Number.isInteger(s.amountCents) || s.amountCents < 0) {
      throw new Error(`calculateExactSplit: splits[${i}].amountCents must be a non-negative integer, got ${s.amountCents}`);
    }
  }

  const sum = splits.reduce((acc, s) => acc + s.amountCents, 0);
  if (sum !== totalAmountCents) {
    throw new Error(
      `calculateExactSplit: split amounts sum to ${sum} but total is ${totalAmountCents}. Difference: ${totalAmountCents - sum}`
    );
  }

  return splits.map(({ userId, amountCents }) => ({
    userId,
    amountCents,
  }));
}

/**
 * @function calculatePercentageSplit
 * @description Calculate split amounts from percentage allocations.
 * Percentages must sum to exactly 100 (±0.01 tolerance for floating point).
 * Converts each percentage to integer cents via Math.floor, then distributes
 * the remainder by largest-fractional-part for cent-perfect totals.
 * @pure true — no side effects, no I/O
 * @usedBy expense.service.js → createExpense, updateExpense
 * @param {number} totalAmountCents - Total expense amount in cents (positive integer)
 * @param {Array<{ userId: string, percentage: number }>} splits - Percentage per user (must sum to 100)
 * @returns {Array<{ userId: string, amountCents: number, percentage: number }>} Calculated splits
 * @throws {Error} If percentages don't sum to 100 (±0.01)
 * @throws {Error} If fewer than 2 participants
 * @throws {Error} If any percentage is not in [0, 100]
 * @example
 * calculatePercentageSplit(10000, [
 *   { userId: 'u1', percentage: 50 },
 *   { userId: 'u2', percentage: 30 },
 *   { userId: 'u3', percentage: 20 }
 * ])
 * // Returns: [
 * //   { userId: 'u1', amountCents: 5000, percentage: 50 },
 * //   { userId: 'u2', amountCents: 3000, percentage: 30 },
 * //   { userId: 'u3', amountCents: 2000, percentage: 20 }
 * // ]
 *
 * calculatePercentageSplit(100, [
 *   { userId: 'u1', percentage: 33.33 },
 *   { userId: 'u2', percentage: 33.33 },
 *   { userId: 'u3', percentage: 33.34 }
 * ])
 * // Returns splits summing to exactly 100 cents with remainder distribution
 */
function calculatePercentageSplit(totalAmountCents, splits) {
  if (!Number.isInteger(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error(`calculatePercentageSplit: totalAmountCents must be a positive integer, got ${totalAmountCents}`);
  }
  if (!Array.isArray(splits) || splits.length < 2) {
    throw new Error(`calculatePercentageSplit: at least 2 participants required, got ${Array.isArray(splits) ? splits.length : 0}`);
  }

  // Validate each percentage
  for (let i = 0; i < splits.length; i++) {
    const p = splits[i].percentage;
    if (typeof p !== 'number' || !isFinite(p) || p < 0 || p > 100) {
      throw new Error(`calculatePercentageSplit: splits[${i}].percentage must be a number in [0, 100], got ${p}`);
    }
  }

  // Percentages must sum to 100 (±0.01 tolerance for floating point)
  const totalPercentage = splits.reduce((acc, s) => acc + s.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`calculatePercentageSplit: percentages must sum to 100, got ${totalPercentage}`);
  }

  // Calculate raw amounts and floor to integers
  const calculated = splits.map((s) => {
    const rawAmount = (totalAmountCents * s.percentage) / 100;
    return {
      userId: s.userId,
      percentage: s.percentage,
      rawAmount,
      amountCents: Math.floor(rawAmount),
    };
  });

  // Distribute remainder by largest fractional part
  const currentTotal = calculated.reduce((acc, s) => acc + s.amountCents, 0);
  let remainder = totalAmountCents - currentTotal;

  if (remainder > 0) {
    // Build an index array sorted by fractional part descending
    const indices = calculated
      .map((s, i) => ({ index: i, fraction: s.rawAmount - s.amountCents }))
      .sort((a, b) => b.fraction - a.fraction);

    for (let i = 0; i < remainder; i++) {
      calculated[indices[i].index].amountCents += 1;
    }
  }

  return calculated.map(({ userId, amountCents, percentage }) => ({
    userId,
    amountCents,
    percentage,
  }));
}

/**
 * @function calculateSharesSplit
 * @description Calculate split amounts from share-unit allocations.
 * Each participant declares N shares; their amount = total × (myShares / totalShares).
 * Uses Math.floor + largest-fractional-part remainder distribution.
 * @pure true — no side effects, no I/O
 * @usedBy expense.service.js → createExpense, updateExpense
 * @param {number} totalAmountCents - Total expense amount in cents (positive integer)
 * @param {Array<{ userId: string, shares: number }>} splits - Share units per user (non-negative integers)
 * @returns {Array<{ userId: string, amountCents: number, shares: number }>} Calculated splits
 * @throws {Error} If total shares is 0 or fewer than 2 participants
 * @throws {Error} If any shares value is not a non-negative integer
 * @example
 * calculateSharesSplit(1000, [
 *   { userId: 'u1', shares: 2 },
 *   { userId: 'u2', shares: 1 },
 *   { userId: 'u3', shares: 1 }
 * ])
 * // Returns: [
 * //   { userId: 'u1', amountCents: 500, shares: 2 },
 * //   { userId: 'u2', amountCents: 250, shares: 1 },
 * //   { userId: 'u3', amountCents: 250, shares: 1 }
 * // ]
 */
function calculateSharesSplit(totalAmountCents, splits) {
  if (!Number.isInteger(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error(`calculateSharesSplit: totalAmountCents must be a positive integer, got ${totalAmountCents}`);
  }
  if (!Array.isArray(splits) || splits.length < 2) {
    throw new Error(`calculateSharesSplit: at least 2 participants required, got ${Array.isArray(splits) ? splits.length : 0}`);
  }

  // Validate each shares entry
  for (let i = 0; i < splits.length; i++) {
    const sh = splits[i].shares;
    if (!Number.isInteger(sh) || sh < 0) {
      throw new Error(`calculateSharesSplit: splits[${i}].shares must be a non-negative integer, got ${sh}`);
    }
  }

  const totalShares = splits.reduce((acc, s) => acc + s.shares, 0);
  if (totalShares <= 0) {
    throw new Error(`calculateSharesSplit: total shares must be greater than 0, got ${totalShares}`);
  }

  // Calculate raw amounts and floor to integers
  const calculated = splits.map((s) => {
    const rawAmount = (totalAmountCents * s.shares) / totalShares;
    return {
      userId: s.userId,
      shares: s.shares,
      rawAmount,
      amountCents: Math.floor(rawAmount),
    };
  });

  // Distribute remainder by largest fractional part
  const currentTotal = calculated.reduce((acc, s) => acc + s.amountCents, 0);
  let remainder = totalAmountCents - currentTotal;

  if (remainder > 0) {
    const indices = calculated
      .map((s, i) => ({ index: i, fraction: s.rawAmount - s.amountCents }))
      .sort((a, b) => b.fraction - a.fraction);

    for (let i = 0; i < remainder; i++) {
      calculated[indices[i].index].amountCents += 1;
    }
  }

  return calculated.map(({ userId, amountCents, shares }) => ({
    userId,
    amountCents,
    shares,
  }));
}

/**
 * @function validateSplitConsistency
 * @description Validate that computed splits sum EXACTLY to the total amount.
 * MUST be called before every expense save. Zero tolerance for mismatches.
 * This is the final safety gate — a failed validation should block the write.
 * @pure true — no side effects, no I/O
 * @usedBy expense.service.js → createExpense, updateExpense (called before DB write)
 * @param {number} totalAmountCents - Expected total in cents
 * @param {Array<{ userId: string, amountCents: number }>} splits - Computed splits to verify
 * @returns {{ valid: boolean, sum: number, difference: number, participantCount: number }} Validation result
 * @example
 * validateSplitConsistency(1000, [
 *   { userId: 'u1', amountCents: 500 },
 *   { userId: 'u2', amountCents: 500 }
 * ])
 * // Returns: { valid: true, sum: 1000, difference: 0, participantCount: 2 }
 *
 * validateSplitConsistency(1000, [
 *   { userId: 'u1', amountCents: 600 },
 *   { userId: 'u2', amountCents: 300 }
 * ])
 * // Returns: { valid: false, sum: 900, difference: 100, participantCount: 2 }
 */
function validateSplitConsistency(totalAmountCents, splits) {
  if (!Array.isArray(splits) || splits.length === 0) {
    return { valid: false, sum: 0, difference: totalAmountCents, participantCount: 0 };
  }

  const sum = splits.reduce((acc, s) => acc + s.amountCents, 0);
  const difference = totalAmountCents - sum;

  return {
    valid: difference === 0,
    sum,
    difference,
    participantCount: splits.length,
  };
}

module.exports = {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  validateSplitConsistency,
};
