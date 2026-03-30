/**
 * @description Runs all pending migrations in order
 * @usedBy npm run migrate script in package.json
 */
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const config = require('../config/env');

const pool = new Pool({ connectionString: config.DATABASE_URL });

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        ran_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    for (const file of files) {
      const already = await client.query(
        'SELECT id FROM _migrations WHERE filename = $1',
        [file]
      );
      if (already.rows.length > 0) {
        console.log(`SKIP: ${file}`);
        continue;
      }
      console.log(`RUNNING: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      await client.query('BEGIN');
      await migration.up(client);
      await client.query(
        'INSERT INTO _migrations (filename) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      console.log(`DONE: ${file}`);
    }
    console.log('All migrations complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
