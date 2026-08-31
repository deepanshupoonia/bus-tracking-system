import { z } from 'zod';
import * as adminService from '../services/admin.service.js';

const newUserSchema = z.object({ name: z.string().min(2).max(100), email: z.string().email(), password: z.string().min(8).max(72), role: z.enum(['STUDENT','DRIVER','ADMIN']), licenseNumber: z.string().min(3).max(80).optional(), phone: z.string().max(30).optional(), busId: z.coerce.number().int().positive().optional() }).superRefine((value, context) => { if (value.role === 'DRIVER' && !value.licenseNumber) context.addIssue({ code: 'custom', path: ['licenseNumber'], message: 'Driver licence number is required.' }); if (value.role === 'DRIVER' && !value.busId) context.addIssue({ code: 'custom', path: ['busId'], message: 'A bus number is required for every driver.' }); });
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/,'Use a 24-hour time such as 08:30.');
const scheduleSchema=z.object({busId:z.coerce.number().int().positive(),scheduleName:z.string().trim().min(2).max(120),daysOfWeek:z.array(z.enum(['MON','TUE','WED','THU','FRI','SAT','SUN'])).min(1),departureTime:time,stops:z.array(z.object({name:z.string().trim().min(2).max(120),arrivalTime:time,latitude:z.coerce.number().min(-90).max(90),longitude:z.coerce.number().min(-180).max(180)})).min(2).max(50)});
const userEditSchema=z.object({name:z.string().trim().min(2).max(100),email:z.string().email(),licenseNumber:z.string().trim().min(3).max(80).optional(),phone:z.string().trim().max(30).optional()});
export async function getUsers(_request, response) { response.json({ success: true, data: { users: await adminService.listUsers() } }); }
export async function getBuses(_request, response) { response.json({ success: true, data: { buses: await adminService.listBuses() } }); }
export async function getBusOperations(request, response) { response.json({ success: true, data: { bus: await adminService.busOperations(request.params.busNumber) } }); }
export async function addUser(request, response) { const user = await adminService.createUser(newUserSchema.parse(request.body)); response.status(201).json({ success: true, data: { user } }); }
export async function getSchedules(request,response) { response.json({success:true,data:{schedules:await adminService.listSchedules(Number(request.params.busId))}}); }
export async function addSchedule(request,response) { response.status(201).json({success:true,data:{schedule:await adminService.saveSchedule(scheduleSchema.parse(request.body))}}); }
export async function editSchedule(request,response) { response.json({success:true,data:{schedule:await adminService.saveSchedule(scheduleSchema.parse(request.body),Number(request.params.scheduleId))}}); }
export async function todayScheduleStatus(request,response) { const body=z.object({status:z.enum(['CANCELLED','ACTIVE']),note:z.string().trim().max(500).optional()}).parse(request.body); response.json({success:true,data:{override:await adminService.setTodayScheduleStatus(Number(request.params.scheduleId),body.status,body.note,request.user.sub)}}); }
export async function editUser(request,response) { response.json({success:true,data:{user:await adminService.updateUser(Number(request.params.id),userEditSchema.parse(request.body))}}); }
export async function deleteUser(request,response) { response.json({success:true,data:await adminService.removeUser(Number(request.params.id),request.user.sub)}); }
