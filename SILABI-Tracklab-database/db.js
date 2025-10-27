require('dotenv').config();
const { Pool } = require('pg');

// Configure the PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  keepAlive: true,
  idleTimeoutMillis: 60 * 1000,        // close idle clients sooner
  connectionTimeoutMillis: 20 * 1000,  // fail fast on connect
});

pool.on('error', (err) => {
  console.error('Unexpected idle client error', err?.message || err);
});
module.exports = pool;