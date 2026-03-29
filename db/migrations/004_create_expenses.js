/**
 * Migration: 004_create_expenses
 * Purpose: Creates the `expenses` table — core financial entity representing money spent
 *          by a group member. All amounts stored as integer cents.
 * Dependencies: 001_create_users, 002_create_groups
 */

exports.up = async function (knex) {
  await knex.schema.createTable('expenses', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'));

    table
      .uuid('group_id')
      .notNullable()
      .references('id')
      .inTable('groups')
      .onDelete('RESTRICT');

    table
      .uuid('paid_by_user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');

    table
      .string('title', 200)
      .notNullable();

    table
      .text('description')
      .nullable();

    table
      .integer('total_amount_cents')
      .notNullable();

    table
      .string('currency', 3)
      .notNullable()
      .defaultTo('INR');

    table
      .string('split_type', 12)
      .notNullable()
      .defaultTo('equal');

    table
      .string('category', 50)
      .nullable()
      .defaultTo('general');

    table
      .date('expense_date')
      .notNullable()
      .defaultTo(knex.raw('CURRENT_DATE'));

    table
      .string('receipt_url', 500)
      .nullable();

    table
      .uuid('created_by')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');

    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table
      .timestamp('deleted_at', { useTz: true })
      .nullable();
  });

  // Check constraints
  await knex.raw(`
    ALTER TABLE expenses
    ADD CONSTRAINT chk_expenses_amount_positive CHECK (total_amount_cents > 0)
  `);

  await knex.raw(`
    ALTER TABLE expenses
    ADD CONSTRAINT chk_expenses_split_type CHECK (
      split_type IN ('equal', 'exact', 'percentage', 'shares')
    )
  `);

  await knex.raw(`
    ALTER TABLE expenses
    ADD CONSTRAINT chk_expenses_title_length CHECK (char_length(title) >= 1)
  `);

  await knex.raw(`
    ALTER TABLE expenses
    ADD CONSTRAINT chk_expenses_currency_length CHECK (char_length(currency) = 3)
  `);

  // Index for listing expenses in a group (most common query)
  await knex.raw(`
    CREATE INDEX idx_expenses_group_id_date
    ON expenses (group_id, expense_date DESC)
    WHERE deleted_at IS NULL
  `);

  // Index for finding expenses paid by a specific user
  await knex.raw(`
    CREATE INDEX idx_expenses_paid_by
    ON expenses (paid_by_user_id, created_at DESC)
    WHERE deleted_at IS NULL
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('expenses');
};
