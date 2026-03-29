/**
 * Migration: 008_create_notifications
 * Purpose: Creates the `notifications` table — user-facing notification records for
 *          in-app notification bell (P0-10) and push notification tracking.
 * Dependencies: 001_create_users
 */

exports.up = async function (knex) {
  await knex.schema.createTable('notifications', (table) => {
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
      .string('type', 30)
      .notNullable();

    table
      .string('title', 200)
      .notNullable();

    table
      .text('body')
      .notNullable();

    table
      .string('related_entity_type', 20)
      .nullable();

    table
      .uuid('related_entity_id')
      .nullable();

    table
      .boolean('is_read')
      .notNullable()
      .defaultTo(false);

    // No updated_at — only mutation is marking as read (tracked by is_read)
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  // Check constraint for valid notification types
  await knex.raw(`
    ALTER TABLE notifications
    ADD CONSTRAINT chk_notifications_type CHECK (
      type IN (
        'expense_added', 'expense_updated', 'expense_deleted',
        'payment_received', 'payment_confirmation_request',
        'payment_confirmed', 'payment_disputed',
        'group_invitation', 'payment_reminder',
        'member_joined', 'member_left'
      )
    )
  `);

  // Primary query: unread notifications for a user (notification bell badge count + dropdown)
  await knex.raw(`
    CREATE INDEX idx_notifications_user_unread
    ON notifications (user_id, created_at DESC)
    WHERE is_read = FALSE
  `);

  // Secondary query: all notifications for a user (paginated list view)
  await knex.raw(`
    CREATE INDEX idx_notifications_user_all
    ON notifications (user_id, created_at DESC)
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('notifications');
};
