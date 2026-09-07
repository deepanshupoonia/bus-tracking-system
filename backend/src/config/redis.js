import Redis from 'ioredis';
import { env } from './env.js';

export const LOCATION_UPDATES_CHANNEL = 'bus:location_updates';

const redisOptions = {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  connectTimeout: 10_000,
  retryStrategy: (attempt) => Math.min(attempt * 500, 10_000),
  autoResubscribe: true
};

function createClient(name) {
  if (!env.redisUrl) return null;
  const client = new Redis(env.redisUrl, redisOptions);
  client.on('ready', () => console.info(`[Redis] ${name} connected`));
  client.on('reconnecting', (delay) => console.warn(`[Redis] ${name} reconnecting in ${delay}ms`));
  client.on('error', (error) => console.error(`[Redis] ${name} error: ${error.message}`));
  return client;
}

// Redis clients cannot safely switch between commands and SUBSCRIBE mode.
export const redis = createClient('command client');
export const redisPublisher = createClient('publisher');
export const redisSubscriber = createClient('subscriber');

let socketServer = null;
let locationChannelSubscribed = false;

async function connect(client) {
  if (client?.status === 'wait') await client.connect();
}

export async function checkRedis() {
  if (!redis) return false;
  try {
    await connect(redis);
    return (await redis.ping()) === 'PONG';
  } catch (error) {
    console.error(`[Redis] command client error: ${error.message}`);
    return false;
  }
}

export async function publishLocationUpdate(update) {
  if (!redisPublisher) throw new Error('REDIS_URL is not configured.');
  try {
    await connect(redisPublisher);
    const subscriberCount = await redisPublisher.publish(LOCATION_UPDATES_CHANNEL, JSON.stringify(update));
    console.info(`[Redis] Message published to ${LOCATION_UPDATES_CHANNEL} for bus ${update.busId} (${subscriberCount} subscriber${subscriberCount === 1 ? '' : 's'})`);
  } catch (error) {
    console.error(`[Redis] publisher error: ${error.message}`);
    throw error;
  }
}

function broadcastLocationUpdate(channel, message) {
  if (channel !== LOCATION_UPDATES_CHANNEL) return;
  try {
    const update = JSON.parse(message);
    if (!Number.isInteger(Number(update.busId)) || !update.location) throw new Error('Invalid location update payload.');
    console.info(`[Redis] Message received from ${LOCATION_UPDATES_CHANNEL} for bus ${update.busId}`);
    socketServer?.to(`bus:${Number(update.busId)}`).emit('bus:location', update);
  } catch (error) {
    console.error(`[Redis] subscriber error: ${error.message}`);
  }
}

export async function subscribeToLocationUpdates(io) {
  socketServer = io;
  if (!redisSubscriber) {
    console.error('[Redis] subscriber error: REDIS_URL is not configured.');
    return false;
  }
  try {
    await connect(redisSubscriber);
    if (!locationChannelSubscribed) {
      redisSubscriber.on('message', broadcastLocationUpdate);
      await redisSubscriber.subscribe(LOCATION_UPDATES_CHANNEL);
      locationChannelSubscribed = true;
      console.info(`[Redis] Channel subscribed: ${LOCATION_UPDATES_CHANNEL}`);
    }
    return true;
  } catch (error) {
    console.error(`[Redis] subscriber error: ${error.message}`);
    return false;
  }
}

export async function closeRedisConnections() {
  await Promise.all([redis, redisPublisher, redisSubscriber].map(async (client) => {
    if (!client || client.status === 'wait' || client.status === 'end') return;
    try {
      await client.quit();
    } catch (error) {
      console.error(`[Redis] shutdown error: ${error.message}`);
      client.disconnect();
    }
  }));
  console.info('[Redis] connections closed');
}
