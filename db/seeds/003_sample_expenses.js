/**
 * Seed: 003_sample_expenses
 * Purpose: Creates 12 varied expenses across all 3 groups, covering every split type
 *          (equal, exact, percentage, shares), multiple categories, and realistic amounts.
 *          Also creates 2 payments and corresponding activity log entries.
 * Dependencies: 001_users, 002_groups seeds
 */

const { USER_IDS } = require('./001_users');
const { GROUP_IDS } = require('./002_groups');

// ─── Expenses ────────────────────────────────────────────────────────────────

const EXPENSE_IDS = {
  GOA_HOTEL:       'exp00001-0000-0000-0000-000000000001',
  GOA_DINNER:      'exp00002-0000-0000-0000-000000000002',
  GOA_TAXI:        'exp00003-0000-0000-0000-000000000003',
  GOA_WATER_SPORT: 'exp00004-0000-0000-0000-000000000004',
  APT_RENT:        'exp00005-0000-0000-0000-000000000005',
  APT_GROCERY:     'exp00006-0000-0000-0000-000000000006',
  APT_ELECTRICITY: 'exp00007-0000-0000-0000-000000000007',
  APT_WIFI:        'exp00008-0000-0000-0000-000000000008',
  TEAM_LUNCH1:     'exp00009-0000-0000-0000-000000000009',
  TEAM_COWORK:     'exp00010-0000-0000-0000-000000000010',
  TEAM_LUNCH2:     'exp00011-0000-0000-0000-000000000011',
  TEAM_CLIENT:     'exp00012-0000-0000-0000-000000000012',
};

const expenses = [
  // ─── Goa Trip (4 expenses) ────────────────────────────────────────────
  {
    id: EXPENSE_IDS.GOA_HOTEL,
    group_id: GROUP_IDS.GOA_TRIP,
    paid_by_user_id: USER_IDS.PRIYA,
    title: 'Hotel Calangute — 3 nights',
    description: 'Beach-side hotel, 2 rooms for 3 nights',
    total_amount_cents: 1800000,    // ₹18,000
    currency: 'INR',
    split_type: 'equal',
    category: 'accommodation',
    expense_date: '2026-03-10',
    created_by: USER_IDS.PRIYA,
  },
  {
    id: EXPENSE_IDS.GOA_DINNER,
    group_id: GROUP_IDS.GOA_TRIP,
    paid_by_user_id: USER_IDS.RAJ,
    title: 'Dinner at Fisherman\'s Wharf',
    description: 'Seafood dinner on the last night',
    total_amount_cents: 480000,     // ₹4,800
    currency: 'INR',
    split_type: 'equal',
    category: 'food',
    expense_date: '2026-03-12',
    created_by: USER_IDS.RAJ,
  },
  {
    id: EXPENSE_IDS.GOA_TAXI,
    group_id: GROUP_IDS.GOA_TRIP,
    paid_by_user_id: USER_IDS.ARJUN,
    title: 'Airport taxi — Dabolim to Calangute',
    description: null,
    total_amount_cents: 200000,     // ₹2,000
    currency: 'INR',
    split_type: 'exact',           // Sneha didn't ride, only 3 people
    category: 'transport',
    expense_date: '2026-03-10',
    created_by: USER_IDS.ARJUN,
  },
  {
    id: EXPENSE_IDS.GOA_WATER_SPORT,
    group_id: GROUP_IDS.GOA_TRIP,
    paid_by_user_id: USER_IDS.PRIYA,
    title: 'Parasailing + Jet Ski',
    description: 'Water sports at Baga Beach. Raj did both, others did one each.',
    total_amount_cents: 600000,     // ₹6,000
    currency: 'INR',
    split_type: 'shares',          // Raj gets 2 shares, others 1 each
    category: 'entertainment',
    expense_date: '2026-03-11',
    created_by: USER_IDS.PRIYA,
  },

  // ─── Koramangala Flat (4 expenses) ────────────────────────────────────
  {
    id: EXPENSE_IDS.APT_RENT,
    group_id: GROUP_IDS.APARTMENT,
    paid_by_user_id: USER_IDS.ARJUN,
    title: 'March 2026 Rent',
    description: 'Monthly rent for Koramangala 3BHK',
    total_amount_cents: 4500000,    // ₹45,000
    currency: 'INR',
    split_type: 'equal',
    category: 'rent',
    expense_date: '2026-03-01',
    created_by: USER_IDS.ARJUN,
  },
  {
    id: EXPENSE_IDS.APT_GROCERY,
    group_id: GROUP_IDS.APARTMENT,
    paid_by_user_id: USER_IDS.RAJ,
    title: 'BigBasket monthly groceries',
    description: 'Rice, dal, oil, spices, toiletries',
    total_amount_cents: 620000,     // ₹6,200
    currency: 'INR',
    split_type: 'percentage',       // Arjun cooks more, uses more groceries
    category: 'groceries',
    expense_date: '2026-03-05',
    created_by: USER_IDS.RAJ,
  },
  {
    id: EXPENSE_IDS.APT_ELECTRICITY,
    group_id: GROUP_IDS.APARTMENT,
    paid_by_user_id: USER_IDS.SNEHA,
    title: 'BESCOM electricity bill — March',
    description: null,
    total_amount_cents: 340000,     // ₹3,400
    currency: 'INR',
    split_type: 'equal',
    category: 'utilities',
    expense_date: '2026-03-15',
    created_by: USER_IDS.SNEHA,
  },
  {
    id: EXPENSE_IDS.APT_WIFI,
    group_id: GROUP_IDS.APARTMENT,
    paid_by_user_id: USER_IDS.ARJUN,
    title: 'ACT Fibernet — 150 Mbps plan',
    description: 'Monthly internet bill',
    total_amount_cents: 120000,     // ₹1,200
    currency: 'INR',
    split_type: 'equal',
    category: 'utilities',
    expense_date: '2026-03-08',
    created_by: USER_IDS.ARJUN,
  },

  // ─── Startup Team (4 expenses) ────────────────────────────────────────
  {
    id: EXPENSE_IDS.TEAM_LUNCH1,
    group_id: GROUP_IDS.TEAM_LUNCH,
    paid_by_user_id: USER_IDS.MEERA,
    title: 'Team lunch at Truffles',
    description: 'Monday team lunch',
    total_amount_cents: 320000,     // ₹3,200
    currency: 'INR',
    split_type: 'equal',
    category: 'food',
    expense_date: '2026-03-17',
    created_by: USER_IDS.MEERA,
  },
  {
    id: EXPENSE_IDS.TEAM_COWORK,
    group_id: GROUP_IDS.TEAM_LUNCH,
    paid_by_user_id: USER_IDS.MEERA,
    title: 'WeWork day passes × 5',
    description: 'Co-working space for the team for client meeting day',
    total_amount_cents: 750000,     // ₹7,500
    currency: 'INR',
    split_type: 'equal',
    category: 'workspace',
    expense_date: '2026-03-20',
    created_by: USER_IDS.MEERA,
  },
  {
    id: EXPENSE_IDS.TEAM_LUNCH2,
    group_id: GROUP_IDS.TEAM_LUNCH,
    paid_by_user_id: USER_IDS.PRIYA,
    title: 'Pizza Hut delivery — sprint review',
    description: 'Pizzas + drinks for sprint review session',
    total_amount_cents: 185000,     // ₹1,850
    currency: 'INR',
    split_type: 'equal',
    category: 'food',
    expense_date: '2026-03-21',
    created_by: USER_IDS.PRIYA,
  },
  {
    id: EXPENSE_IDS.TEAM_CLIENT,
    group_id: GROUP_IDS.TEAM_LUNCH,
    paid_by_user_id: USER_IDS.MEERA,
    title: 'Client dinner — Karavalli',
    description: 'Dinner with Infosys client team (5 of us + 3 clients)',
    total_amount_cents: 1200000,    // ₹12,000
    currency: 'INR',
    split_type: 'exact',           // Only Meera and Priya attended from team side budget split
    category: 'entertainment',
    expense_date: '2026-03-22',
    created_by: USER_IDS.MEERA,
  },
];

// ─── Expense Splits ──────────────────────────────────────────────────────────

const splits = [
  // GOA_HOTEL: ₹18,000 equal among 4 → ₹4,500 each
  { expense_id: EXPENSE_IDS.GOA_HOTEL, user_id: USER_IDS.PRIYA, amount_cents: 450000 },
  { expense_id: EXPENSE_IDS.GOA_HOTEL, user_id: USER_IDS.ARJUN, amount_cents: 450000 },
  { expense_id: EXPENSE_IDS.GOA_HOTEL, user_id: USER_IDS.RAJ,   amount_cents: 450000 },
  { expense_id: EXPENSE_IDS.GOA_HOTEL, user_id: USER_IDS.SNEHA, amount_cents: 450000 },

  // GOA_DINNER: ₹4,800 equal among 4 → ₹1,200 each
  { expense_id: EXPENSE_IDS.GOA_DINNER, user_id: USER_IDS.PRIYA, amount_cents: 120000 },
  { expense_id: EXPENSE_IDS.GOA_DINNER, user_id: USER_IDS.ARJUN, amount_cents: 120000 },
  { expense_id: EXPENSE_IDS.GOA_DINNER, user_id: USER_IDS.RAJ,   amount_cents: 120000 },
  { expense_id: EXPENSE_IDS.GOA_DINNER, user_id: USER_IDS.SNEHA, amount_cents: 120000 },

  // GOA_TAXI: ₹2,000 exact split among 3 (Sneha didn't ride)
  { expense_id: EXPENSE_IDS.GOA_TAXI, user_id: USER_IDS.PRIYA, amount_cents: 67000 },  // ₹670
  { expense_id: EXPENSE_IDS.GOA_TAXI, user_id: USER_IDS.ARJUN, amount_cents: 67000 },  // ₹670
  { expense_id: EXPENSE_IDS.GOA_TAXI, user_id: USER_IDS.RAJ,   amount_cents: 66000 },  // ₹660

  // GOA_WATER_SPORT: ₹6,000 by shares (Raj 2 shares, others 1 each = 5 total shares)
  // Per share = ₹1,200; Raj = ₹2,400, others = ₹1,200
  { expense_id: EXPENSE_IDS.GOA_WATER_SPORT, user_id: USER_IDS.PRIYA, amount_cents: 120000, shares: 1 },
  { expense_id: EXPENSE_IDS.GOA_WATER_SPORT, user_id: USER_IDS.ARJUN, amount_cents: 120000, shares: 1 },
  { expense_id: EXPENSE_IDS.GOA_WATER_SPORT, user_id: USER_IDS.RAJ,   amount_cents: 240000, shares: 2 },
  { expense_id: EXPENSE_IDS.GOA_WATER_SPORT, user_id: USER_IDS.SNEHA, amount_cents: 120000, shares: 1 },

  // APT_RENT: ₹45,000 equal among 3 → ₹15,000 each
  { expense_id: EXPENSE_IDS.APT_RENT, user_id: USER_IDS.ARJUN, amount_cents: 1500000 },
  { expense_id: EXPENSE_IDS.APT_RENT, user_id: USER_IDS.RAJ,   amount_cents: 1500000 },
  { expense_id: EXPENSE_IDS.APT_RENT, user_id: USER_IDS.SNEHA, amount_cents: 1500000 },

  // APT_GROCERY: ₹6,200 by percentage (Arjun 40%, Raj 30%, Sneha 30%)
  { expense_id: EXPENSE_IDS.APT_GROCERY, user_id: USER_IDS.ARJUN, amount_cents: 248000, percentage: 40.00 },
  { expense_id: EXPENSE_IDS.APT_GROCERY, user_id: USER_IDS.RAJ,   amount_cents: 186000, percentage: 30.00 },
  { expense_id: EXPENSE_IDS.APT_GROCERY, user_id: USER_IDS.SNEHA, amount_cents: 186000, percentage: 30.00 },

  // APT_ELECTRICITY: ₹3,400 equal among 3 → ₹1,133.33 → 113333 + 113333 + 113334 (rounding)
  { expense_id: EXPENSE_IDS.APT_ELECTRICITY, user_id: USER_IDS.ARJUN, amount_cents: 113333 },
  { expense_id: EXPENSE_IDS.APT_ELECTRICITY, user_id: USER_IDS.RAJ,   amount_cents: 113333 },
  { expense_id: EXPENSE_IDS.APT_ELECTRICITY, user_id: USER_IDS.SNEHA, amount_cents: 113334 },

  // APT_WIFI: ₹1,200 equal among 3 → ₹400 each
  { expense_id: EXPENSE_IDS.APT_WIFI, user_id: USER_IDS.ARJUN, amount_cents: 40000 },
  { expense_id: EXPENSE_IDS.APT_WIFI, user_id: USER_IDS.RAJ,   amount_cents: 40000 },
  { expense_id: EXPENSE_IDS.APT_WIFI, user_id: USER_IDS.SNEHA, amount_cents: 40000 },

  // TEAM_LUNCH1: ₹3,200 equal among 5 → ₹640 each
  { expense_id: EXPENSE_IDS.TEAM_LUNCH1, user_id: USER_IDS.MEERA, amount_cents: 64000 },
  { expense_id: EXPENSE_IDS.TEAM_LUNCH1, user_id: USER_IDS.PRIYA, amount_cents: 64000 },
  { expense_id: EXPENSE_IDS.TEAM_LUNCH1, user_id: USER_IDS.ARJUN, amount_cents: 64000 },
  { expense_id: EXPENSE_IDS.TEAM_LUNCH1, user_id: USER_IDS.RAJ,   amount_cents: 64000 },
  { expense_id: EXPENSE_IDS.TEAM_LUNCH1, user_id: USER_IDS.SNEHA, amount_cents: 64000 },

  // TEAM_COWORK: ₹7,500 equal among 5 → ₹1,500 each
  { expense_id: EXPENSE_IDS.TEAM_COWORK, user_id: USER_IDS.MEERA, amount_cents: 150000 },
  { expense_id: EXPENSE_IDS.TEAM_COWORK, user_id: USER_IDS.PRIYA, amount_cents: 150000 },
  { expense_id: EXPENSE_IDS.TEAM_COWORK, user_id: USER_IDS.ARJUN, amount_cents: 150000 },
  { expense_id: EXPENSE_IDS.TEAM_COWORK, user_id: USER_IDS.RAJ,   amount_cents: 150000 },
  { expense_id: EXPENSE_IDS.TEAM_COWORK, user_id: USER_IDS.SNEHA, amount_cents: 150000 },

  // TEAM_LUNCH2: ₹1,850 equal among 5 → ₹370 each
  { expense_id: EXPENSE_IDS.TEAM_LUNCH2, user_id: USER_IDS.MEERA, amount_cents: 37000 },
  { expense_id: EXPENSE_IDS.TEAM_LUNCH2, user_id: USER_IDS.PRIYA, amount_cents: 37000 },
  { expense_id: EXPENSE_IDS.TEAM_LUNCH2, user_id: USER_IDS.ARJUN, amount_cents: 37000 },
  { expense_id: EXPENSE_IDS.TEAM_LUNCH2, user_id: USER_IDS.RAJ,   amount_cents: 37000 },
  { expense_id: EXPENSE_IDS.TEAM_LUNCH2, user_id: USER_IDS.SNEHA, amount_cents: 37000 },

  // TEAM_CLIENT: ₹12,000 exact split (only Meera ₹7,000, Priya ₹5,000)
  { expense_id: EXPENSE_IDS.TEAM_CLIENT, user_id: USER_IDS.MEERA, amount_cents: 700000 },
  { expense_id: EXPENSE_IDS.TEAM_CLIENT, user_id: USER_IDS.PRIYA, amount_cents: 500000 },
];

// ─── Payments (Settlements) ─────────────────────────────────────────────────

const PAYMENT_IDS = {
  ARJUN_TO_PRIYA: 'pay00001-0000-0000-0000-000000000001',
  RAJ_TO_ARJUN:   'pay00002-0000-0000-0000-000000000002',
};

const payments = [
  {
    id: PAYMENT_IDS.ARJUN_TO_PRIYA,
    group_id: GROUP_IDS.GOA_TRIP,
    paid_by_user_id: USER_IDS.ARJUN,
    paid_to_user_id: USER_IDS.PRIYA,
    amount_cents: 300000,           // ₹3,000 partial settlement
    currency: 'INR',
    payment_method: 'upi',
    note: 'GPay ref: TXN20260315001',
    status: 'confirmed',
    confirmed_at: '2026-03-16T10:00:00Z',
  },
  {
    id: PAYMENT_IDS.RAJ_TO_ARJUN,
    group_id: GROUP_IDS.APARTMENT,
    paid_by_user_id: USER_IDS.RAJ,
    paid_to_user_id: USER_IDS.ARJUN,
    amount_cents: 1500000,          // ₹15,000 (March rent share)
    currency: 'INR',
    payment_method: 'bank_transfer',
    note: 'NEFT — March rent share',
    status: 'pending',              // Awaiting Arjun's confirmation
    confirmed_at: null,
  },
];

// ─── Activity Log Entries ────────────────────────────────────────────────────

const activityLogs = [
  {
    group_id: GROUP_IDS.GOA_TRIP,
    actor_user_id: USER_IDS.PRIYA,
    action_type: 'expense_created',
    entity_type: 'expense',
    entity_id: EXPENSE_IDS.GOA_HOTEL,
    metadata_json: JSON.stringify({
      title: 'Hotel Calangute — 3 nights',
      total_amount_cents: 1800000,
      split_type: 'equal',
      participant_count: 4,
    }),
    created_at: '2026-03-10T09:00:00Z',
  },
  {
    group_id: GROUP_IDS.GOA_TRIP,
    actor_user_id: USER_IDS.RAJ,
    action_type: 'expense_created',
    entity_type: 'expense',
    entity_id: EXPENSE_IDS.GOA_DINNER,
    metadata_json: JSON.stringify({
      title: 'Dinner at Fisherman\'s Wharf',
      total_amount_cents: 480000,
      split_type: 'equal',
      participant_count: 4,
    }),
    created_at: '2026-03-12T21:00:00Z',
  },
  {
    group_id: GROUP_IDS.GOA_TRIP,
    actor_user_id: USER_IDS.ARJUN,
    action_type: 'payment_created',
    entity_type: 'payment',
    entity_id: PAYMENT_IDS.ARJUN_TO_PRIYA,
    metadata_json: JSON.stringify({
      amount_cents: 300000,
      paid_to: 'Priya Sharma',
      method: 'upi',
    }),
    created_at: '2026-03-15T18:00:00Z',
  },
  {
    group_id: GROUP_IDS.GOA_TRIP,
    actor_user_id: USER_IDS.PRIYA,
    action_type: 'payment_confirmed',
    entity_type: 'payment',
    entity_id: PAYMENT_IDS.ARJUN_TO_PRIYA,
    metadata_json: JSON.stringify({
      amount_cents: 300000,
      paid_by: 'Arjun Mehta',
    }),
    created_at: '2026-03-16T10:00:00Z',
  },
  {
    group_id: GROUP_IDS.APARTMENT,
    actor_user_id: USER_IDS.ARJUN,
    action_type: 'expense_created',
    entity_type: 'expense',
    entity_id: EXPENSE_IDS.APT_RENT,
    metadata_json: JSON.stringify({
      title: 'March 2026 Rent',
      total_amount_cents: 4500000,
      split_type: 'equal',
      participant_count: 3,
    }),
    created_at: '2026-03-01T08:00:00Z',
  },
];

// ─── Seed Runner ─────────────────────────────────────────────────────────────

exports.seed = async function (knex) {
  // Clear tables (respecting FK order)
  await knex('activity_log').del();
  await knex('notifications').del();
  await knex('expense_splits').del();
  await knex('payments').del();
  await knex('expenses').del();

  // Insert expenses
  await knex('expenses').insert(expenses);

  // Insert splits (add generated UUIDs)
  await knex('expense_splits').insert(
    splits.map((s) => ({
      id: knex.raw('uuid_generate_v4()'),
      percentage: null,
      shares: null,
      ...s,
    }))
  );

  // Insert payments
  await knex('payments').insert(payments);

  // Insert activity logs
  await knex('activity_log').insert(
    activityLogs.map((a) => ({
      id: knex.raw('uuid_generate_v4()'),
      ...a,
    }))
  );
};
