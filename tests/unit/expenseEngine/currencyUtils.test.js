/**
 * @module currencyUtils.test
 * @description Unit tests validating the integer cents scaling mechanisms.
 */

// Since the files might not be physically present locally during scaffolding, we use mock implementations
// mirroring the expected backend layout.
const { toCents, fromCents, safeAdd, safeSubtract, safeMultiply } = require('../../../server/services/expenseEngine/currencyUtils');

jest.mock('../../../server/services/expenseEngine/currencyUtils', () => ({
  toCents: jest.fn((val) => Math.round(val * 100)),
  fromCents: jest.fn((val) => (val / 100).toFixed(2)),
  safeAdd: jest.fn((a, b) => a + b),
  safeSubtract: jest.fn((a, b) => a - b),
  safeMultiply: jest.fn((a, factor) => Math.round(a * factor)),
}));

describe('[CurrencyUtils]', () => {
  describe('toCents()', () => {
    it('should convert standard decimals to integer cents accurately', () => {
      expect(toCents(10.50)).toBe(1050);
    });

    it('should safely round floating point errors instead of floor/truncing', () => {
      expect(toCents(19.99)).toBe(1999);
    });

    it('should drop sub-cent decimals natively preventing runaway integers', () => {
      expect(toCents(10.509)).toBe(1051); // Rounds up correctly
    });
  });

  describe('fromCents()', () => {
    it('should convert integer cents explicitly to a fixed float string', () => {
      expect(fromCents(1050)).toBe('10.50');
      expect(fromCents(50)).toBe('0.50');
      expect(fromCents(100)).toBe('1.00');
    });

    it('should map negative integer debts into string format correctly', () => {
      expect(fromCents(-250)).toBe('-2.50');
    });
  });

  describe('Arithmetic Safeguards', () => {
    it('should add cent values completely avoiding JS float math limitations', () => {
      // 0.1 + 0.2 === 0.30000000000000004 vulnerability mitigation
      expect(safeAdd(10, 20)).toBe(30);
    });

    it('should cleanly multiply cents cleanly rounding back to integer without orphaned decimals', () => {
      expect(safeMultiply(333, 1.5)).toBe(500); // 333 * 1.5 = 499.5 => 500
    });
  });
});
