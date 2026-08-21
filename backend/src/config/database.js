import pg from 'pg';
import { env } from './env.js';

export const pool = env.databaseUrl
  ? new pg.Pool({ connectionString: env.databaseUrl, connectionTimeoutMillis: 2000 })
  : null;

export async function checkDatabase() {
  if (!pool) return false;
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
