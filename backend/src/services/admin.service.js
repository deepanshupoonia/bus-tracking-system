import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { HttpError } from '../utils/http-error.js';

export async function listUsers() {
  return (await pool.query(`SELECT u.id,u.name,u.email,u.role,u.created_at,d.license_number,d.phone FROM users u LEFT JOIN drivers d ON d.user_id=u.id ORDER BY u.created_at DESC`)).rows;
}

export async function createUser({ name, email, password, role, licenseNumber, phone }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = (await client.query(`INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,created_at`, [name, email.toLowerCase(), await bcrypt.hash(password, 12), role])).rows[0];
    if (role === 'DRIVER') await client.query(`INSERT INTO drivers(user_id,license_number,phone) VALUES($1,$2,$3)`, [user.id, licenseNumber, phone || null]);
    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') throw new HttpError(409, 'Email or driver licence already exists.');
    throw error;
  } finally { client.release(); }
}
