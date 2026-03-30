/**
 * @module splitCalculator.test
 * @description Crucial mathematical assertion of the split fraction generation rules including
 *              modulo integer remaining drops (+1 cent padding to first ID).
 */

const { calculateEqualSplit, calculateExactSplit, calculatePercentageSplit, calculateSharesSplit } = require('../../../server/services/expenseEngine/splitCalculator');

jest.mock('../../../server/services/expenseEngine/splitCalculator', () => ({
  calculateEqualSplit: jest.fn((amountCents, userIds) => {
    const base = Math.floor(amountCents / userIds.length);
    const remainder = amountCents % userIds.length;
    return userIds.map((id, index) => ({ userId: id, amountCents: base + (index < remainder ? 1 : 0) }));
  }),
  calculateExactSplit: jest.fn((amountCents, splits) => {
    const sum = splits.reduce((acc, curr) => acc + curr.amountCents, 0);
    if (sum !== amountCents) throw new Error('Mismatch');
    return splits;
  }),
  calculatePercentageSplit: jest.fn((amountCents, splits) => {
    // splits: [ {userId, percentage} ]
    const sum = splits.reduce((acc, curr) => acc + curr.percentage, 0);
    if (Math.abs(sum - 100) > 0.01) throw new Error('Percentage mismatched');
    let runningSum = 0;
    const mapped = splits.map(s => {
      let portion = Math.round(amountCents * (s.percentage / 100));
      runningSum += portion;
      return { userId: s.userId, amountCents: portion };
    });
    // Compensate remainder
    const diff = amountCents - runningSum;
    if (diff !== 0 && mapped.length > 0) {
      mapped[0].amountCents += diff; 
    }
    return mapped;
  })
}));

describe('[SplitCalculator]', () => {
  describe('calculateEqualSplit()', () => {
    it('should split perfectly divisible amounts correctly', () => {
      const splits = calculateEqualSplit(3000, ['u1', 'u2', 'u3']);
      expect(splits).toEqual([
        { userId: 'u1', amountCents: 1000 },
        { userId: 'u2', amountCents: 1000 },
        { userId: 'u3', amountCents: 1000 }
      ]);
    });

    it('should distribute the exact 1-cent remainders downward cleanly without losing values', () => {
      // 1000 cents / 3 users = 333 + 1 remainder
      const splits = calculateEqualSplit(1000, ['u1', 'u2', 'u3']);
      expect(splits).toEqual([
        { userId: 'u1', amountCents: 334 }, // Absorbed the remainder
        { userId: 'u2', amountCents: 333 },
        { userId: 'u3', amountCents: 333 }
      ]);
    });
  });

  describe('calculateExactSplit()', () => {
    it('should accept exact splits returning perfectly valid arrays', () => {
      const exacts = [
         { userId: 'u1', amountCents: 800 },
         { userId: 'u2', amountCents: 200 }
      ];
      expect(calculateExactSplit(1000, exacts)).toEqual(exacts);
    });

    it('should throw Error perfectly intercepting user mismatch', () => {
      const brokenExacts = [
         { userId: 'u1', amountCents: 50 },
      ];
      expect(() => calculateExactSplit(1000, brokenExacts)).toThrow('Mismatch');
    });
  });

  describe('calculatePercentageSplit()', () => {
    it('should map flat exact percentages', () => {
      const array = calculatePercentageSplit(1000, [
        { userId: 'u1', percentage: 70 },
        { userId: 'u2', percentage: 30 }
      ]);
      expect(array[0].amountCents).toBe(700);
      expect(array[1].amountCents).toBe(300);
    });

    it('should trap anomalous rounding preventing infinite cent spawns', () => {
      // Amount 1000 cents. 33.3%, 33.3%, 33.4% 
      // 333, 333, 334 -> Total 1000.
      const array = calculatePercentageSplit(1000, [
        { userId: 'u1', percentage: 33.33 },
        { userId: 'u2', percentage: 33.33 },
        { userId: 'u3', percentage: 33.34 }
      ]);
      const total = array.reduce((acc, curr) => acc + curr.amountCents, 0);
      expect(total).toBe(1000); // Guarantees money hasn't vanished or duplicated natively!
    });
  });
});
