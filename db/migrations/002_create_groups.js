/**
 * Migration: 002_create_groups
 * Purpose: Creates the `groups` table — named collections of users who share expenses.
 * Dependencies: 001_create_users (FK: created_by → users.id)
 */

exports.up = async function (knex) {
  await knex.schema.createTable('groups', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'));

    table
      .string('name', 100)
      .notNullable();

    table
      .string('description', 500)
      .nullable();

    table
      .string('currency', 3)
      .notNullable()
      .defaultTo('INR');

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
    ALTER TABLE groups
    ADD CONSTRAINT chk_groups_name_length CHECK (char_length(name) >= 1)
  `);

  await knex.raw(`
    ALTER TABLE groups
    ADD CONSTRAINT chk_groups_currency_length CHECK (char_length(currency) = 3)
  `);

  // Index for listing a user's groups
  await knex.raw(`
    CREATE INDEX idx_groups_created_by ON groups (created_by)
    WHERE deleted_at IS NULL
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('groups');
};
