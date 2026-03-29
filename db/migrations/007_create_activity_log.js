/**
 * Migration: 007_create_activity_log
 * Purpose: Creates the `activity_log` table — append-only audit trail for all group actions.
 *          Rows are never updated or deleted. Supports the Activity Feed (P1-06) and
 *          the security audit trail requirement (PRD §5.4).
 * Dependencies: 001_create_users, 002_create_groups
 */

exports.up = async function (knex) {
  await knex.schema.createTable('activity_log', (table) => {
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
      .uuid('actor_user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');

    table
      .string('action_type', 30)
      .notNullable();

    table
      .string('entity_type', 20)
      .notNullable();

    table
      .uuid('entity_id')
      .notNullable();

    table
      .jsonb('metadata_json')
      .nullable()
      .defaultTo('{}');

    // Intentionally no updated_at or deleted_at — this table is append-only
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  // Check constraints
  await knex.raw(`
    ALTER TABLE activity_log
    ADD CONSTRAINT chk_activity_log_action_type CHECK (
      action_type IN (
        'expense_created', 'expense_updated', 'expense_deleted',
        'payment_created', 'payment_confirmed', 'payment_disputed',
        'member_added', 'member_removed', 'member_role_changed',
        'group_updated', 'group_archived'
      )
    )
  `);

  await knex.raw(`
    ALTER TABLE activity_log
    ADD CONSTRAINT chk_activity_log_entity_type CHECK (
      entity_type IN ('expense', 'payment', 'group', 'group_member')
    )
  `);

  // Primary query: paginated activity feed for a group (reverse chronological)
  await knex.raw(`
    CREATE INDEX idx_activity_log_group_created
    ON activity_log (group_id, created_at DESC)
  `);

  // Secondary query: all actions by a specific user (admin auditing)
  await knex.raw(`
    CREATE INDEX idx_activity_log_actor
    ON activity_log (actor_user_id, created_at DESC)
  `);

  // Lookup specific entity's history
  await knex.raw(`
    CREATE INDEX idx_activity_log_entity
    ON activity_log (entity_type, entity_id)
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('activity_log');
};
