import axios from 'axios';
const defaultApiUrl = import.meta.env.DEV
  ? 'http://localhost:4000/api'
  : 'https://bus-tracking-system-oqnw.onrender.com/api';

export const api=axios.create({baseURL:import.meta.env.VITE_API_URL ?? defaultApiUrl});
export function setToken(token) { if(token) api.defaults.headers.common.Authorization=`Bearer ${token}`; else delete api.defaults.headers.common.Authorization; }
