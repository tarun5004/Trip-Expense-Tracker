/**
 * Seed: 001_users
 * Purpose: Creates 5 realistic users matching the persona archetypes from PRODUCT_SPEC.md
 * Dependencies: 001_create_users migration
 *
 * Passwords: All seeded users have the password "SplitSmart@2026"
 * bcrypt hash below is for that password with cost factor 12
 */

const PASSWORD_HASH = '$2b$12$LJ3m5ZQhKNDnOveGMqR7yuJ8LGriKBkSi0Y3rFKnqx5TzGDMHdJ5K';

const users = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'priya.sharma@email.com',
    password_hash: PASSWORD_HASH,
    name: 'Priya Sharma',
    avatar_url: null,
    phone: '+919876543210',
    currency_preference: 'INR',
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    email: 'arjun.mehta@email.com',
    password_hash: PASSWORD_HASH,
    name: 'Arjun Mehta',
    avatar_url: null,
    phone: '+919876543211',
    currency_preference: 'INR',
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    email: 'meera.patel@email.com',
    password_hash: PASSWORD_HASH,
    name: 'Meera Patel',
    avatar_url: null,
    phone: '+919876543212',
    currency_preference: 'INR',
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'd4e5f6a7-b8c9-0123-defa-456789012345',
    email: 'raj.kumar@email.com',
    password_hash: PASSWORD_HASH,
    name: 'Raj Kumar',
    avatar_url: null,
    phone: '+919876543213',
    currency_preference: 'INR',
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'e5f6a7b8-c9d0-1234-efab-567890123456',
    email: 'sneha.iyer@email.com',
    password_hash: PASSWORD_HASH,
    name: 'Sneha Iyer',
    avatar_url: null,
    phone: '+919876543214',
    currency_preference: 'USD',
    timezone: 'America/New_York',
  },
];

exports.seed = async function (knex) {
  // Clear existing data (respecting FK order)
  await knex('notifications').del();
  await knex('sessions').del();
  await knex('activity_log').del();
  await knex('expense_splits').del();
  await knex('payments').del();
  await knex('expenses').del();
  await knex('group_members').del();
  await knex('groups').del();
  await knex('users').del();

  // Insert users
  await knex('users').insert(users);
};

// Export user IDs for use in subsequent seed files
exports.USER_IDS = {
  PRIYA:  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  ARJUN:  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  MEERA:  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  RAJ:    'd4e5f6a7-b8c9-0123-defa-456789012345',
  SNEHA:  'e5f6a7b8-c9d0-1234-efab-567890123456',
};
