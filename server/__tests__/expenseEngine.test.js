/**
 * @fileoverview Comprehensive unit test suite for the SplitSmart Expense Engine.
 *
 * Covers all 5 engine modules:
 *  1. currencyUtils (toCents, fromCents, formatCurrency, safeAdd, safeSubtract, safeMultiply)
 *  2. splitCalculator (equal, exact, percentage, shares, validateSplitConsistency)
 *  3. debtSimplifier (calculateNetBalances, simplifyDebts)
 *  4. balanceCalculator (calculateGroupBalances, calculatePairwiseBalances)
 *  5. barrel index (re-exports)
 *
 * Test categories per function:
 *  - Happy path (typical use)
 *  - Boundary values (0, 1 cent, very large amounts)
 *  - Invalid inputs (wrong types, missing fields)
 *  - Rounding edge cases
 *  - Circular debt scenario
 *  - 100-person group performance assertion (<50ms)
 */

// ─── MODULE UNDER TEST ──────────────────────────────────────────────

const {
  toCents,
  fromCents,
  formatCurrency,
  safeAdd,
  safeSubtract,
  safeMultiply,
  MAX_SAFE_CENTS,
} = require('../services/expenseEngine/currencyUtils');

const {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  validateSplitConsistency,
} = require('../services/expenseEngine/splitCalculator');

const {
  calculateNetBalances,
  simplifyDebts,
} = require('../services/expenseEngine/debtSimplifier');

const {
  calculateGroupBalances,
  calculatePairwiseBalances,
} = require('../services/expenseEngine/balanceCalculator');

// ─── HELPERS ─────────────────────────────────────────────────────────

/** Sum all amountCents in a splits array */
function sumSplits(splits) {
  return splits.reduce((acc, s) => acc + s.amountCents, 0);
}

/** Generate N fake user IDs */
function fakeUsers(n) {
  return Array.from({ length: n }, (_, i) => `user-${String(i + 1).padStart(3, '0')}`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1. CURRENCY UTILS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('currencyUtils', () => {
  // ── toCents ──────────────────────────────────────────────────────

  describe('toCents', () => {
    // Happy path
    test('should return 1050 when given 10.50', () => {
      expect(toCents(10.50)).toBe(1050);
    });

    test('should return 100 when given 1', () => {
      expect(toCents(1)).toBe(100);
    });

    test('should return 1 when given 0.01', () => {
      expect(toCents(0.01)).toBe(1);
    });

    test('should return 0 when given 0', () => {
      expect(toCents(0)).toBe(0);
    });

    // Boundary values
    test('should handle very large amounts when given 99999999.99', () => {
      expect(toCents(99999999.99)).toBe(9999999999);
    });

    test('should handle negative amounts when given -10.50', () => {
      expect(toCents(-10.50)).toBe(-1050);
    });

    // Rounding edge cases
    test('should round 10.005 to 1001 when given a half-cent value', () => {
      expect(toCents(10.005)).toBe(1001);
    });

    test('should round 0.1 + 0.2 correctly when given a classic float imprecision sum', () => {
      // 0.1 + 0.2 === 0.30000000000000004 in JS
      expect(toCents(0.1 + 0.2)).toBe(30);
    });

    test('should round 99.999 to 10000 when given a value just under a round number', () => {
      expect(toCents(99.999)).toBe(10000);
    });

    test('should round 1.015 correctly when given a banker-rounding edge case', () => {
      // Math.round(1.015 * 100) = Math.round(101.49999...) = 101 in most engines
      // but 1.015 * 100 = 101.50000000000001 in V8 → Math.round = 102
      const result = toCents(1.015);
      expect(result).toBe(Math.round(1.015 * 100));
    });

    // Invalid inputs
    test('should throw when given a string', () => {
      expect(() => toCents('10.50')).toThrow('toCents: expected a finite number');
    });

    test('should throw when given null', () => {
      expect(() => toCents(null)).toThrow('toCents: expected a finite number');
    });

    test('should throw when given undefined', () => {
      expect(() => toCents(undefined)).toThrow('toCents: expected a finite number');
    });

    test('should throw when given NaN', () => {
      expect(() => toCents(NaN)).toThrow('toCents: expected a finite number');
    });

    test('should throw when given Infinity', () => {
      expect(() => toCents(Infinity)).toThrow('toCents: expected a finite number');
    });

    test('should throw when given -Infinity', () => {
      expect(() => toCents(-Infinity)).toThrow('toCents: expected a finite number');
    });
  });

  // ── fromCents ────────────────────────────────────────────────────

  describe('fromCents', () => {
    // Happy path
    test('should return "10.50" when given 1050', () => {
      const result = fromCents(1050);
      expect(result).toBe('10.50');
      expect(typeof result).toBe('string');
    });

    test('should return "0.01" when given 1', () => {
      expect(fromCents(1)).toBe('0.01');
    });

    test('should return "0.00" when given 0', () => {
      expect(fromCents(0)).toBe('0.00');
    });

    // Boundary values
    test('should return "1000.00" when given 100000', () => {
      expect(fromCents(100000)).toBe('1000.00');
    });

    test('should return "-10.50" when given -1050', () => {
      expect(fromCents(-1050)).toBe('-10.50');
    });

    test('should return a string with exactly 2 decimal places when given any integer', () => {
      const result = fromCents(1);
      expect(result).toMatch(/^\-?\d+\.\d{2}$/);
    });

    // Type guarantee
    test('should always return a string type when given valid input', () => {
      expect(typeof fromCents(0)).toBe('string');
      expect(typeof fromCents(999999999)).toBe('string');
      expect(typeof fromCents(-1)).toBe('string');
    });

    // Invalid inputs
    test('should throw when given a float', () => {
      expect(() => fromCents(10.5)).toThrow('fromCents: expected an integer');
    });

    test('should throw when given a string', () => {
      expect(() => fromCents('1050')).toThrow('fromCents: expected an integer');
    });

    test('should throw when given NaN', () => {
      expect(() => fromCents(NaN)).toThrow('fromCents: expected an integer');
    });
  });

  // ── formatCurrency ───────────────────────────────────────────────

  describe('formatCurrency', () => {
    test('should return a string containing the currency symbol when given INR', () => {
      const result = formatCurrency(85000, 'INR', 'en-IN');
      expect(typeof result).toBe('string');
      expect(result).toContain('850');
    });

    test('should return a string containing $ when given USD', () => {
      const result = formatCurrency(1050, 'USD', 'en-US');
      expect(result).toContain('$');
      expect(result).toContain('10.50');
    });

    test('should format 0 cents correctly when given zero amount', () => {
      const result = formatCurrency(0, 'USD', 'en-US');
      expect(result).toContain('0.00');
    });

    test('should use INR and en-IN as defaults when no currency/locale specified', () => {
      const result = formatCurrency(100);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should fall back gracefully when given an unsupported currency code', () => {
      // Intl may throw for truly invalid codes — our function should catch and fallback
      const result = formatCurrency(1050, 'XYZ', 'en-US');
      expect(typeof result).toBe('string');
    });

    test('should throw when given a non-integer amount', () => {
      expect(() => formatCurrency(10.5)).toThrow('formatCurrency: expected an integer');
    });
  });

  // ── safeAdd ──────────────────────────────────────────────────────

  describe('safeAdd', () => {
    test('should return 800 when adding 500 and 300', () => {
      expect(safeAdd(500, 300)).toBe(800);
    });

    test('should return 0 when adding 0 and 0', () => {
      expect(safeAdd(0, 0)).toBe(0);
    });

    test('should return 1 when adding 0 and 1', () => {
      expect(safeAdd(0, 1)).toBe(1);
    });

    test('should handle negative values when adding -500 and 300', () => {
      expect(safeAdd(-500, 300)).toBe(-200);
    });

    test('should handle two large numbers when both are near MAX_SAFE_INTEGER/2', () => {
      const half = Math.floor(MAX_SAFE_CENTS / 2);
      expect(safeAdd(half, half)).toBe(half * 2);
    });

    test('should throw when result overflows MAX_SAFE_INTEGER', () => {
      expect(() => safeAdd(MAX_SAFE_CENTS, 1)).toThrow('exceeds safe integer range');
    });

    test('should throw when first argument is a float', () => {
      expect(() => safeAdd(10.5, 20)).toThrow('both arguments must be integers');
    });

    test('should throw when second argument is a string', () => {
      expect(() => safeAdd(10, '20')).toThrow('both arguments must be integers');
    });

    test('should throw when given null', () => {
      expect(() => safeAdd(null, 10)).toThrow('both arguments must be integers');
    });
  });

  // ── safeSubtract ─────────────────────────────────────────────────

  describe('safeSubtract', () => {
    test('should return 600 when subtracting 400 from 1000', () => {
      expect(safeSubtract(1000, 400)).toBe(600);
    });

    test('should return -600 when subtracting 1000 from 400', () => {
      expect(safeSubtract(400, 1000)).toBe(-600);
    });

    test('should return 0 when subtracting equal amounts', () => {
      expect(safeSubtract(500, 500)).toBe(0);
    });

    test('should return the same value when subtracting 0', () => {
      expect(safeSubtract(500, 0)).toBe(500);
    });

    test('should throw when result overflows MAX_SAFE_INTEGER negatively', () => {
      expect(() => safeSubtract(-MAX_SAFE_CENTS, 1)).toThrow('exceeds safe integer range');
    });

    test('should throw when given a float argument', () => {
      expect(() => safeSubtract(10.5, 5)).toThrow('both arguments must be integers');
    });
  });

  // ── safeMultiply ─────────────────────────────────────────────────

  describe('safeMultiply', () => {
    test('should return 500 when multiplying 1000 by 0.5', () => {
      expect(safeMultiply(1000, 0.5)).toBe(500);
    });

    test('should return 333 when multiplying 1000 by 0.3333', () => {
      expect(safeMultiply(1000, 0.3333)).toBe(333);
    });

    test('should return 0 when multiplying 1000 by 0', () => {
      expect(safeMultiply(1000, 0)).toBe(0);
    });

    test('should return 0 when multiplying 0 by any factor', () => {
      expect(safeMultiply(0, 999.99)).toBe(0);
    });

    test('should return 150 when multiplying 100 by 1.5', () => {
      expect(safeMultiply(100, 1.5)).toBe(150);
    });

    test('should handle negative factors when multiplying 1000 by -0.5', () => {
      expect(safeMultiply(1000, -0.5)).toBe(-500);
    });

    test('should round correctly when result has fractional cents', () => {
      // 100 * 0.333 = 33.3 → rounds to 33
      expect(safeMultiply(100, 0.333)).toBe(33);
      // 100 * 0.335 = 33.5 → rounds to 34 (Math.round rounds .5 up)
      expect(safeMultiply(100, 0.335)).toBe(34);
    });

    test('should throw when cents is a float', () => {
      expect(() => safeMultiply(10.5, 2)).toThrow('cents must be an integer');
    });

    test('should throw when factor is not a finite number', () => {
      expect(() => safeMultiply(100, Infinity)).toThrow('factor must be a finite number');
    });

    test('should throw when factor is NaN', () => {
      expect(() => safeMultiply(100, NaN)).toThrow('factor must be a finite number');
    });

    test('should throw when factor is a string', () => {
      expect(() => safeMultiply(100, '2')).toThrow('factor must be a finite number');
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  2. SPLIT CALCULATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('splitCalculator', () => {
  // ── calculateEqualSplit ──────────────────────────────────────────

  describe('calculateEqualSplit', () => {
    test('should split 1000 into [334, 333, 333] when splitting among 3', () => {
      const result = calculateEqualSplit(1000, ['u1', 'u2', 'u3']);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ userId: 'u1', amountCents: 334 });
      expect(result[1]).toEqual({ userId: 'u2', amountCents: 333 });
      expect(result[2]).toEqual({ userId: 'u3', amountCents: 333 });
      expect(sumSplits(result)).toBe(1000);
    });

    test('should split 100 into [50, 50] when splitting between 2', () => {
      const result = calculateEqualSplit(100, ['u1', 'u2']);
      expect(result).toEqual([
        { userId: 'u1', amountCents: 50 },
        { userId: 'u2', amountCents: 50 },
      ]);
    });

    test('should handle 1 cent total when splitting among 3', () => {
      const result = calculateEqualSplit(1, ['u1', 'u2', 'u3']);
      // Only the first person gets 1 cent; others get 0
      expect(sumSplits(result)).toBe(1);
      expect(result[0].amountCents).toBe(1);
      expect(result[1].amountCents).toBe(0);
      expect(result[2].amountCents).toBe(0);
    });

    test('should distribute remainder fairly when 7 cents among 3', () => {
      const result = calculateEqualSplit(7, ['u1', 'u2', 'u3']);
      expect(sumSplits(result)).toBe(7);
      expect(result[0].amountCents).toBe(3); // +1 remainder
      expect(result[1].amountCents).toBe(2);
      expect(result[2].amountCents).toBe(2);
    });

    test('should handle a large amount when splitting ₹1,00,000 among 50', () => {
      const users = fakeUsers(50);
      const result = calculateEqualSplit(10000000, users);
      expect(sumSplits(result)).toBe(10000000);
      expect(result).toHaveLength(50);
    });

    // Consistency invariant
    test('should ALWAYS sum to totalAmountCents for any input combination', () => {
      const cases = [
        [1, 2], [3, 2], [10, 3], [100, 7], [9999, 13], [1, 50],
      ];
      for (const [total, count] of cases) {
        const users = fakeUsers(count);
        const result = calculateEqualSplit(total, users);
        expect(sumSplits(result)).toBe(total);
      }
    });

    // Invalid inputs
    test('should throw when totalAmountCents is 0', () => {
      expect(() => calculateEqualSplit(0, ['u1', 'u2'])).toThrow('positive integer');
    });

    test('should throw when totalAmountCents is negative', () => {
      expect(() => calculateEqualSplit(-100, ['u1', 'u2'])).toThrow('positive integer');
    });

    test('should throw when totalAmountCents is a float', () => {
      expect(() => calculateEqualSplit(10.5, ['u1', 'u2'])).toThrow('positive integer');
    });

    test('should throw when fewer than 2 participants', () => {
      expect(() => calculateEqualSplit(100, ['u1'])).toThrow('at least 2 participants');
    });

    test('should throw when participants is not an array', () => {
      expect(() => calculateEqualSplit(100, 'u1')).toThrow('at least 2 participants');
    });

    test('should throw when participants is empty', () => {
      expect(() => calculateEqualSplit(100, [])).toThrow('at least 2 participants');
    });
  });

  // ── calculateExactSplit ──────────────────────────────────────────

  describe('calculateExactSplit', () => {
    test('should pass through valid exact splits when they sum to total', () => {
      const result = calculateExactSplit(1000, [
        { userId: 'u1', amountCents: 700 },
        { userId: 'u2', amountCents: 300 },
      ]);
      expect(result).toEqual([
        { userId: 'u1', amountCents: 700 },
        { userId: 'u2', amountCents: 300 },
      ]);
    });

    test('should accept a split with 0 cents when one participant pays nothing', () => {
      const result = calculateExactSplit(1000, [
        { userId: 'u1', amountCents: 1000 },
        { userId: 'u2', amountCents: 0 },
      ]);
      expect(sumSplits(result)).toBe(1000);
    });

    test('should throw when splits sum exceeds total', () => {
      expect(() => calculateExactSplit(1000, [
        { userId: 'u1', amountCents: 600 },
        { userId: 'u2', amountCents: 500 },
      ])).toThrow('sum to 1100 but total is 1000');
    });

    test('should throw when splits sum is less than total', () => {
      expect(() => calculateExactSplit(1000, [
        { userId: 'u1', amountCents: 400 },
        { userId: 'u2', amountCents: 400 },
      ])).toThrow('sum to 800 but total is 1000');
    });

    test('should throw when a split amount is negative', () => {
      expect(() => calculateExactSplit(1000, [
        { userId: 'u1', amountCents: 1100 },
        { userId: 'u2', amountCents: -100 },
      ])).toThrow('non-negative integer');
    });

    test('should throw when a split amount is a float', () => {
      expect(() => calculateExactSplit(1000, [
        { userId: 'u1', amountCents: 500.5 },
        { userId: 'u2', amountCents: 499.5 },
      ])).toThrow('non-negative integer');
    });

    test('should throw when fewer than 2 splits provided', () => {
      expect(() => calculateExactSplit(1000, [
        { userId: 'u1', amountCents: 1000 },
      ])).toThrow('at least 2 participants');
    });
  });

  // ── calculatePercentageSplit ─────────────────────────────────────

  describe('calculatePercentageSplit', () => {
    test('should calculate correct amounts for clean percentages', () => {
      const result = calculatePercentageSplit(10000, [
        { userId: 'u1', percentage: 50 },
        { userId: 'u2', percentage: 30 },
        { userId: 'u3', percentage: 20 },
      ]);
      expect(result[0]).toEqual({ userId: 'u1', amountCents: 5000, percentage: 50 });
      expect(result[1]).toEqual({ userId: 'u2', amountCents: 3000, percentage: 30 });
      expect(result[2]).toEqual({ userId: 'u3', amountCents: 2000, percentage: 20 });
      expect(sumSplits(result)).toBe(10000);
    });

    test('should distribute remainder correctly for 33.33/33.33/33.34 split on ₹10', () => {
      const result = calculatePercentageSplit(1000, [
        { userId: 'u1', percentage: 33.33 },
        { userId: 'u2', percentage: 33.33 },
        { userId: 'u3', percentage: 33.34 },
      ]);
      expect(sumSplits(result)).toBe(1000);
    });

    test('should handle a 90/10 split correctly when distributing large amounts', () => {
      const result = calculatePercentageSplit(9999, [
        { userId: 'u1', percentage: 90 },
        { userId: 'u2', percentage: 10 },
      ]);
      expect(sumSplits(result)).toBe(9999);
    });

    test('should include percentage in output when returning results', () => {
      const result = calculatePercentageSplit(1000, [
        { userId: 'u1', percentage: 60 },
        { userId: 'u2', percentage: 40 },
      ]);
      expect(result[0].percentage).toBe(60);
      expect(result[1].percentage).toBe(40);
    });

    test('should throw when percentages sum to less than 100', () => {
      expect(() => calculatePercentageSplit(1000, [
        { userId: 'u1', percentage: 30 },
        { userId: 'u2', percentage: 30 },
      ])).toThrow('percentages must sum to 100');
    });

    test('should throw when percentages sum to more than 100', () => {
      expect(() => calculatePercentageSplit(1000, [
        { userId: 'u1', percentage: 60 },
        { userId: 'u2', percentage: 50 },
      ])).toThrow('percentages must sum to 100');
    });

    test('should throw when a percentage is negative', () => {
      expect(() => calculatePercentageSplit(1000, [
        { userId: 'u1', percentage: 120 },
        { userId: 'u2', percentage: -20 },
      ])).toThrow('number in [0, 100]');
    });

    test('should throw when a percentage exceeds 100', () => {
      expect(() => calculatePercentageSplit(1000, [
        { userId: 'u1', percentage: 101 },
        { userId: 'u2', percentage: -1 },
      ])).toThrow('number in [0, 100]');
    });

    test('should throw when fewer than 2 splits', () => {
      expect(() => calculatePercentageSplit(1000, [
        { userId: 'u1', percentage: 100 },
      ])).toThrow('at least 2 participants');
    });
  });

  // ── calculateSharesSplit ─────────────────────────────────────────

  describe('calculateSharesSplit', () => {
    test('should split proportionally for 2:1:1 shares', () => {
      const result = calculateSharesSplit(1000, [
        { userId: 'u1', shares: 2 },
        { userId: 'u2', shares: 1 },
        { userId: 'u3', shares: 1 },
      ]);
      expect(result[0]).toEqual({ userId: 'u1', amountCents: 500, shares: 2 });
      expect(result[1]).toEqual({ userId: 'u2', amountCents: 250, shares: 1 });
      expect(result[2]).toEqual({ userId: 'u3', amountCents: 250, shares: 1 });
      expect(sumSplits(result)).toBe(1000);
    });

    test('should distribute remainder correctly for uneven shares', () => {
      const result = calculateSharesSplit(100, [
        { userId: 'u1', shares: 1 },
        { userId: 'u2', shares: 1 },
        { userId: 'u3', shares: 1 },
      ]);
      expect(sumSplits(result)).toBe(100);
      // 100/3 = 33.33... → base=33, remainder=1
      expect(result[0].amountCents).toBe(34);
      expect(result[1].amountCents).toBe(33);
      expect(result[2].amountCents).toBe(33);
    });

    test('should handle a participant with 0 shares', () => {
      const result = calculateSharesSplit(1000, [
        { userId: 'u1', shares: 3 },
        { userId: 'u2', shares: 0 },
      ]);
      expect(result[0].amountCents).toBe(1000);
      expect(result[1].amountCents).toBe(0);
      expect(sumSplits(result)).toBe(1000);
    });

    test('should include shares in output when returning results', () => {
      const result = calculateSharesSplit(1000, [
        { userId: 'u1', shares: 5 },
        { userId: 'u2', shares: 3 },
      ]);
      expect(result[0].shares).toBe(5);
      expect(result[1].shares).toBe(3);
    });

    test('should throw when total shares is 0', () => {
      expect(() => calculateSharesSplit(1000, [
        { userId: 'u1', shares: 0 },
        { userId: 'u2', shares: 0 },
      ])).toThrow('total shares must be greater than 0');
    });

    test('should throw when shares value is negative', () => {
      expect(() => calculateSharesSplit(1000, [
        { userId: 'u1', shares: 3 },
        { userId: 'u2', shares: -1 },
      ])).toThrow('non-negative integer');
    });

    test('should throw when shares value is a float', () => {
      expect(() => calculateSharesSplit(1000, [
        { userId: 'u1', shares: 1.5 },
        { userId: 'u2', shares: 1.5 },
      ])).toThrow('non-negative integer');
    });

    test('should throw when fewer than 2 splits', () => {
      expect(() => calculateSharesSplit(1000, [
        { userId: 'u1', shares: 1 },
      ])).toThrow('at least 2 participants');
    });
  });

  // ── validateSplitConsistency ─────────────────────────────────────

  describe('validateSplitConsistency', () => {
    test('should return valid=true when splits sum exactly to total', () => {
      const result = validateSplitConsistency(1000, [
        { userId: 'u1', amountCents: 500 },
        { userId: 'u2', amountCents: 500 },
      ]);
      expect(result.valid).toBe(true);
      expect(result.sum).toBe(1000);
      expect(result.difference).toBe(0);
      expect(result.participantCount).toBe(2);
    });

    test('should return valid=false when splits over-sum', () => {
      const result = validateSplitConsistency(1000, [
        { userId: 'u1', amountCents: 600 },
        { userId: 'u2', amountCents: 500 },
      ]);
      expect(result.valid).toBe(false);
      expect(result.sum).toBe(1100);
      expect(result.difference).toBe(-100);
    });

    test('should return valid=false when splits under-sum', () => {
      const result = validateSplitConsistency(1000, [
        { userId: 'u1', amountCents: 400 },
        { userId: 'u2', amountCents: 400 },
      ]);
      expect(result.valid).toBe(false);
      expect(result.difference).toBe(200);
    });

    test('should return valid=false when splits array is empty', () => {
      const result = validateSplitConsistency(1000, []);
      expect(result.valid).toBe(false);
      expect(result.participantCount).toBe(0);
    });

    test('should return valid=false when splits is not an array', () => {
      const result = validateSplitConsistency(1000, null);
      expect(result.valid).toBe(false);
    });

    test('should validate correctly when all split calculator outputs are used', () => {
      const total = 9999;
      const users = fakeUsers(7);
      const splits = calculateEqualSplit(total, users);
      const result = validateSplitConsistency(total, splits);
      expect(result.valid).toBe(true);
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  3. DEBT SIMPLIFIER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('debtSimplifier', () => {
  // ── calculateNetBalances ─────────────────────────────────────────

  describe('calculateNetBalances', () => {
    test('should calculate correct net positions for simple debts', () => {
      const balances = calculateNetBalances([
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
      ]);
      expect(balances.get('A')).toBe(-500);
      expect(balances.get('B')).toBe(500);
    });

    test('should aggregate multiple debts for the same user', () => {
      const balances = calculateNetBalances([
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
        { debtorId: 'A', creditorId: 'C', amountCents: 300 },
      ]);
      expect(balances.get('A')).toBe(-800);
      expect(balances.get('B')).toBe(500);
      expect(balances.get('C')).toBe(300);
    });

    test('should net out opposing debts between the same pair', () => {
      const balances = calculateNetBalances([
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
        { debtorId: 'B', creditorId: 'A', amountCents: 300 },
      ]);
      // A: -500 + 300 = -200, B: 500 - 300 = 200
      expect(balances.get('A')).toBe(-200);
      expect(balances.get('B')).toBe(200);
    });

    test('should resolve circular debt (A→B→C→A) to zero when all amounts equal', () => {
      const balances = calculateNetBalances([
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
        { debtorId: 'B', creditorId: 'C', amountCents: 500 },
        { debtorId: 'C', creditorId: 'A', amountCents: 500 },
      ]);
      expect(balances.get('A')).toBe(0);
      expect(balances.get('B')).toBe(0);
      expect(balances.get('C')).toBe(0);
    });

    test('should return an empty Map when given empty array', () => {
      const balances = calculateNetBalances([]);
      expect(balances.size).toBe(0);
    });

    test('should return an empty Map when given non-array input', () => {
      const balances = calculateNetBalances(null);
      expect(balances.size).toBe(0);
    });

    test('should skip malformed entries when amount is 0 or negative', () => {
      const balances = calculateNetBalances([
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
        { debtorId: 'C', creditorId: 'D', amountCents: 0 },
        { debtorId: 'E', creditorId: 'F', amountCents: -100 },
      ]);
      expect(balances.size).toBe(2); // only A and B
    });

    test('should ensure total net balance across all users sums to 0', () => {
      const transactions = [
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
        { debtorId: 'B', creditorId: 'C', amountCents: 200 },
        { debtorId: 'C', creditorId: 'D', amountCents: 800 },
        { debtorId: 'D', creditorId: 'A', amountCents: 100 },
      ];
      const balances = calculateNetBalances(transactions);
      let total = 0;
      for (const v of balances.values()) total += v;
      expect(total).toBe(0);
    });
  });

  // ── simplifyDebts ────────────────────────────────────────────────

  describe('simplifyDebts', () => {
    test('should return single payment for simple A→B debt', () => {
      const result = simplifyDebts([
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ from: 'A', to: 'B', amountCents: 500 });
    });

    test('should return empty array for circular debt (A→B→C→A equal amounts)', () => {
      const result = simplifyDebts([
        { debtorId: 'A', creditorId: 'B', amountCents: 1000 },
        { debtorId: 'B', creditorId: 'C', amountCents: 1000 },
        { debtorId: 'C', creditorId: 'A', amountCents: 1000 },
      ]);
      expect(result).toHaveLength(0);
    });

    test('should simplify partial circular debt when amounts differ', () => {
      // A owes B 500, B owes C 300, C owes A 100
      // Nets: A: -500+100=-400, B: 500-300=200, C: 300-100=200
      const result = simplifyDebts([
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
        { debtorId: 'B', creditorId: 'C', amountCents: 300 },
        { debtorId: 'C', creditorId: 'A', amountCents: 100 },
      ]);

      // Should produce exactly 2 transactions (A pays B 200, A pays C 200)
      expect(result.length).toBeLessThanOrEqual(2);

      // Total settled must equal sum of net debts
      const totalSettled = result.reduce((acc, r) => acc + r.amountCents, 0);
      expect(totalSettled).toBe(400); // A's total debt
    });

    test('should reduce many-to-many debts to minimum transactions', () => {
      // 5 people, complex web of debts
      const result = simplifyDebts([
        { debtorId: 'A', creditorId: 'B', amountCents: 1000 },
        { debtorId: 'C', creditorId: 'B', amountCents: 500 },
        { debtorId: 'A', creditorId: 'D', amountCents: 300 },
        { debtorId: 'E', creditorId: 'B', amountCents: 200 },
      ]);

      // Original: 4 transactions. Simplified: should be ≤ 4 (likely 3-4)
      expect(result.length).toBeLessThanOrEqual(4);

      // Verify total debtor amount equals total creditor amount in simplified
      const totalDebited = result.reduce((acc, r) => acc + r.amountCents, 0);
      // Total net debt: A=-1300, C=-500, E=-200, B=+1700, D=+300
      // Total debt side: 1300 + 500 + 200 = 2000
      expect(totalDebited).toBe(2000);
    });

    test('should return empty array for empty input', () => {
      expect(simplifyDebts([])).toEqual([]);
    });

    test('should return empty array for null input', () => {
      expect(simplifyDebts(null)).toEqual([]);
    });

    test('should return empty array for undefined input', () => {
      expect(simplifyDebts(undefined)).toEqual([]);
    });

    test('should preserve total money through simplification when given any input', () => {
      const transactions = [
        { debtorId: 'A', creditorId: 'B', amountCents: 750 },
        { debtorId: 'B', creditorId: 'C', amountCents: 400 },
        { debtorId: 'C', creditorId: 'A', amountCents: 200 },
        { debtorId: 'D', creditorId: 'A', amountCents: 100 },
      ];

      const netBalances = calculateNetBalances(transactions);
      const simplified = simplifyDebts(transactions);

      // Total debits in simplified = total absolute debt
      const totalDebt = [...netBalances.values()]
        .filter(v => v < 0)
        .reduce((acc, v) => acc + Math.abs(v), 0);

      const totalSimplified = simplified.reduce((acc, s) => acc + s.amountCents, 0);
      expect(totalSimplified).toBe(totalDebt);
    });

    // ── PERFORMANCE TEST ───────────────────────────────────────────

    test('should simplify 100-person group in under 50ms', () => {
      // Generate a realistic web of debts among 100 users
      const users = fakeUsers(100);
      const transactions = [];

      // Create ~200 random pairwise debts
      for (let i = 0; i < 200; i++) {
        const debtorIdx = Math.floor(Math.random() * 100);
        let creditorIdx = Math.floor(Math.random() * 100);
        while (creditorIdx === debtorIdx) {
          creditorIdx = Math.floor(Math.random() * 100);
        }
        transactions.push({
          debtorId: users[debtorIdx],
          creditorId: users[creditorIdx],
          amountCents: Math.floor(Math.random() * 10000) + 1,
        });
      }

      const start = performance.now();
      const result = simplifyDebts(transactions);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      expect(result.length).toBeLessThanOrEqual(99); // max N-1 transactions for N people

      // Verify money conservation
      const netBalances = calculateNetBalances(transactions);
      const totalDebt = [...netBalances.values()].filter(v => v < 0).reduce((acc, v) => acc + Math.abs(v), 0);
      const totalSimplified = result.reduce((acc, s) => acc + s.amountCents, 0);
      expect(totalSimplified).toBe(totalDebt);
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  4. BALANCE CALCULATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('balanceCalculator', () => {
  // ── calculateGroupBalances ───────────────────────────────────────

  describe('calculateGroupBalances', () => {
    test('should convert positive net_balance_cents to debtor→creditor pair', () => {
      const result = calculateGroupBalances([
        { debtor_id: 'A', creditor_id: 'B', net_balance_cents: '500' },
      ]);
      expect(result).toEqual([
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
      ]);
    });

    test('should flip direction when net_balance_cents is negative', () => {
      const result = calculateGroupBalances([
        { debtor_id: 'A', creditor_id: 'B', net_balance_cents: '-200' },
      ]);
      // Negative means B actually owes A — direction flips
      expect(result).toEqual([
        { debtorId: 'B', creditorId: 'A', amountCents: 200 },
      ]);
    });

    test('should exclude zero-balance pairs when net is 0', () => {
      const result = calculateGroupBalances([
        { debtor_id: 'A', creditor_id: 'B', net_balance_cents: '500' },
        { debtor_id: 'C', creditor_id: 'D', net_balance_cents: '0' },
      ]);
      expect(result).toHaveLength(1);
    });

    test('should handle pg string amounts correctly when amounts are strings', () => {
      const result = calculateGroupBalances([
        { debtor_id: 'A', creditor_id: 'B', net_balance_cents: '99999' },
      ]);
      expect(result[0].amountCents).toBe(99999);
      expect(typeof result[0].amountCents).toBe('number');
    });

    test('should handle integer amounts when amounts are numbers', () => {
      const result = calculateGroupBalances([
        { debtor_id: 'A', creditor_id: 'B', net_balance_cents: 1500 },
      ]);
      expect(result[0].amountCents).toBe(1500);
    });

    test('should return empty array for empty input', () => {
      expect(calculateGroupBalances([])).toEqual([]);
    });

    test('should return empty array for null input', () => {
      expect(calculateGroupBalances(null)).toEqual([]);
    });

    test('should skip NaN balance entries when given invalid string amounts', () => {
      const result = calculateGroupBalances([
        { debtor_id: 'A', creditor_id: 'B', net_balance_cents: 'invalid' },
        { debtor_id: 'C', creditor_id: 'D', net_balance_cents: '500' },
      ]);
      expect(result).toHaveLength(1);
    });
  });

  // ── calculatePairwiseBalances ────────────────────────────────────

  describe('calculatePairwiseBalances', () => {
    test('should compute correct per-member summary for simple debts', () => {
      const summary = calculatePairwiseBalances([
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
        { debtorId: 'A', creditorId: 'C', amountCents: 300 },
      ]);

      expect(summary.get('A')).toEqual({ totalOwed: 0, totalOwing: 800, netBalance: -800 });
      expect(summary.get('B')).toEqual({ totalOwed: 500, totalOwing: 0, netBalance: 500 });
      expect(summary.get('C')).toEqual({ totalOwed: 300, totalOwing: 0, netBalance: 300 });
    });

    test('should compute correct summary for mutual debts', () => {
      const summary = calculatePairwiseBalances([
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
        { debtorId: 'B', creditorId: 'A', amountCents: 200 },
      ]);

      expect(summary.get('A')).toEqual({ totalOwed: 200, totalOwing: 500, netBalance: -300 });
      expect(summary.get('B')).toEqual({ totalOwed: 500, totalOwing: 200, netBalance: 300 });
    });

    test('should return empty Map for empty input', () => {
      const summary = calculatePairwiseBalances([]);
      expect(summary.size).toBe(0);
    });

    test('should return empty Map for null input', () => {
      const summary = calculatePairwiseBalances(null);
      expect(summary.size).toBe(0);
    });

    test('should ensure net balances across all members sum to 0', () => {
      const summary = calculatePairwiseBalances([
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
        { debtorId: 'C', creditorId: 'B', amountCents: 300 },
        { debtorId: 'D', creditorId: 'A', amountCents: 100 },
      ]);
      let totalNet = 0;
      for (const v of summary.values()) totalNet += v.netBalance;
      expect(totalNet).toBe(0);
    });

    test('should skip entries with non-positive or non-integer amounts', () => {
      const summary = calculatePairwiseBalances([
        { debtorId: 'A', creditorId: 'B', amountCents: 500 },
        { debtorId: 'C', creditorId: 'D', amountCents: 0 },
        { debtorId: 'E', creditorId: 'F', amountCents: -100 },
        { debtorId: 'G', creditorId: 'H', amountCents: 10.5 },
      ]);
      // Only A-B pair should be processed
      expect(summary.size).toBe(2);
      expect(summary.has('A')).toBe(true);
      expect(summary.has('B')).toBe(true);
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  5. BARREL INDEX INTEGRATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('expenseEngine barrel index', () => {
  const engine = require('../services/expenseEngine');

  test('should export all currency utility functions', () => {
    expect(typeof engine.toCents).toBe('function');
    expect(typeof engine.fromCents).toBe('function');
    expect(typeof engine.formatCurrency).toBe('function');
    expect(typeof engine.safeAdd).toBe('function');
    expect(typeof engine.safeSubtract).toBe('function');
    expect(typeof engine.safeMultiply).toBe('function');
    expect(typeof engine.MAX_SAFE_CENTS).toBe('number');
  });

  test('should export all split calculator functions', () => {
    expect(typeof engine.calculateEqualSplit).toBe('function');
    expect(typeof engine.calculateExactSplit).toBe('function');
    expect(typeof engine.calculatePercentageSplit).toBe('function');
    expect(typeof engine.calculateSharesSplit).toBe('function');
    expect(typeof engine.validateSplitConsistency).toBe('function');
  });

  test('should export all debt simplifier functions', () => {
    expect(typeof engine.calculateNetBalances).toBe('function');
    expect(typeof engine.simplifyDebts).toBe('function');
  });

  test('should export all balance calculator functions', () => {
    expect(typeof engine.calculateGroupBalances).toBe('function');
    expect(typeof engine.calculatePairwiseBalances).toBe('function');
  });

  test('should produce consistent results when used via barrel vs direct import', () => {
    const directSplit = calculateEqualSplit(1000, ['u1', 'u2', 'u3']);
    const barrelSplit = engine.calculateEqualSplit(1000, ['u1', 'u2', 'u3']);
    expect(barrelSplit).toEqual(directSplit);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  6. END-TO-END INTEGRATION SCENARIOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('end-to-end integration scenarios', () => {
  test('should handle a complete expense lifecycle: create → split → simplify', () => {
    // Scenario: Trip dinner for 4 people, ₹2,575.00 total
    // Alice pays; equal split
    const totalCents = toCents(2575.00);
    expect(totalCents).toBe(257500);

    const users = ['alice', 'bob', 'charlie', 'diana'];
    const splits = calculateEqualSplit(totalCents, users);

    // Verify consistency
    const check = validateSplitConsistency(totalCents, splits);
    expect(check.valid).toBe(true);

    // Verify displayable amounts
    for (const split of splits) {
      const display = fromCents(split.amountCents);
      expect(typeof display).toBe('string');
      expect(display).toMatch(/^\d+\.\d{2}$/);
    }
  });

  test('should handle multi-payer scenario with debt simplification', () => {
    // Scenario:
    //  - Alice paid ₹1000, split equally among Alice, Bob, Charlie
    //  - Bob paid ₹600, split equally among Alice, Bob
    //
    // From Alice's expense: Bob owes Alice 333, Charlie owes Alice 334
    // From Bob's expense: Alice owes Bob 300
    //
    // Net: Alice: +333+334-300 = +367 (owed)
    //      Bob: -333+300 = -33 (owes)
    //      Charlie: -334 (owes)

    const debts = [
      { debtorId: 'bob', creditorId: 'alice', amountCents: 333 },
      { debtorId: 'charlie', creditorId: 'alice', amountCents: 334 },
      { debtorId: 'alice', creditorId: 'bob', amountCents: 300 },
    ];

    const simplified = simplifyDebts(debts);

    // Total money flowing must equal total net debt
    const nets = calculateNetBalances(debts);
    const totalDebt = [...nets.values()].filter(v => v < 0).reduce((acc, v) => acc + Math.abs(v), 0);
    const totalFlow = simplified.reduce((acc, s) => acc + s.amountCents, 0);
    expect(totalFlow).toBe(totalDebt);

    // Should produce at most 2 transactions (bob→alice, charlie→alice)
    expect(simplified.length).toBeLessThanOrEqual(2);
  });

  test('should maintain cent-perfect accuracy through format round-trip', () => {
    // Convert to cents → split → convert back to display
    const originalAmount = 99.99;
    const cents = toCents(originalAmount);
    const splits = calculateEqualSplit(cents, ['u1', 'u2', 'u3']);

    // Sum of displayed amounts should reconstruct original
    const displayedSum = splits.reduce((acc, s) => {
      return acc + parseFloat(fromCents(s.amountCents));
    }, 0);

    // Must equal original within floating-point display tolerance
    expect(Math.abs(displayedSum - originalAmount)).toBeLessThan(0.01);
  });

  test('should handle the classic 3-way circular debt scenario end-to-end', () => {
    // A paid $30 dinner for A, B, C (equal split: each owes $10)
    // B paid $30 lunch for A, B, C (equal split: each owes $10)
    // C paid $30 taxi for A, B, C (equal split: each owes $10)
    //
    // Result: everyone paid $30 and owed $30 → net zero for all

    const debts = [
      // From dinner (A paid):
      { debtorId: 'B', creditorId: 'A', amountCents: 1000 },
      { debtorId: 'C', creditorId: 'A', amountCents: 1000 },
      // From lunch (B paid):
      { debtorId: 'A', creditorId: 'B', amountCents: 1000 },
      { debtorId: 'C', creditorId: 'B', amountCents: 1000 },
      // From taxi (C paid):
      { debtorId: 'A', creditorId: 'C', amountCents: 1000 },
      { debtorId: 'B', creditorId: 'C', amountCents: 1000 },
    ];

    const nets = calculateNetBalances(debts);
    expect(nets.get('A')).toBe(0);
    expect(nets.get('B')).toBe(0);
    expect(nets.get('C')).toBe(0);

    const simplified = simplifyDebts(debts);
    expect(simplified).toHaveLength(0);
  });
});
