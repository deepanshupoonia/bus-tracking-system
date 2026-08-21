import { Router } from 'express';
import { addUser, getUsers } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
export const adminRouter = Router();
adminRouter.use(authenticate, authorize('ADMIN'));
adminRouter.get('/users', getUsers);
adminRouter.post('/users', addUser);
