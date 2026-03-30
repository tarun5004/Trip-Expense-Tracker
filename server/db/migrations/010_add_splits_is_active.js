/**
 * @description Migration: Add is_active column for soft-delete support
 */

module.exports = {
  /**
   * @param {object} client - pg client
   */
  async up(client) {
    await client.query(`
      ALTER TABLE expense_splits 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
    `);

    // We name the index implicitly or let Postgres name it, but let's be explicit
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_expense_splits_active 
      ON expense_splits (expense_id) 
      WHERE is_active = true;
    `);
  },

  /**
   * @param {object} client - pg client
   */
  async down(client) {
    await client.query(`
      DROP INDEX IF EXISTS idx_expense_splits_active;
    `);

    await client.query(`
      ALTER TABLE expense_splits 
      DROP COLUMN IF EXISTS is_active;
    `);
  }
};
