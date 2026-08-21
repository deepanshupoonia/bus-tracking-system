import { z } from 'zod';
import * as adminService from '../services/admin.service.js';

const newUserSchema = z.object({ name: z.string().min(2).max(100), email: z.string().email(), password: z.string().min(8).max(72), role: z.enum(['STUDENT','DRIVER','ADMIN']), licenseNumber: z.string().min(3).max(80).optional(), phone: z.string().max(30).optional() }).superRefine((value, context) => { if (value.role === 'DRIVER' && !value.licenseNumber) context.addIssue({ code: 'custom', path: ['licenseNumber'], message: 'Driver licence number is required.' }); });
export async function getUsers(_request, response) { response.json({ success: true, data: { users: await adminService.listUsers() } }); }
export async function addUser(request, response) { const user = await adminService.createUser(newUserSchema.parse(request.body)); response.status(201).json({ success: true, data: { user } }); }
