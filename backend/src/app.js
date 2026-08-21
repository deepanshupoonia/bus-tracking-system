import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { driverRouter } from './routes/driver.routes.js';
import { trackingRouter } from './routes/tracking.routes.js';
import { adminRouter } from './routes/admin.routes.js';

export const app = express();
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/driver', driverRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/admin', adminRouter);
app.use(notFoundHandler);
app.use(errorHandler);
