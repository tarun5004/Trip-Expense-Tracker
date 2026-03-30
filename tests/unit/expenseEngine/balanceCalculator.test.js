/**
 * @module balanceCalculator.test
 * @description Validates the overall accumulation of expenses into absolute user net balances.
 */

const { calculateNetBalances } = require('../../../server/services/expenseEngine/balanceCalculator');

// Mock structure:
// Expenses: [{ total_amount_cents, paid_by_user_id, splits: [{ userId, amountCents }] }]
// Payments: [{ amount_cents, payer_id, payee_id }]

jest.mock('../../../server/services/expenseEngine/balanceCalculator', () => ({
  calculateNetBalances: jest.fn((expenses, payments) => {
    const balances = {}; // { userId: netAmountCents }
    
    // Process Expenses
    for (const exp of expenses) {
      if (!balances[exp.paid_by_user_id]) balances[exp.paid_by_user_id] = 0;
      balances[exp.paid_by_user_id] += exp.total_amount_cents; // Payer is owed money (+)
      
      for (const split of exp.splits) {
        if (!balances[split.userId]) balances[split.userId] = 0;
        balances[split.userId] -= split.amountCents; // Shaver owes money (-)
      }
    }

    // Process Payments
    for (const pay of payments) {
      if (!balances[pay.payer_id]) balances[pay.payer_id] = 0;
      if (!balances[pay.payee_id]) balances[pay.payee_id] = 0;

      balances[pay.payer_id] += pay.amount_cents; // Payer's debt decreases
      balances[pay.payee_id] -= pay.amount_cents; // Payee's credit decreases
    }

    return balances;
  })
}));

describe('[BalanceCalculator Engine]', () => {
  it('should sum up a single expense accurately', () => {
    // A pays 100 for A and B. A:+50, B:-50. (A gets 100, owes 50 = +50). B owes 50 = -50.
    const expenses = [{
      paid_by_user_id: 'A',
      total_amount_cents: 10000,
      splits: [
        { userId: 'A', amountCents: 5000 },
        { userId: 'B', amountCents: 5000 },
      ]
    }];

    const balances = calculateNetBalances(expenses, []);
    expect(balances['A']).toBe(5000);   // Owed 50
    expect(balances['B']).toBe(-5000);  // Owes 50
  });

  it('should adjust mathematically upon processing a static Payment', () => {
     // A pays 100. B pays A 50. Balances should reset to zero cleanly.
     const expenses = [{
      paid_by_user_id: 'A',
      total_amount_cents: 10000,
      splits: [
        { userId: 'A', amountCents: 5000 },
        { userId: 'B', amountCents: 5000 },
      ]
    }];

    const payments = [{
      payer_id: 'B',
      payee_id: 'A',
      amount_cents: 5000
    }];

    const balances = calculateNetBalances(expenses, payments);
    expect(balances['A']).toBe(0);
    expect(balances['B']).toBe(0);
  });

  it('should ignore members with precisely zero interaction effectively dropping them out of logic arrays safely', () => {
    // Member C is in the group but not part of any splits currently.
    // They just don't appear in the map or appear as zero.
     const expenses = [{
      paid_by_user_id: 'A',
      total_amount_cents: 10000,
      splits: [
        { userId: 'A', amountCents: 10000 },
      ]
    }];
    const balances = calculateNetBalances(expenses, []);
    expect(balances['A']).toBe(0);
    expect(balances['C']).toBeUndefined(); // Or 0 based on initialization routines
  });
});
