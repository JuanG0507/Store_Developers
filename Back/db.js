const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "data.sqlite");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombre TEXT,
    correo TEXT,
    documento TEXT,
    telefono TEXT,
    direccion TEXT,
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    items_json TEXT NOT NULL,
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migración: agregar columnas a tablas ya existentes (se ignora si ya existen)
["nombre", "correo", "documento", "telefono", "direccion", "avatar"].forEach(
  (col) => {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${col} TEXT;`);
    } catch (_) {
      /* columna ya existe */
    }
  }
);

module.exports = { db };

