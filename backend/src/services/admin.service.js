import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { HttpError } from '../utils/http-error.js';
import { busDetails, busSchedule } from './tracking.service.js';

export async function listUsers() {
  return (await pool.query(`SELECT u.id,u.name,u.email,u.role,u.created_at,d.license_number,d.phone FROM users u LEFT JOIN drivers d ON d.user_id=u.id ORDER BY u.created_at DESC`)).rows;
}
export async function listBuses() { return (await pool.query(`SELECT b.id,b.bus_number,b.status,r.name route_name,u.name driver_name FROM buses b LEFT JOIN routes r ON r.id=b.route_id LEFT JOIN bus_assignments a ON a.bus_id=b.id LEFT JOIN drivers d ON d.id=a.driver_id LEFT JOIN users u ON u.id=d.user_id ORDER BY b.bus_number`)).rows; }
export async function listSchedules(busId) {
  const schedules=(await pool.query(`SELECT id,bus_id,schedule_name,days_of_week,departure_time::text,is_active FROM bus_schedules WHERE bus_id=$1 ORDER BY departure_time`,[busId])).rows;
  const stops=(await pool.query(`SELECT sst.schedule_id,sst.stop_order,sst.expected_arrival_time::text,s.name,s.latitude::float,s.longitude::float FROM schedule_stop_times sst JOIN stops s ON s.id=sst.stop_id WHERE sst.schedule_id=ANY($1::bigint[]) ORDER BY sst.schedule_id,sst.stop_order`,[schedules.map(schedule=>schedule.id)])).rows;
  const today=(await pool.query(`SELECT (NOW() AT TIME ZONE 'Asia/Kolkata')::date::text AS date`)).rows[0].date;
  const overrides=(await pool.query(`SELECT schedule_id,status,note FROM schedule_overrides WHERE service_date=$1`,[today])).rows;
  return schedules.map(schedule=>({...schedule,stops:stops.filter(stop=>String(stop.schedule_id)===String(schedule.id)),todayOverride:overrides.find(override=>String(override.schedule_id)===String(schedule.id))??null}));
}
export async function saveSchedule({ busId,scheduleName,daysOfWeek,departureTime,stops },scheduleId) {
  const client=await pool.connect();
  try { await client.query('BEGIN'); if(!(await client.query('SELECT id FROM buses WHERE id=$1 FOR UPDATE',[busId])).rowCount) throw new HttpError(404,'Bus not found.'); let schedule;
    if(scheduleId) { schedule=(await client.query(`UPDATE bus_schedules SET schedule_name=$1,days_of_week=$2,departure_time=$3 WHERE id=$4 AND bus_id=$5 RETURNING id,bus_id,schedule_name,days_of_week,departure_time::text,is_active`,[scheduleName,daysOfWeek.join(','),departureTime,scheduleId,busId])).rows[0]; if(!schedule) throw new HttpError(404,'Schedule not found for this bus.'); await client.query('DELETE FROM schedule_stop_times WHERE schedule_id=$1',[schedule.id]); }
    else schedule=(await client.query(`INSERT INTO bus_schedules(bus_id,schedule_name,days_of_week,departure_time) VALUES($1,$2,$3,$4) RETURNING id,bus_id,schedule_name,days_of_week,departure_time::text,is_active`,[busId,scheduleName,daysOfWeek.join(','),departureTime])).rows[0];
    for(let index=0;index<stops.length;index++) { const stop=stops[index]; let found=(await client.query('SELECT id FROM stops WHERE name=$1 AND latitude=$2 AND longitude=$3 LIMIT 1',[stop.name,stop.latitude,stop.longitude])).rows[0]; if(!found) found=(await client.query('INSERT INTO stops(name,latitude,longitude) VALUES($1,$2,$3) RETURNING id',[stop.name,stop.latitude,stop.longitude])).rows[0]; await client.query('INSERT INTO schedule_stop_times(schedule_id,stop_id,stop_order,expected_arrival_time) VALUES($1,$2,$3,$4)',[schedule.id,found.id,index+1,stop.arrivalTime]); }
    await client.query('COMMIT'); return schedule;
  } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
export async function setTodayScheduleStatus(scheduleId,status,note,userId) { const found=(await pool.query(`SELECT id FROM bus_schedules WHERE id=$1`,[scheduleId])).rowCount; if(!found) throw new HttpError(404,'Schedule not found.'); return (await pool.query(`INSERT INTO schedule_overrides(schedule_id,service_date,status,note,created_by) VALUES($1,(NOW() AT TIME ZONE 'Asia/Kolkata')::date,$2,$3,$4) ON CONFLICT(schedule_id,service_date) DO UPDATE SET status=EXCLUDED.status,note=EXCLUDED.note,created_by=EXCLUDED.created_by,created_at=NOW() RETURNING id,status,note,service_date`,[scheduleId,status,note??null,userId])).rows[0]; }
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
