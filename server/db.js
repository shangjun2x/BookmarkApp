const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'bookmarks.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS groups_table (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      user_id INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES groups_table(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(name, user_id)
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_public INTEGER DEFAULT 0,
      group_id INTEGER,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups_table(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmark_tags (
      bookmark_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (bookmark_id, tag_id),
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_bookmark_groups (
      user_id INTEGER NOT NULL,
      bookmark_id INTEGER NOT NULL,
      group_id INTEGER,
      PRIMARY KEY (user_id, bookmark_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES groups_table(id) ON DELETE SET NULL
    );
  `);

  // Seed default settings
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('max_card_count', '100000');

  // Migration: add is_public column if missing (for existing databases)
  try {
    db.prepare("SELECT is_public FROM bookmarks LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE bookmarks ADD COLUMN is_public INTEGER DEFAULT 0");
  }

  // Migration: add bg_color column if missing
  try {
    db.prepare("SELECT bg_color FROM bookmarks LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE bookmarks ADD COLUMN bg_color TEXT DEFAULT NULL");
  }

  // Migration: drop old global unique index and create scoped indexes
  try { db.exec("DROP INDEX IF EXISTS idx_bookmarks_url_visibility"); } catch {}
  try {
    // Public bookmarks: globally unique per URL
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_url_public ON bookmarks (url) WHERE is_public = 1");
    // Private bookmarks: unique per user per URL
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_url_user_private ON bookmarks (url, user_id) WHERE is_public = 0");
  } catch {
    // Index may already exist or data has duplicates — skip
  }
}

module.exports = { getDb };
