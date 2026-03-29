/**
 * Migration: 003_create_group_members
 * Purpose: Creates the `group_members` junction table — tracks who belongs to each group
 *          with their role (admin/member) and membership period.
 * Dependencies: 001_create_users, 002_create_groups
 */

exports.up = async function (knex) {
  await knex.schema.createTable('group_members', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'));

    table
      .uuid('group_id')
      .notNullable()
      .references('id')
      .inTable('groups')
      .onDelete('CASCADE');

    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table
      .string('role', 10)
      .notNullable()
      .defaultTo('member');

    table
      .timestamp('joined_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table
      .timestamp('left_at', { useTz: true })
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

  // Partial unique index: a user can only be an active member of a group once
  await knex.raw(`
    CREATE UNIQUE INDEX uq_group_members_active
    ON group_members (group_id, user_id)
    WHERE left_at IS NULL
  `);

  // Check constraint for valid roles
  await knex.raw(`
    ALTER TABLE group_members
    ADD CONSTRAINT chk_group_members_role CHECK (role IN ('admin', 'member'))
  `);

  // Index for looking up all groups a user belongs to
  await knex.raw(`
    CREATE INDEX idx_group_members_user_id
    ON group_members (user_id)
    WHERE left_at IS NULL
  `);

  // Index for listing all members of a group
  await knex.raw(`
    CREATE INDEX idx_group_members_group_id
    ON group_members (group_id)
    WHERE left_at IS NULL
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('group_members');
};
