/**
 * Migration: 011_add_payment_idempotency_key
 * Purpose: Adds idempotency_key to payments to prevent duplicate submissions
 * Dependencies: 006_create_payments
 */
exports.up = async (client) => {
  await client.query(`
    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(36);
  `);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency
    ON payments (idempotency_key)
    WHERE idempotency_key IS NOT NULL;
  `);
};

exports.down = async (client) => {
  await client.query(`
    DROP INDEX IF EXISTS idx_payments_idempotency;
    ALTER TABLE payments DROP COLUMN IF EXISTS idempotency_key;
  `);
};
