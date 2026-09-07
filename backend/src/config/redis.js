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
    // With lazyConnect, Redis starts in "wait". Awaiting the connection avoids
    // reporting a false "unavailable" state while Redis Cloud is still opening
    // its TLS connection.
    if (redis.status === 'wait') await redis.connect();
    return (await redis.ping()) === 'PONG';
  } catch {
    return false;
  }
}
