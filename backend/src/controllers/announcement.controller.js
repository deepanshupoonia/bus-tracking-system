import { z } from 'zod';
import * as announcements from '../services/announcement.service.js';
import { HttpError } from '../utils/http-error.js';
const schema=z.object({message:z.string().trim().min(3).max(500),busId:z.coerce.number().int().positive().optional()});
function normalizedError(error) { return error?.code === '42P01' ? new HttpError(503,'Announcements are not ready yet. Run the latest database migration and restart the API.') : error; }
export async function list(_request,response,next) { try { response.json({success:true,data:{announcements:await announcements.listAnnouncements()}}); } catch (error) { next(normalizedError(error)); } }
export async function create(request,response,next) { try { const announcement=await announcements.createAnnouncement(request.user,schema.parse(request.body)); request.app.get('io')?.emit('announcement:new',announcement); response.status(201).json({success:true,data:{announcement}}); } catch (error) { next(normalizedError(error)); } }
