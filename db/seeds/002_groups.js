/**
 * Seed: 002_groups
 * Purpose: Creates 3 realistic groups with memberships, covering the primary use cases:
 *          - Travel group (Priya's persona)
 *          - Roommate group (Arjun's persona)
 *          - Team expenses group (Meera's persona)
 * Dependencies: 001_users seed
 */

const { USER_IDS } = require('./001_users');

const GROUP_IDS = {
  GOA_TRIP:    'g1a2b3c4-d5e6-7890-abcd-111111111111',
  APARTMENT:   'g2b3c4d5-e6f7-8901-bcde-222222222222',
  TEAM_LUNCH:  'g3c4d5e6-f7a8-9012-cdef-333333333333',
};

const groups = [
  {
    id: GROUP_IDS.GOA_TRIP,
    name: 'Goa Trip 2026',
    description: 'Beach trip with college friends — March 2026. Splitting hotels, food, activities.',
    currency: 'INR',
    created_by: USER_IDS.PRIYA,
  },
  {
    id: GROUP_IDS.APARTMENT,
    name: 'Koramangala Flat',
    description: 'Monthly rent, utilities, groceries, and household supplies',
    currency: 'INR',
    created_by: USER_IDS.ARJUN,
  },
  {
    id: GROUP_IDS.TEAM_LUNCH,
    name: 'Startup Team Expenses',
    description: 'Shared meals, co-working passes, client entertainment',
    currency: 'INR',
    created_by: USER_IDS.MEERA,
  },
];

const members = [
  // --- Goa Trip: Priya (admin), Arjun, Raj, Sneha ---
  { group_id: GROUP_IDS.GOA_TRIP, user_id: USER_IDS.PRIYA, role: 'admin' },
  { group_id: GROUP_IDS.GOA_TRIP, user_id: USER_IDS.ARJUN, role: 'member' },
  { group_id: GROUP_IDS.GOA_TRIP, user_id: USER_IDS.RAJ,   role: 'member' },
  { group_id: GROUP_IDS.GOA_TRIP, user_id: USER_IDS.SNEHA, role: 'member' },

  // --- Apartment: Arjun (admin), Raj, Sneha ---
  { group_id: GROUP_IDS.APARTMENT, user_id: USER_IDS.ARJUN, role: 'admin' },
  { group_id: GROUP_IDS.APARTMENT, user_id: USER_IDS.RAJ,   role: 'member' },
  { group_id: GROUP_IDS.APARTMENT, user_id: USER_IDS.SNEHA, role: 'member' },

  // --- Team Lunch: Meera (admin), Priya, Arjun, Raj, Sneha ---
  { group_id: GROUP_IDS.TEAM_LUNCH, user_id: USER_IDS.MEERA, role: 'admin' },
  { group_id: GROUP_IDS.TEAM_LUNCH, user_id: USER_IDS.PRIYA, role: 'member' },
  { group_id: GROUP_IDS.TEAM_LUNCH, user_id: USER_IDS.ARJUN, role: 'member' },
  { group_id: GROUP_IDS.TEAM_LUNCH, user_id: USER_IDS.RAJ,   role: 'member' },
  { group_id: GROUP_IDS.TEAM_LUNCH, user_id: USER_IDS.SNEHA, role: 'member' },
];

exports.seed = async function (knex) {
  await knex('group_members').del();
  await knex('groups').del();

  await knex('groups').insert(groups);
  await knex('group_members').insert(
    members.map((m) => ({
      ...m,
      id: knex.raw('uuid_generate_v4()'),
    }))
  );
};

exports.GROUP_IDS = GROUP_IDS;
