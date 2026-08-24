import http from 'node:http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { checkDatabase } from './config/database.js';
import { checkRedis } from './config/redis.js';
import { env, validateEnvironment } from './config/env.js';
import { registerSocketHandlers } from './sockets/index.js';

validateEnvironment();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true
  }
});
registerSocketHandlers(io);

server.listen(env.port, async () => {
  const [databaseConnected, redisConnected] = await Promise.all([checkDatabase(), checkRedis()]);
  console.info(`API listening on http://localhost:${env.port}`);
  console.info(`PostgreSQL: ${databaseConnected ? 'connected' : 'unavailable'}`);
  console.info(`Redis: ${redisConnected ? 'connected' : 'unavailable'}`);
});

async function shutdown() {
  console.info('Shutting down server');
  server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
