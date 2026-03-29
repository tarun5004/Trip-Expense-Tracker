/**
 * @fileoverview Currency utility functions for safe integer arithmetic.
 * ALL monetary calculations MUST go through these functions.
 * Rule: store as integers (cents/paise), NEVER use floats for money.
 * @module services/expenseEngine/currencyUtils
 */

/**
 * @description Convert a decimal amount (e.g. 24.50) to integer cents (2450).
 * Uses Math.round to handle floating-point imprecision safely.
 * @param {number} amount - Decimal amount (e.g. 24.50)
 * @returns {number} Integer amount in cents/paise
 * @throws {Error} If amount is not a finite number
 */
function toCents(amount) {
  if (typeof amount !== 'number' || !isFinite(amount)) {
    throw new Error(`toCents: expected a finite number, got ${amount}`);
  }
  return Math.round(amount * 100);
}

/**
 * @description Convert integer cents (2450) to decimal amount (24.50).
 * Only use for DISPLAY purposes — never for further calculations.
 * @param {number} cents - Integer amount in cents/paise
 * @returns {number} Decimal amount
 */
function fromCents(cents) {
  if (!Number.isInteger(cents)) {
    throw new Error(`fromCents: expected an integer, got ${cents}`);
  }
  return cents / 100;
}

/**
 * @description Format integer cents as a currency display string.
 * @param {number} cents - Integer amount in cents/paise
 * @param {string} [currency='INR'] - ISO 4217 currency code
 * @returns {string} Formatted string (e.g. "₹24.50")
 */
function formatCurrency(cents, currency = 'INR') {
  const amount = fromCents(cents);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * @description Safely add two integer cent amounts.
 * @param {number} a - First amount in cents
 * @param {number} b - Second amount in cents
 * @returns {number} Sum in cents
 * @throws {Error} If either argument is not an integer
 */
function safeAdd(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new Error(`safeAdd: both arguments must be integers, got ${a} and ${b}`);
  }
  return a + b;
}

/**
 * @description Safely subtract two integer cent amounts.
 * @param {number} a - Amount to subtract from (cents)
 * @param {number} b - Amount to subtract (cents)
 * @returns {number} Difference in cents
 * @throws {Error} If either argument is not an integer
 */
function safeSubtract(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new Error(`safeSubtract: both arguments must be integers, got ${a} and ${b}`);
  }
  return a - b;
}

/**
 * @description Safely multiply an integer cent amount by a factor.
 * Result is rounded to nearest integer (cent).
 * @param {number} cents - Amount in cents
 * @param {number} factor - Multiplication factor (can be decimal, e.g. 0.25)
 * @returns {number} Rounded integer result in cents
 */
function safeMultiply(cents, factor) {
  if (!Number.isInteger(cents)) {
    throw new Error(`safeMultiply: cents must be an integer, got ${cents}`);
  }
  if (typeof factor !== 'number' || !isFinite(factor)) {
    throw new Error(`safeMultiply: factor must be a finite number, got ${factor}`);
  }
  return Math.round(cents * factor);
}

module.exports = {
  toCents,
  fromCents,
  formatCurrency,
  safeAdd,
  safeSubtract,
  safeMultiply,
};
