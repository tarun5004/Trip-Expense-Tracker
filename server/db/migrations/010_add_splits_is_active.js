/**
 * Migration: 010_add_splits_is_active
 * Purpose: Adds is_active boolean to expense_splits for soft-delete support
 * Dependencies: 005_create_expense_splits
 */
exports.up = async (client) => {
  await client.query(`
    ALTER TABLE expense_splits
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_splits_expense_active
    ON expense_splits (expense_id)
    WHERE is_active = true;
  `);
};

exports.down = async (client) => {
  await client.query(`
    DROP INDEX IF EXISTS idx_splits_expense_active;
    ALTER TABLE expense_splits DROP COLUMN IF EXISTS is_active;
  `);
};
