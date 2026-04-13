const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'calendar.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT    NOT NULL,
    date        TEXT    NOT NULL,
    copy        TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'draft',
    image_query TEXT,
    image_url   TEXT,
    notes       TEXT,
    best_time   TEXT,
    google_event_id TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS brand_examples (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    type       TEXT,
    copy       TEXT    NOT NULL,
    url        TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migrate: add url column to brand_examples if it doesn't exist yet
try {
  db.exec(`ALTER TABLE brand_examples ADD COLUMN url TEXT`);
} catch (_) { /* column already exists — safe to ignore */ }

module.exports = db;
