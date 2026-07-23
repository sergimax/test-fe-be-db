// =============================================================================
// index.js — Express HTTP API (hello + health + notes CRUD)
// -----------------------------------------------------------------------------
// Flow on startup:
//   1. Load .env so DATABASE_URL / PG* are available
//   2. Create Express app and JSON body parser
//   3. initDb() creates the notes table if needed
//   4. Listen on port 3000
// =============================================================================

require('dotenv').config();

const express = require('express');
const { query } = require('./db');
const { initDb } = require('./init-db');

const app = express();
const port = 3000;

// Parse JSON bodies on POST/PUT (req.body becomes a JS object).
app.use(express.json());

// ---------------------------------------------------------------------------
// Existing smoke endpoint (no DB) — frontend can still hit this.
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  const message = {
    message: 'Hello from the backend!',
    timestamp: new Date().toISOString(),
  };
  res.send(message);
});

// ---------------------------------------------------------------------------
// GET /health — proves Node can reach Postgres (runs SELECT 1).
// ---------------------------------------------------------------------------
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ---------------------------------------------------------------------------
// Notes CRUD
// Create = POST, Read = GET, Update = PUT, Delete = DELETE
// ---------------------------------------------------------------------------

// List all notes (newest first).
app.get('/notes', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, title, body, created_at FROM notes ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List notes failed:', error);
    res.status(500).json({ error: 'Failed to list notes' });
  }
});

// Get one note by id.
app.get('/notes/:id', async (req, res) => {
  try {
    const noteId = Number(req.params.id);
    if (!Number.isInteger(noteId) || noteId < 1) {
      return res.status(400).json({ error: 'Invalid note id' });
    }

    const result = await query(
      'SELECT id, title, body, created_at FROM notes WHERE id = $1',
      [noteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get note failed:', error);
    res.status(500).json({ error: 'Failed to get note' });
  }
});

// Create a note. Body: { "title": "...", "body": "..." }
app.post('/notes', async (req, res) => {
  try {
    const title = req.body?.title;
    const body = req.body?.body ?? '';

    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title is required' });
    }
    if (typeof body !== 'string') {
      return res.status(400).json({ error: 'body must be a string' });
    }

    const result = await query(
      `INSERT INTO notes (title, body)
       VALUES ($1, $2)
       RETURNING id, title, body, created_at`,
      [title.trim(), body]
    );

    // 201 Created — standard for successful resource creation
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create note failed:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Replace title/body of an existing note.
app.put('/notes/:id', async (req, res) => {
  try {
    const noteId = Number(req.params.id);
    if (!Number.isInteger(noteId) || noteId < 1) {
      return res.status(400).json({ error: 'Invalid note id' });
    }

    const title = req.body?.title;
    const body = req.body?.body;

    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title is required' });
    }
    if (typeof body !== 'string') {
      return res.status(400).json({ error: 'body must be a string' });
    }

    const result = await query(
      `UPDATE notes
       SET title = $1, body = $2
       WHERE id = $3
       RETURNING id, title, body, created_at`,
      [title.trim(), body, noteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update note failed:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note by id.
app.delete('/notes/:id', async (req, res) => {
  try {
    const noteId = Number(req.params.id);
    if (!Number.isInteger(noteId) || noteId < 1) {
      return res.status(400).json({ error: 'Invalid note id' });
    }

    const result = await query(
      'DELETE FROM notes WHERE id = $1 RETURNING id',
      [noteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // 204 No Content — success with empty body
    res.status(204).send();
  } catch (error) {
    console.error('Delete note failed:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Start only after the table is ready (or fail loudly if Postgres is down).
async function start() {
  try {
    await initDb();
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.error('Could not start server — is Postgres running?', error.message);
    console.error('Hint: from repo root run: docker compose up -d');
    process.exit(1);
  }
}

start();
