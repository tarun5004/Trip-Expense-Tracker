/**
 * @fileoverview Barrel export for the expense calculation engine.
 * Single import point for all split calculations, debt simplification,
 * balance computation, and currency utilities.
 *
 * @module services/expenseEngine
 *
 * @example
 * const {
 *   calculateEqualSplit,
 *   validateSplitConsistency,
 *   simplifyDebts,
 *   toCents,
 *   fromCents
 * } = require('./expenseEngine');
 */

const {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  validateSplitConsistency,
} = require('./splitCalculator');

const {
  calculateNetBalances,
  simplifyDebts,
} = require('./debtSimplifier');

const {
  calculateGroupBalances,
  calculatePairwiseBalances,
} = require('./balanceCalculator');

const {
  toCents,
  fromCents,
  formatCurrency,
  safeAdd,
  safeSubtract,
  safeMultiply,
  MAX_SAFE_CENTS,
} = require('./currencyUtils');

module.exports = {
  // Split calculations
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  validateSplitConsistency,

  // Debt simplification
  calculateNetBalances,
  simplifyDebts,

  // Balance computation
  calculateGroupBalances,
  calculatePairwiseBalances,

  // Currency utilities
  toCents,
  fromCents,
  formatCurrency,
  safeAdd,
  safeSubtract,
  safeMultiply,
  MAX_SAFE_CENTS,
};
