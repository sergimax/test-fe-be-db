// =============================================================================
// init-db.js — create tables on startup if they do not exist yet
// -----------------------------------------------------------------------------
// WHAT: Ensures the `notes` table is present before the API handles requests.
// WHY:  For a learning/demo project we skip a migration tool. One CREATE TABLE
//       IF NOT EXISTS keeps first-run simple. Real apps usually use migrations.
// HOW:  Call `initDb()` once from index.js before `app.listen`.
// =============================================================================

const { query } = require('./db');

async function initDb() {
  // SERIAL = auto-incrementing integer primary key (1, 2, 3, ...)
  // TEXT = unlimited string; fine for titles/bodies in a small app
  // TIMESTAMPTZ = timestamp with time zone; DEFAULT NOW() sets created_at
  await query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  console.log('Database ready: notes table exists (or was created)');
}

module.exports = { initDb };
