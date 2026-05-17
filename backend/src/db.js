const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas (
      id         SERIAL PRIMARY KEY,
      nombre     TEXT NOT NULL,
      email      TEXT NOT NULL,
      telefono   TEXT NOT NULL,
      experiencia TEXT NOT NULL,
      fecha      DATE NOT NULL,
      hora       TEXT NOT NULL,
      personas   INTEGER NOT NULL DEFAULT 2,
      mensaje    TEXT,
      estado     TEXT NOT NULL DEFAULT 'pendiente',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

module.exports = { pool, initDb };
