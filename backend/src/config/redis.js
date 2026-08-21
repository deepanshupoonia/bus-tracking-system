import Redis from 'ioredis';
import { env } from './env.js';

export const redis = env.redisUrl
  ? new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      retryStrategy: () => null
    })
  : null;

export async function checkRedis() {
  if (!redis) return false;
  try {
    if (redis.status === 'wait') redis.connect().catch(() => {});
    return redis.status === 'ready' && (await redis.ping()) === 'PONG';
  } catch {
    return false;
  }
}
