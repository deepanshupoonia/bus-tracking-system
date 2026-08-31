import { Router } from 'express';
import { authenticate,authorize } from '../middleware/auth.js';
import { create,list } from '../controllers/announcement.controller.js';
export const announcementRouter=Router();
announcementRouter.use(authenticate,authorize('STUDENT','DRIVER','ADMIN'));
announcementRouter.get('/',list);
announcementRouter.post('/',authorize('DRIVER','ADMIN'),create);
