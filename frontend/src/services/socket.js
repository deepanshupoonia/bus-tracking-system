import { io } from 'socket.io-client';
const defaultSocketUrl = import.meta.env.DEV
  ? 'http://localhost:4000'
  : 'https://bus-tracking-system-oqnw.onrender.com';

export function createSocket() { return io(import.meta.env.VITE_SOCKET_URL ?? defaultSocketUrl,{auth:{token:localStorage.getItem('bus_token')}}); }
