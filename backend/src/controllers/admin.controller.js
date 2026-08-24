import { z } from 'zod';
import * as adminService from '../services/admin.service.js';

const newUserSchema = z.object({ name: z.string().min(2).max(100), email: z.string().email(), password: z.string().min(8).max(72), role: z.enum(['STUDENT','DRIVER','ADMIN']), licenseNumber: z.string().min(3).max(80).optional(), phone: z.string().max(30).optional(), busId: z.coerce.number().int().positive().optional() }).superRefine((value, context) => { if (value.role === 'DRIVER' && !value.licenseNumber) context.addIssue({ code: 'custom', path: ['licenseNumber'], message: 'Driver licence number is required.' }); if (value.role === 'DRIVER' && !value.busId) context.addIssue({ code: 'custom', path: ['busId'], message: 'A bus number is required for every driver.' }); });
export async function getUsers(_request, response) { response.json({ success: true, data: { users: await adminService.listUsers() } }); }
export async function getBuses(_request, response) { response.json({ success: true, data: { buses: await adminService.listBuses() } }); }
export async function getBusOperations(request, response) { response.json({ success: true, data: { bus: await adminService.busOperations(request.params.busNumber) } }); }
export async function addUser(request, response) { const user = await adminService.createUser(newUserSchema.parse(request.body)); response.status(201).json({ success: true, data: { user } }); }
