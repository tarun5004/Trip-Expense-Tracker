/**
 * Migration: 009_create_sessions_and_indexes
 * Purpose: Creates the `sessions` table for JWT refresh token management (SYSTEM_DESIGN §5.1),
 *          and adds any remaining cross-table indexes not created in earlier migrations.
 * Dependencies: 001_create_users
 */

exports.up = async function (knex) {
  // ─── Sessions Table ────────────────────────────────────────────────────────

  await knex.schema.createTable('sessions', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'));

    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table
      .string('refresh_token_hash', 255)
      .notNullable()
      .unique();

    table
      .string('device_info', 500)
      .nullable();

    table
      .specificType('ip_address', 'INET')
      .nullable();

    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table
      .timestamp('expires_at', { useTz: true })
      .notNullable();

    table
      .timestamp('revoked_at', { useTz: true })
      .nullable();
  });

  // Check: expiry must be after creation
  await knex.raw(`
    ALTER TABLE sessions
    ADD CONSTRAINT chk_sessions_expiry CHECK (expires_at > created_at)
  `);

  // Index for finding active sessions for a user (device management)
  await knex.raw(`
    CREATE INDEX idx_sessions_user_active
    ON sessions (user_id)
    WHERE revoked_at IS NULL
  `);

  // Index for token lookup during refresh (the most frequent session query)
  // The UNIQUE constraint on refresh_token_hash already creates an implicit index,
  // but we add a filtered one for active-only lookups
  await knex.raw(`
    CREATE INDEX idx_sessions_token_active
    ON sessions (refresh_token_hash)
    WHERE revoked_at IS NULL AND expires_at > NOW()
  `);

  // ─── Additional Cross-Table Indexes ────────────────────────────────────────

  // Full-text search index on expense titles (P1-09: Search feature)
  await knex.raw(`
    CREATE INDEX idx_expenses_title_search
    ON expenses USING gin (to_tsvector('english', title))
  `);

  // GIN index on activity_log metadata for JSONB queries
  await knex.raw(`
    CREATE INDEX idx_activity_log_metadata
    ON activity_log USING gin (metadata_json)
  `);

  // Index for finding expenses by category within a group (P1-01: Categories)
  await knex.raw(`
    CREATE INDEX idx_expenses_group_category
    ON expenses (group_id, category)
    WHERE deleted_at IS NULL AND category IS NOT NULL
  `);

  // Composite index for the balance computation query:
  // expense_splits JOIN expenses WHERE group_id = ? AND deleted_at IS NULL
  await knex.raw(`
    CREATE INDEX idx_expense_splits_expense_id_user_id
    ON expense_splits (expense_id, user_id, amount_cents)
  `);
};

exports.down = async function (knex) {
  // Drop additional indexes
  await knex.raw('DROP INDEX IF EXISTS idx_expense_splits_expense_id_user_id');
  await knex.raw('DROP INDEX IF EXISTS idx_expenses_group_category');
  await knex.raw('DROP INDEX IF EXISTS idx_activity_log_metadata');
  await knex.raw('DROP INDEX IF EXISTS idx_expenses_title_search');

  // Drop sessions table
  await knex.schema.dropTableIfExists('sessions');
};
