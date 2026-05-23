const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

// Keep the DB file in server/data/ (created on first run, gitignored)
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "app.db"));
db.pragma("journal_mode = WAL"); // better concurrency
db.pragma("foreign_keys = ON"); // enforce relationships + cascade

// Data model: a trip has one start and many ordered destinations.
db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    start_label TEXT NOT NULL,
    start_lat   REAL NOT NULL,
    start_lng   REAL NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id     INTEGER NOT NULL,
    label       TEXT NOT NULL,
    lat         REAL NOT NULL,
    lng         REAL NOT NULL,
    visit_order INTEGER NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  );
`);

module.exports = db;
