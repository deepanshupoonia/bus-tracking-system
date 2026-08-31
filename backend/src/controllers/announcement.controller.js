import { z } from 'zod';
import * as announcements from '../services/announcement.service.js';
const schema=z.object({message:z.string().trim().min(3).max(500),busId:z.coerce.number().int().positive().optional()});
export async function list(_request,response) { response.json({success:true,data:{announcements:await announcements.listAnnouncements()}}); }
export async function create(request,response) { const announcement=await announcements.createAnnouncement(request.user,schema.parse(request.body)); request.app.get('io')?.emit('announcement:new',announcement); response.status(201).json({success:true,data:{announcement}}); }
