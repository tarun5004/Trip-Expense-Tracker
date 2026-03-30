/**
 * @fileoverview Currency utility functions for safe integer arithmetic.
 * ALL monetary calculations MUST go through these functions.
 *
 * RULES:
 *  - Store as integers (cents/paise) — NEVER use floats for money
 *  - toCents() is the ONLY entry point from user-facing decimals
 *  - fromCents() returns a STRING — NEVER a float
 *  - safeAdd/safeSubtract/safeMultiply enforce integer inputs
 *
 * @module services/expenseEngine/currencyUtils
 */

/**
 * Maximum safe integer amount in cents (Number.MAX_SAFE_INTEGER).
 * ~90 trillion in major currency units — well beyond any realistic expense.
 * @constant {number}
 */
const MAX_SAFE_CENTS = Number.MAX_SAFE_INTEGER; // 9_007_199_254_740_991

/**
 * @function toCents
 * @description Convert a decimal amount in major currency units (e.g., 10.50 dollars)
 * to an integer in the smallest currency unit (e.g., 1050 cents).
 * Uses Math.round to handle floating-point imprecision safely.
 * @pure true — no side effects, no I/O
 * @usedBy expense.service.js (when accepting user input from forms)
 * @param {number} amountInMajorUnit - Decimal amount (e.g., 10.50)
 * @returns {number} Integer amount in cents/paise
 * @throws {Error} If input is not a finite number
 * @example
 * toCents(10.50)   // Returns: 1050
 * toCents(0.01)    // Returns: 1
 * toCents(0)       // Returns: 0
 * toCents(99.999)  // Returns: 10000  (rounds to nearest cent)
 */
function toCents(amountInMajorUnit) {
  if (typeof amountInMajorUnit !== 'number' || !isFinite(amountInMajorUnit)) {
    throw new Error(`toCents: expected a finite number, got ${typeof amountInMajorUnit === 'number' ? amountInMajorUnit : typeof amountInMajorUnit}`);
  }
  return Math.round(amountInMajorUnit * 100);
}

/**
 * @function fromCents
 * @description Convert integer cents (e.g., 1050) to a formatted decimal string ("10.50").
 * Returns a STRING with exactly 2 decimal places — NEVER a float.
 * Use this ONLY for display purposes. Never feed output back into calculations.
 * @pure true — no side effects, no I/O
 * @usedBy notification.service.js (formatting messages), API response serialization
 * @param {number} amountCents - Integer amount in cents/paise
 * @returns {string} Formatted decimal string with exactly 2 decimal places
 * @throws {Error} If input is not an integer
 * @example
 * fromCents(1050)   // Returns: "10.50"
 * fromCents(1)      // Returns: "0.01"
 * fromCents(0)      // Returns: "0.00"
 * fromCents(100000) // Returns: "1000.00"
 */
function fromCents(amountCents) {
  if (!Number.isInteger(amountCents)) {
    throw new Error(`fromCents: expected an integer, got ${amountCents}`);
  }
  return (amountCents / 100).toFixed(2);
}

/**
 * @function formatCurrency
 * @description Format integer cents as a localized currency display string.
 * Uses Intl.NumberFormat for proper locale-aware formatting.
 * Falls back to plain string if Intl formatting fails (e.g., unknown currency code).
 * @pure true — no side effects, no I/O
 * @usedBy notification.service.js (push notification text), activity.service.js (log messages)
 * @param {number} amountCents - Integer amount in cents/paise
 * @param {string} [currencyCode='INR'] - ISO 4217 currency code (e.g., 'USD', 'INR', 'EUR')
 * @param {string} [locale='en-IN'] - BCP 47 locale tag for formatting
 * @returns {string} Localized currency string (e.g., "₹850.00", "$10.50")
 * @throws {Error} If amountCents is not an integer
 * @example
 * formatCurrency(85000, 'INR', 'en-IN')  // Returns: "₹850.00"
 * formatCurrency(1050, 'USD', 'en-US')   // Returns: "$10.50"
 * formatCurrency(0, 'EUR', 'de-DE')      // Returns: "0,00 €"
 */
function formatCurrency(amountCents, currencyCode = 'INR', locale = 'en-IN') {
  if (!Number.isInteger(amountCents)) {
    throw new Error(`formatCurrency: expected an integer for amountCents, got ${amountCents}`);
  }

  const majorUnits = amountCents / 100;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(majorUnits);
  } catch {
    // Fallback for unsupported currency/locale combinations
    return `${currencyCode} ${majorUnits.toFixed(2)}`;
  }
}

/**
 * @function safeAdd
 * @description Safely add two integer cent amounts with overflow detection.
 * Both arguments MUST be integers. Throws on non-integer input or if
 * the result would exceed Number.MAX_SAFE_INTEGER.
 * @pure true — no side effects, no I/O
 * @usedBy splitCalculator.js (summing split amounts), balanceCalculator.js
 * @param {number} a - First amount in cents (integer)
 * @param {number} b - Second amount in cents (integer)
 * @returns {number} Sum in cents (integer)
 * @throws {Error} If either argument is not an integer
 * @throws {Error} If the result would overflow MAX_SAFE_INTEGER
 * @example
 * safeAdd(500, 300)   // Returns: 800
 * safeAdd(0, 1050)    // Returns: 1050
 * safeAdd(-500, 300)  // Returns: -200  (negative cents are valid for balances)
 */
function safeAdd(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new Error(`safeAdd: both arguments must be integers, got ${a} (${typeof a}) and ${b} (${typeof b})`);
  }
  const result = a + b;
  if (Math.abs(result) > MAX_SAFE_CENTS) {
    throw new Error(`safeAdd: result ${result} exceeds safe integer range`);
  }
  return result;
}

/**
 * @function safeSubtract
 * @description Safely subtract two integer cent amounts.
 * Both arguments MUST be integers. Throws on non-integer input.
 * @pure true — no side effects, no I/O
 * @usedBy balanceCalculator.js (net balance computation), payment.service.js (remaining debt)
 * @param {number} a - Amount to subtract from (cents, integer)
 * @param {number} b - Amount to subtract (cents, integer)
 * @returns {number} Difference in cents (a - b, integer)
 * @throws {Error} If either argument is not an integer
 * @throws {Error} If the result would overflow MAX_SAFE_INTEGER
 * @example
 * safeSubtract(1000, 400)  // Returns: 600
 * safeSubtract(400, 1000)  // Returns: -600  (debtor owes creditor)
 * safeSubtract(500, 0)     // Returns: 500
 */
function safeSubtract(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new Error(`safeSubtract: both arguments must be integers, got ${a} (${typeof a}) and ${b} (${typeof b})`);
  }
  const result = a - b;
  if (Math.abs(result) > MAX_SAFE_CENTS) {
    throw new Error(`safeSubtract: result ${result} exceeds safe integer range`);
  }
  return result;
}

/**
 * @function safeMultiply
 * @description Safely multiply an integer cent amount by a decimal factor.
 * Uses Math.round on the raw product to produce an integer result.
 * The cents argument MUST be an integer; the factor can be any finite number.
 * @pure true — no side effects, no I/O
 * @usedBy splitCalculator.js (percentage/shares split calculations)
 * @param {number} cents - Amount in cents (integer)
 * @param {number} factor - Multiplication factor (can be decimal, e.g., 0.3333)
 * @returns {number} Rounded integer result in cents
 * @throws {Error} If cents is not an integer
 * @throws {Error} If factor is not a finite number
 * @throws {Error} If the result would overflow MAX_SAFE_INTEGER
 * @example
 * safeMultiply(1000, 0.5)     // Returns: 500
 * safeMultiply(1000, 0.3333)  // Returns: 333
 * safeMultiply(100, 1.5)      // Returns: 150
 */
function safeMultiply(cents, factor) {
  if (!Number.isInteger(cents)) {
    throw new Error(`safeMultiply: cents must be an integer, got ${cents} (${typeof cents})`);
  }
  if (typeof factor !== 'number' || !isFinite(factor)) {
    throw new Error(`safeMultiply: factor must be a finite number, got ${factor} (${typeof factor})`);
  }
  const result = Math.round(cents * factor);
  if (Math.abs(result) > MAX_SAFE_CENTS) {
    throw new Error(`safeMultiply: result ${result} exceeds safe integer range`);
  }
  return result;
}

module.exports = {
  toCents,
  fromCents,
  formatCurrency,
  safeAdd,
  safeSubtract,
  safeMultiply,
  MAX_SAFE_CENTS,
};
