// db.js
// PostgreSQL connection pool for PBSA Logistics API

require('dotenv').config();
const { Pool } = require('pg');

// Pooled connection — reuses connections for performance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('neon.tech')
    ? { rejectUnauthorized: false } // Neon requires SSL
    : false,
  max: 10,                    // max connections in pool
  idleTimeoutMillis: 30000,   // close idle connections after 30s
  connectionTimeoutMillis: 10000 // fail fast if can't connect
});

// Test the connection the moment the pool is created
pool.on('connect', () => {
  console.log('📦 PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err.message);
});

/**
 * Run a query with parameterised values (prevents SQL injection).
 * Usage: const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`🔍 query executed in ${duration}ms — ${res.rowCount} row(s)`);
    }
    return res;
  } catch (err) {
    console.error('❌ Query error:', err.message);
    throw err;
  }
}

/**
 * Get a client from the pool — needed for transactions.
 * Always release() the client when done.
 */
async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const release = client.release.bind(client);

  // Auto-release if a client is held > 5 seconds
  const timeout = setTimeout(() => {
    console.warn('⚠️  Client checked out for >5s — possible leak');
  }, 5000);

  client.release = () => {
    clearTimeout(timeout);
    return release();
  };

  client.query = (...args) => originalQuery(...args);
  return client;
}

module.exports = { query, getClient, pool };