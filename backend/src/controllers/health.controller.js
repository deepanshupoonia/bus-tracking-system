import { checkDatabase } from '../config/database.js';
import { checkRedis } from '../config/redis.js';

export async function getHealth(_request, response) {
  const [databaseConnected, redisConnected] = await Promise.all([checkDatabase(), checkRedis()]);
  response.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: databaseConnected ? 'connected' : 'unavailable',
        redis: redisConnected ? 'connected' : 'unavailable'
      }
    }
  });
}

