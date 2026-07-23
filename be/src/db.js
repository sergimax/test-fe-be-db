// =============================================================================
// db.js — shared Postgres connection for the backend
// -----------------------------------------------------------------------------
// WHAT: Creates a connection pool and a small `query()` helper.
// WHY:  Opening a brand-new TCP connection for every HTTP request is slow.
//       A pool keeps a few connections ready and hands them out as needed.
// HOW:  Other files `require('./db')` and call `query(sql, params)`.
// =============================================================================

const { Pool } = require('pg');

// Pool reads PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE from process.env
// (loaded from .env via dotenv in index.js before this module is used).
// You can also pass connectionString: process.env.DATABASE_URL — same result.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Log unexpected idle-client errors so a bad connection does not crash silently.
pool.on('error', (error) => {
  console.error('Unexpected Postgres pool error:', error);
});

/**
 * Run a parameterized SQL statement.
 * Use $1, $2, ... placeholders and pass values in the params array.
 * That avoids SQL injection (never concatenate user input into SQL strings).
 *
 * @param {string} text - SQL, e.g. 'SELECT * FROM notes WHERE id = $1'
 * @param {unknown[]} [params] - values for $1, $2, ...
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  return pool.query(text, params);
}

module.exports = {
  pool,
  query,
};
