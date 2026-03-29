/**
 * @fileoverview PostgreSQL connection pool setup using pg driver.
 * Provides a singleton pool and a helper query function with error wrapping.
 * @module config/db
 */

const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_SIZE,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

pool.on('connect', () => {
  if (env.NODE_ENV === 'development') {
    console.log('📦 New PostgreSQL client connected');
  }
});

/**
 * @description Execute a parameterized SQL query against the PostgreSQL pool.
 * @param {string} text - SQL query string with $1, $2, ... placeholders
 * @param {Array} [params=[]] - Parameter values for the query
 * @returns {Promise<import('pg').QueryResult>} The query result
 * @throws {Error} Re-throws database errors with context
 */
async function query(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (env.NODE_ENV === 'development') {
      console.log('🔍 Query executed', { text: text.substring(0, 80), duration: `${duration}ms`, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('❌ Database query error:', { text: text.substring(0, 80), error: error.message });
    throw error;
  }
}

/**
 * @description Get a client from the pool for transactions.
 * Caller MUST release the client when done (client.release()).
 * @returns {Promise<import('pg').PoolClient>} A PostgreSQL client
 */
async function getClient() {
  const client = await pool.connect();
  return client;
}

/**
 * @description Test database connection by running a simple query.
 * @returns {Promise<boolean>} true if connected
 * @throws {Error} If connection fails
 */
async function testConnection() {
  const result = await query('SELECT NOW()');
  console.log('✅ PostgreSQL connected:', result.rows[0].now);
  return true;
}

/**
 * @description Gracefully close the connection pool.
 * @returns {Promise<void>}
 */
async function closePool() {
  await pool.end();
  console.log('🔌 PostgreSQL pool closed');
}

module.exports = { pool, query, getClient, testConnection, closePool };
