import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { pool } from '../config/database.js';
if (!pool) throw new Error('DATABASE_URL is required to run migrations.');
await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
const applied = new Set((await pool.query('SELECT filename FROM schema_migrations')).rows.map((row) => row.filename));
const directory = fileURLToPath(new URL('./migrations/', import.meta.url));
for (const file of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
  if (applied.has(file)) continue;
  const client = await pool.connect();
  try { await client.query('BEGIN'); await client.query(await readFile(join(directory, file), 'utf8')); await client.query('INSERT INTO schema_migrations(filename) VALUES($1)', [file]); await client.query('COMMIT'); console.info(`Applied ${file}`); } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
await pool.end();
