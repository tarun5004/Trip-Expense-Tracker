/**
 * Migration: 001_create_users
 * Purpose: Creates the `users` table — the root entity for all authentication and identity.
 * Dependencies: None (first migration)
 */

exports.up = async function (knex) {
  // Enable UUID generation extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('users', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'));

    table
      .string('email', 255)
      .notNullable();

    table
      .string('password_hash', 255)
      .notNullable();

    table
      .string('name', 100)
      .notNullable();

    table
      .string('avatar_url', 500)
      .nullable();

    table
      .string('phone', 20)
      .nullable();

    table
      .string('currency_preference', 3)
      .notNullable()
      .defaultTo('INR');

    table
      .string('timezone', 50)
      .notNullable()
      .defaultTo('Asia/Kolkata');

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

  // Partial unique index: email must be unique among non-deleted users
  await knex.raw(`
    CREATE UNIQUE INDEX uq_users_email_active
    ON users (email)
    WHERE deleted_at IS NULL
  `);

  // Partial unique index: phone must be unique among non-deleted users (if provided)
  await knex.raw(`
    CREATE UNIQUE INDEX uq_users_phone_active
    ON users (phone)
    WHERE deleted_at IS NULL AND phone IS NOT NULL
  `);

  // Check constraints
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT chk_users_email_length CHECK (char_length(email) >= 5)
  `);

  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT chk_users_name_length CHECK (char_length(name) >= 1)
  `);

  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT chk_users_currency_length CHECK (char_length(currency_preference) = 3)
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('users');
};
