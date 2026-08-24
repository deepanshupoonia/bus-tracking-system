import { Router } from 'express';
import { getBus, getSchedule, listBuses } from '../controllers/tracking.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
export const trackingRouter = Router();
trackingRouter.use(authenticate, authorize('STUDENT','DRIVER','ADMIN'));
trackingRouter.get('/buses', listBuses);
trackingRouter.get('/buses/:id/schedule', getSchedule);
trackingRouter.get('/buses/:id', getBus);
