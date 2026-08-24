import { Router } from 'express';
import { addUser, getBuses, getBusOperations, getUsers } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
export const adminRouter = Router();
adminRouter.use(authenticate, authorize('ADMIN'));
adminRouter.get('/users', getUsers);
adminRouter.get('/buses', getBuses);
adminRouter.get('/buses/:busNumber/operations', getBusOperations);
adminRouter.post('/users', addUser);
