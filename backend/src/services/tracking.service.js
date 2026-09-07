import { pool } from '../config/database.js'; import { redis } from '../config/redis.js'; import { env } from '../config/env.js'; import { distanceInMeters } from '../utils/geo.js'; import { HttpError } from '../utils/http-error.js';

const locationKey = (busId) => `bus:${busId}:location`;

function locationStatus(location) {
  if (!location?.recordedAt) return 'UNAVAILABLE';
  const ageSeconds = Math.max(0, (Date.now() - new Date(location.recordedAt).getTime()) / 1000);
  if (ageSeconds <= env.locationLiveThresholdSeconds) return 'LIVE';
  if (ageSeconds <= env.locationDelayedThresholdSeconds) return 'DELAYED';
  return 'LAST_KNOWN';
}
export async function assignmentForDriver(userId) { return (await pool.query(`SELECT d.id driver_id,b.id bus_id,b.bus_number,b.status,r.id route_id,r.name route_name FROM drivers d JOIN bus_assignments a ON a.driver_id=d.id JOIN buses b ON b.id=a.bus_id LEFT JOIN routes r ON r.id=b.route_id WHERE d.user_id=$1`,[userId])).rows[0]; }
export async function routeStops(routeId) { return (await pool.query(`SELECT s.id,s.name,s.latitude::float,s.longitude::float,rs.stop_order FROM route_stops rs JOIN stops s ON s.id=rs.stop_id WHERE rs.route_id=$1 AND s.latitude IS NOT NULL AND s.longitude IS NOT NULL ORDER BY rs.stop_order`,[routeId])).rows; }
async function latest(busId) {
  if (!redis) throw new HttpError(503, 'Live location service is unavailable. Configure REDIS_URL.');

  try {
    const value = await redis.get(locationKey(busId));
    return value ? JSON.parse(value) : null;
  } catch (error) {
    // A malformed value must not keep breaking reads for this bus.
    if (error instanceof SyntaxError) await redis.del(locationKey(busId)).catch(() => {});
    throw new HttpError(503, 'Live location service is temporarily unavailable.');
  }
}
function progress(location,stops) { if(!location||!stops.length) return {currentStop:null,nextStop:stops[0]??null}; const index=stops.reduce((best,stop,i)=>distanceInMeters(location.latitude,location.longitude,stop.latitude,stop.longitude)<best.distance?{i,distance:distanceInMeters(location.latitude,location.longitude,stop.latitude,stop.longitude)}:best,{i:0,distance:Infinity}).i; return {currentStop:stops[index],nextStop:stops[index+1]??null}; }
export async function driverSnapshot(userId) { const assignment=await assignmentForDriver(userId); if(!assignment) throw new HttpError(404,'No bus is assigned to this driver.'); const stops=await routeStops(assignment.route_id); const location=await latest(assignment.bus_id); const active=(await pool.query('SELECT id,started_at FROM active_routes WHERE bus_id=$1 AND ended_at IS NULL',[assignment.bus_id])).rows[0]; return {assignment,activeRoute:active??null,location,locationStatus:locationStatus(location),...progress(location,stops)}; }
export async function startRoute(userId) { const assignment=await assignmentForDriver(userId); if(!assignment) throw new HttpError(404,'No bus is assigned to this driver.'); await pool.query(`INSERT INTO active_routes(bus_id,driver_id,route_id) VALUES($1,$2,$3) ON CONFLICT(bus_id) DO UPDATE SET driver_id=EXCLUDED.driver_id,route_id=EXCLUDED.route_id,started_at=NOW(),ended_at=NULL`,[assignment.bus_id,assignment.driver_id,assignment.route_id]); await pool.query(`UPDATE buses SET status='ACTIVE' WHERE id=$1`,[assignment.bus_id]); return driverSnapshot(userId); }
export async function endRoute(userId) { const assignment=await assignmentForDriver(userId); if(!assignment) throw new HttpError(404,'No bus is assigned to this driver.'); await pool.query('UPDATE active_routes SET ended_at=NOW() WHERE bus_id=$1 AND ended_at IS NULL',[assignment.bus_id]); await pool.query(`UPDATE buses SET status='INACTIVE' WHERE id=$1`,[assignment.bus_id]); return driverSnapshot(userId); }
export async function updateLocation(userId,{latitude,longitude,speedKph}) { const assignment=await assignmentForDriver(userId); if(!assignment) throw new HttpError(404,'No bus is assigned to this driver.'); const active=(await pool.query('SELECT id FROM active_routes WHERE bus_id=$1 AND ended_at IS NULL',[assignment.bus_id])).rowCount; if(!active) throw new HttpError(409,'Start your route before sending location.'); if(!redis) throw new HttpError(503,'Live location service is unavailable. Configure REDIS_URL.'); const location={latitude,longitude,speedKph:speedKph??null,recordedAt:new Date().toISOString()}; await pool.query('INSERT INTO location_history(bus_id,latitude,longitude,speed_kph) VALUES($1,$2,$3,$4)',[assignment.bus_id,latitude,longitude,speedKph??null]); try { await redis.set(locationKey(assignment.bus_id),JSON.stringify(location)); } catch { throw new HttpError(503,'Live location service is temporarily unavailable.'); } return {busId:assignment.bus_id,location,locationStatus:'LIVE',...progress(location,await routeStops(assignment.route_id))}; }
export async function busesForStudents() { const buses=(await pool.query(`SELECT b.id,b.bus_number,b.status,r.name route_name,r.id route_id FROM buses b LEFT JOIN routes r ON r.id=b.route_id ORDER BY b.bus_number`)).rows; return Promise.all(buses.map(async(bus)=>{const location=await latest(bus.id); const stops=await routeStops(bus.route_id); return {...bus,location,locationStatus:locationStatus(location),...progress(location,stops)};})); }
export async function busDetails(id) { const bus=(await pool.query(`SELECT b.id,b.bus_number,b.status,r.name route_name,r.id route_id FROM buses b LEFT JOIN routes r ON r.id=b.route_id WHERE b.id=$1`,[id])).rows[0]; if(!bus) throw new HttpError(404,'Bus not found.'); const stops=await routeStops(bus.route_id); const location=await latest(bus.id); return {...bus,location,locationStatus:locationStatus(location),stops,...progress(location,stops)}; }
function indiaClock(date) { return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date); }
function indiaDate(date) { const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date); const value=type=>parts.find(part=>part.type===type).value; return `${value('year')}-${value('month')}-${value('day')}`; }
export async function busSchedule(id) {
  const now=new Date(); const today=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',weekday:'short'}).format(now).toUpperCase(); const clock=indiaClock(now);
  const all=(await pool.query(`SELECT id,schedule_name,days_of_week,departure_time::text FROM bus_schedules WHERE bus_id=$1 AND is_active=true ORDER BY departure_time`,[id])).rows;
  if(!all.length)return null;
  let schedule; let daysAhead=0; let serviceDay=today; let serviceDate=indiaDate(now);
  for(let offset=0;offset<=7&&!schedule;offset++) { const date=new Date(now.getTime()+offset*86400000); const day=offset===0?today:new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',weekday:'short'}).format(date).toUpperCase(); const candidates=all.filter(item=>item.days_of_week.includes(day)&&(offset>0||item.departure_time.slice(0,5)>=clock)); if(!candidates.length) continue; const cancelled=new Set((await pool.query(`SELECT schedule_id FROM schedule_overrides WHERE service_date=$1 AND status='CANCELLED'`,[indiaDate(date)])).rows.map(row=>String(row.schedule_id))); const candidate=candidates.find(item=>!cancelled.has(String(item.id))); if(candidate) { schedule=candidate; daysAhead=offset; serviceDay=day; serviceDate=indiaDate(date); } }
  if(!schedule)return null;
  const stops=(await pool.query(`SELECT s.name,s.latitude::float,s.longitude::float,sst.stop_order,sst.expected_arrival_time::text FROM schedule_stop_times sst JOIN stops s ON s.id=sst.stop_id WHERE sst.schedule_id=$1 ORDER BY sst.stop_order`,[schedule.id])).rows;
  const nextStop=daysAhead ? stops[0] : stops.find(stop=>stop.expected_arrival_time.slice(0,5)>=clock)??stops[0];
  return {...schedule,stops,nextStop,serviceDay,serviceDate,isNextServiceDay:daysAhead>0,daysAhead};
}
