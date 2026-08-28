import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const initSqlJs = require('sql.js');

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const dataDir = join(rootDir, 'data');
const dbPath = join(dataDir, 'app.db');

mkdirSync(dataDir, { recursive: true });

let db;

function persist() {
  const data = db.export();
  writeFileSync(dbPath, Buffer.from(data));
}

function statement(sql) {
  return {
    run() {
      const params = Array.prototype.slice.call(arguments);
      db.run(sql, params);
      const result = db.exec('SELECT last_insert_rowid() AS id');
      const lastInsertRowid = result.length ? result[0].values[0][0] : 0;
      persist();
      return { lastInsertRowid };
    },
    get() {
      const params = Array.prototype.slice.call(arguments);
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const row = stmt.step() ? stmt.getAsObject() : undefined;
      stmt.free();
      return row;
    },
  };
}

function wrap(raw) {
  db = raw;
  return {
    exec(sql) {
      db.exec(sql);
      persist();
    },
    prepare(sql) {
      return statement(sql);
    },
  };
}

export async function initDb() {
  if (db) return;
  const SQL = await initSqlJs({
    locateFile: (file) => join(rootDir, 'node_modules', 'sql.js', 'dist', file),
  });
  const raw = existsSync(dbPath)
    ? new SQL.Database(readFileSync(dbPath))
    : new SQL.Database();

  wrap(raw).exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone_country TEXT,
      phone TEXT,
      dob TEXT,
      gender TEXT,
      address TEXT,
      height TEXT,
      weight TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `);
}

export function getDb() {
  if (!db) throw new Error('Database is not initialized');
  return {
    prepare(sql) {
      return statement(sql);
    },
  };
}
