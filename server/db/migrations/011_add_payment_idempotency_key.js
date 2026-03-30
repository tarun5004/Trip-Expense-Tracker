/**
 * @description Migration: Add idempotency constraint layer onto payments avoiding massive double click flaws.
 */

module.exports = {
  /**
   * @param {object} client - pg client 
   */
  async up(client) {
    await client.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(36) UNIQUE;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency
      ON payments (idempotency_key)
      WHERE idempotency_key IS NOT NULL;
    `);
  },

  /**
   * @param {object} client - pg client
   */
  async down(client) {
    await client.query(`
      DROP INDEX IF EXISTS idx_payments_idempotency;
    `);
    
    await client.query(`
      ALTER TABLE payments 
      DROP COLUMN IF EXISTS idempotency_key;
    `);
  }
};
