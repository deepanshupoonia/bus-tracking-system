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
import { announcementRouter } from './routes/announcement.routes.js';

export const app = express();
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients such as Render health checks, but restrict browsers.
    if (!origin || env.corsOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/driver', driverRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/announcements', announcementRouter);
app.use(notFoundHandler);
app.use(errorHandler);
