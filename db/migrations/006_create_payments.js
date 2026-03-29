/**
 * Migration: 006_create_payments
 * Purpose: Creates the `payments` table — records settlements between group members.
 *          Amounts are integer cents. Supports pending/confirmed/disputed lifecycle.
 * Dependencies: 001_create_users, 002_create_groups
 */

exports.up = async function (knex) {
  await knex.schema.createTable('payments', (table) => {
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
      .uuid('paid_to_user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');

    table
      .integer('amount_cents')
      .notNullable();

    table
      .string('currency', 3)
      .notNullable()
      .defaultTo('INR');

    table
      .string('payment_method', 20)
      .nullable()
      .defaultTo('cash');

    table
      .string('note', 500)
      .nullable();

    table
      .string('status', 12)
      .notNullable()
      .defaultTo('pending');

    table
      .timestamp('confirmed_at', { useTz: true })
      .nullable();

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
    ALTER TABLE payments
    ADD CONSTRAINT chk_payments_amount_positive CHECK (amount_cents > 0)
  `);

  await knex.raw(`
    ALTER TABLE payments
    ADD CONSTRAINT chk_payments_not_self CHECK (paid_by_user_id != paid_to_user_id)
  `);

  await knex.raw(`
    ALTER TABLE payments
    ADD CONSTRAINT chk_payments_status CHECK (
      status IN ('pending', 'confirmed', 'disputed')
    )
  `);

  await knex.raw(`
    ALTER TABLE payments
    ADD CONSTRAINT chk_payments_currency_length CHECK (char_length(currency) = 3)
  `);

  // Index for listing payments in a group
  await knex.raw(`
    CREATE INDEX idx_payments_group_id
    ON payments (group_id, created_at DESC)
    WHERE deleted_at IS NULL
  `);

  // Index for finding pending payments that need auto-confirmation (BullMQ worker query)
  await knex.raw(`
    CREATE INDEX idx_payments_pending_auto_confirm
    ON payments (created_at)
    WHERE status = 'pending' AND deleted_at IS NULL
  `);

  // Index for balance computation: payments from/to a specific user in a group
  await knex.raw(`
    CREATE INDEX idx_payments_paid_by
    ON payments (group_id, paid_by_user_id)
    WHERE status = 'confirmed' AND deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_payments_paid_to
    ON payments (group_id, paid_to_user_id)
    WHERE status = 'confirmed' AND deleted_at IS NULL
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('payments');
};
