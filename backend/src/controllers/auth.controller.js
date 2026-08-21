import * as service from '../services/auth.service.js'; import { credentialsSchema,registerSchema } from '../validators/auth.validator.js';
export async function register(request,response) { const user=await service.registerStudent(registerSchema.parse(request.body)); response.status(201).json({success:true,data:{user}}); }
export async function login(request,response) { response.json({success:true,data:await service.login(credentialsSchema.parse(request.body))}); }
export async function me(request,response) { response.json({success:true,data:{user:await service.getUser(request.user.sub)}}); }
