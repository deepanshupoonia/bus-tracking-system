import { pool } from '../config/database.js';
import { HttpError } from '../utils/http-error.js';

export async function listAnnouncements(userId) {
  return (await pool.query(`SELECT a.id,a.message,a.created_at,a.expires_at,a.bus_id,u.name author_name,u.role author_role,b.bus_number,
    (ar.announcement_id IS NOT NULL) AS is_read
    FROM announcements a JOIN users u ON u.id=a.author_id LEFT JOIN buses b ON b.id=a.bus_id
    LEFT JOIN announcement_reads ar ON ar.announcement_id=a.id AND ar.user_id=$1
    WHERE a.expires_at IS NULL OR a.expires_at > NOW() ORDER BY a.created_at DESC LIMIT 30`,[userId])).rows;
}

export async function markAnnouncementRead(userId, announcementId) {
  const read=(await pool.query(`INSERT INTO announcement_reads(announcement_id,user_id)
    SELECT id,$2 FROM announcements WHERE id=$1
    ON CONFLICT(announcement_id,user_id) DO UPDATE SET read_at=NOW()
    RETURNING announcement_id,read_at`,[announcementId,userId])).rows[0];
  if(!read) throw new HttpError(404,'Alert not found.');
  return read;
}

export async function createAnnouncement(user, { message, busId }) {
  if (user.role === 'DRIVER') {
    const assignment=(await pool.query(`SELECT b.id FROM drivers d JOIN bus_assignments ba ON ba.driver_id=d.id JOIN buses b ON b.id=ba.bus_id WHERE d.user_id=$1`,[user.sub])).rows[0];
    if(!assignment) throw new HttpError(404,'No bus is assigned to this driver.');
    busId=assignment.id;
  }
  const inserted=(await pool.query(`INSERT INTO announcements(author_id,bus_id,message) VALUES($1,$2,$3) RETURNING id`,[user.sub,busId??null,message.trim()])).rows[0];
  return (await pool.query(`SELECT a.id,a.message,a.created_at,a.expires_at,a.bus_id,u.name author_name,u.role author_role,b.bus_number
    FROM announcements a JOIN users u ON u.id=a.author_id LEFT JOIN buses b ON b.id=a.bus_id WHERE a.id=$1`,[inserted.id])).rows[0];
}
