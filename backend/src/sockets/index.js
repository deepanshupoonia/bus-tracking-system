import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { updateLocation } from '../services/tracking.service.js';
import { locationSchema } from '../validators/location.validator.js';

export function registerSocketHandlers(io) {
  io.use((socket,next) => {
    try { socket.user=jwt.verify(socket.handshake.auth?.token,env.jwtSecret); next(); } catch { next(new Error('Unauthorized')); }
  });
  io.on('connection', (socket) => {
    console.info(`Socket connected: ${socket.id}`);
    socket.on('bus:join', (busId) => socket.join(`bus:${Number(busId)}`));
    socket.on('bus:leave', (busId) => socket.leave(`bus:${Number(busId)}`));
    socket.on('location:update', async (payload, callback) => {
      try {
        if (socket.user.role !== 'DRIVER') throw new Error('Drivers only');
        const update=await updateLocation(socket.user.sub,locationSchema.parse(payload));
        io.to(`bus:${update.busId}`).emit('bus:location',update);
        callback?.({success:true,data:update});
      } catch (error) { callback?.({success:false,message:error.message}); }
    });
    socket.on('disconnect', () => console.info(`Socket disconnected: ${socket.id}`));
  });
}
