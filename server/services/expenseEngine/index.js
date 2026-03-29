/**
 * @fileoverview Barrel export for the expense calculation engine.
 * All split calculations, debt simplification, and currency operations.
 * @module services/expenseEngine
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
};
