import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];

function parseCorsOrigins(value) {
  return value
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN ?? 'http://localhost:5173'),
  jwtSecret: process.env.JWT_SECRET,
  locationLiveThresholdSeconds: Number(process.env.LOCATION_LIVE_THRESHOLD_SECONDS ?? 15),
  locationDelayedThresholdSeconds: Number(process.env.LOCATION_DELAYED_THRESHOLD_SECONDS ?? 60)
};

export function validateEnvironment() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment configuration: ${missing.join(', ')}`);
  }
}
