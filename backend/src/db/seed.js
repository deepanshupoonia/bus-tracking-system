import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
if (!pool) throw new Error('DATABASE_URL is required to seed.');
const hash = await bcrypt.hash('College@123', 12); const client = await pool.connect();
try {
  await client.query('BEGIN');
  for (const [name,email,role] of [['Demo Student','student@college.test','STUDENT'],['Demo Driver','driver@college.test','DRIVER'],['System Admin','admin@college.test','ADMIN']]) await client.query(`INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING`, [name,email,hash,role]);
  const driverUser = (await client.query(`SELECT id FROM users WHERE email='driver@college.test'`)).rows[0];
  await client.query(`INSERT INTO drivers(user_id,license_number,phone) VALUES($1,'DL-DEMO-1024','9999999999') ON CONFLICT(user_id) DO NOTHING`, [driverUser.id]);
  const routeId = (await client.query(`INSERT INTO routes(name,description) VALUES('IIT Ropar Campus Loop','Demonstration loop around IIT Ropar, Rupnagar.') ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id`)).rows[0].id;
  const stopRows = [['Hostel Gate',30.975900,76.539100],['Main Gate',30.973900,76.538000],['Academic Block',30.975000,76.541500],['Library',30.973900,76.542600]];
  for (let i=0;i<stopRows.length;i++) { const [name,latitude,longitude]=stopRows[i]; let stop=(await client.query('SELECT id FROM stops WHERE name=$1',[name])).rows[0]; if (!stop) stop=(await client.query('INSERT INTO stops(name,latitude,longitude) VALUES($1,$2,$3) RETURNING id',[name,latitude,longitude])).rows[0]; await client.query('INSERT INTO route_stops(route_id,stop_id,stop_order) VALUES($1,$2,$3) ON CONFLICT(route_id,stop_id) DO NOTHING',[routeId,stop.id,i+1]); }
  const busId=(await client.query(`INSERT INTO buses(bus_number,registration_number,capacity,route_id) VALUES('BUS-12','PB-01-CB-1200',40,$1) ON CONFLICT(bus_number) DO UPDATE SET route_id=$1 RETURNING id`,[routeId])).rows[0].id;
  const driverId=(await client.query('SELECT id FROM drivers WHERE user_id=$1',[driverUser.id])).rows[0].id;
  await client.query('INSERT INTO bus_assignments(bus_id,driver_id) VALUES($1,$2) ON CONFLICT(bus_id) DO UPDATE SET driver_id=EXCLUDED.driver_id',[busId,driverId]);
  await client.query('COMMIT'); console.info('Seed complete. Demo accounts use password: College@123');
} catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); await pool.end(); }
