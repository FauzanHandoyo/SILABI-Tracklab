require('dotenv').config();
const { Pool } = require('pg');

// Configure the PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false, // Disable SSL if not supported
});

module.exports = pool;