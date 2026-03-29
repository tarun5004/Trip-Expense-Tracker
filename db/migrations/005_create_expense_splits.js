/**
 * Migration: 005_create_expense_splits
 * Purpose: Creates the `expense_splits` table — stores each participant's share of an expense.
 *          One row per participant per expense. The `amount_cents` is the canonical owed amount.
 * Dependencies: 001_create_users, 004_create_expenses
 */

exports.up = async function (knex) {
  await knex.schema.createTable('expense_splits', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'));

    table
      .uuid('expense_id')
      .notNullable()
      .references('id')
      .inTable('expenses')
      .onDelete('CASCADE');

    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');

    table
      .integer('amount_cents')
      .notNullable();

    // Only populated when split_type = 'percentage'
    table
      .decimal('percentage', 5, 2)
      .nullable();

    // Only populated when split_type = 'shares'
    table
      .integer('shares')
      .nullable();

    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  // Each user appears at most once per expense
  await knex.raw(`
    CREATE UNIQUE INDEX uq_expense_splits_expense_user
    ON expense_splits (expense_id, user_id)
  `);

  // Check constraints
  await knex.raw(`
    ALTER TABLE expense_splits
    ADD CONSTRAINT chk_expense_splits_amount_non_negative CHECK (amount_cents >= 0)
  `);

  await knex.raw(`
    ALTER TABLE expense_splits
    ADD CONSTRAINT chk_expense_splits_percentage_range CHECK (
      percentage IS NULL OR (percentage >= 0 AND percentage <= 100)
    )
  `);

  await knex.raw(`
    ALTER TABLE expense_splits
    ADD CONSTRAINT chk_expense_splits_shares_non_negative CHECK (
      shares IS NULL OR shares >= 0
    )
  `);

  // Index for finding all splits for a user (used in balance computation)
  await knex.raw(`
    CREATE INDEX idx_expense_splits_user_id
    ON expense_splits (user_id)
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('expense_splits');
};
