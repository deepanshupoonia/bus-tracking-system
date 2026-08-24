import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { HttpError } from '../utils/http-error.js';
import { busDetails, busSchedule } from './tracking.service.js';

export async function listUsers() {
  return (await pool.query(`SELECT u.id,u.name,u.email,u.role,u.created_at,d.license_number,d.phone FROM users u LEFT JOIN drivers d ON d.user_id=u.id ORDER BY u.created_at DESC`)).rows;
}
export async function listBuses() { return (await pool.query(`SELECT b.id,b.bus_number,b.status,r.name route_name,u.name driver_name FROM buses b LEFT JOIN routes r ON r.id=b.route_id LEFT JOIN bus_assignments a ON a.bus_id=b.id LEFT JOIN drivers d ON d.id=a.driver_id LEFT JOIN users u ON u.id=d.user_id ORDER BY b.bus_number`)).rows; }
export async function busOperations(busNumber) {
  const found = (await pool.query(`SELECT b.id,b.bus_number,b.registration_number,b.capacity,b.status,r.name route_name,u.name driver_name,u.email driver_email,d.license_number,d.phone FROM buses b LEFT JOIN routes r ON r.id=b.route_id LEFT JOIN bus_assignments a ON a.bus_id=b.id LEFT JOIN drivers d ON d.id=a.driver_id LEFT JOIN users u ON u.id=d.user_id WHERE UPPER(b.bus_number)=UPPER($1)`, [busNumber.trim()])).rows[0];
  if (!found) throw new HttpError(404, 'Bus number not found.');
  const [tracking, schedule] = await Promise.all([busDetails(found.id), busSchedule(found.id)]);
  const planned = schedule?.nextStop;
  let timing = null;
  if (planned) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const now = Number(parts.find((part) => part.type === 'hour').value) * 60 + Number(parts.find((part) => part.type === 'minute').value);
    const [hour, minute] = planned.expected_arrival_time.slice(0, 5).split(':').map(Number);
    const expected = hour * 60 + minute;
    timing = { expectedArrival: planned.expected_arrival_time.slice(0, 5), differenceMinutes: now - expected, status: now - expected > 2 ? 'LATE' : now - expected < -2 ? 'EARLY' : 'ON TIME' };
  }
  return { ...found, ...tracking, schedule, timing };
}

export async function createUser({ name, email, password, role, licenseNumber, phone, busId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = (await client.query(`INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,created_at`, [name, email.toLowerCase(), await bcrypt.hash(password, 12), role])).rows[0];
    if (role === 'DRIVER') { if (!(await client.query('SELECT id FROM buses WHERE id=$1 FOR UPDATE', [busId])).rowCount) throw new HttpError(400, 'Select a valid bus number.'); const driver=(await client.query(`INSERT INTO drivers(user_id,license_number,phone) VALUES($1,$2,$3) RETURNING id`, [user.id, licenseNumber, phone || null])).rows[0]; await client.query(`INSERT INTO bus_assignments(bus_id,driver_id) VALUES($1,$2) ON CONFLICT(bus_id) DO UPDATE SET driver_id=EXCLUDED.driver_id,assigned_at=NOW()`, [busId,driver.id]); }
    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') throw new HttpError(409, 'Email or driver licence already exists.');
    throw error;
  } finally { client.release(); }
}
