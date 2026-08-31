import { useEffect, useRef, useState } from 'react';
import { LiveMap } from '../components/LiveMap.jsx';
import { api } from '../services/api.js';
import { createSocket } from '../services/socket.js';

const name = (stop) => stop?.name ?? '—';
const GPS_UPDATE_INTERVAL_MS = 5000;

export function DriverDashboard() {
  const [data, setData] = useState();
  const [error, setError] = useState(''); const [announcement,setAnnouncement]=useState(''); const [notice,setNotice]=useState('');
  const watch = useRef(); const socket = useRef(); const latestPosition = useRef(); const timer = useRef();
  const load = () => api.get('/driver/current-route').then((response) => setData(response.data.data)).catch((requestError) => setError(requestError.response?.data?.message));
  const sendLocation = () => {
    const position = latestPosition.current;
    if (!position) return;
    socket.current.emit('location:update', { latitude: position.coords.latitude, longitude: position.coords.longitude, speedKph: position.coords.speed ? Math.round(position.coords.speed * 3.6) : undefined }, (result) => { if (!result?.success) setError(result?.message ?? 'GPS update failed.'); else load(); });
  };
  const stopGps = () => { if (watch.current !== undefined) navigator.geolocation?.clearWatch(watch.current); clearInterval(timer.current); watch.current=undefined; timer.current=undefined; };
  useEffect(() => { socket.current = createSocket(); load(); return () => { stopGps(); socket.current?.disconnect(); }; }, []);
  const beginGps = () => {
    if (watch.current !== undefined) return;
    if (!navigator.geolocation) return setError('This browser does not support GPS.');
    watch.current = navigator.geolocation.watchPosition((position) => { latestPosition.current = position; sendLocation(); }, () => setError('GPS permission was denied or location is unavailable.'), { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
    clearInterval(timer.current); timer.current = setInterval(sendLocation, GPS_UPDATE_INTERVAL_MS);
  };
  useEffect(() => { if (data?.activeRoute) beginGps(); else stopGps(); return stopGps; }, [data?.activeRoute?.id]);
  const start = async () => { const response=await api.post('/driver/start-route'); setData(response.data.data); };
  const end = async () => { await api.post('/driver/end-route'); stopGps(); load(); };
  const publish=async(event)=>{event.preventDefault();setError('');try{await api.post('/announcements',{message:announcement});setAnnouncement('');setNotice('Message broadcast to all students.');}catch(requestError){setError(requestError.response?.data?.message??'Could not broadcast the message.');}};
  if (!data) return <p>Loading assignment…</p>;
  const bus = { ...data.assignment, ...data };
  return <section className="workspace"><div className="intro"><div><p className="eyebrow">IIT Ropar driver console</p><h1>{data.assignment.bus_number}</h1><p>{data.assignment.route_name}</p></div><div className="time-card"><span>GPS transmission</span><strong>Every 5 sec</strong><small>Resumes when this active route is reopened</small></div></div><div className="tracking-grid"><LiveMap bus={bus} /><aside className="arrival-card"><p className="section-label">Route status</p><h2>{data.activeRoute ? 'You are live' : 'Ready to depart'}</h2><p>Current stop: {name(data.currentStop)}</p><p>Next: {name(data.nextStop)}</p>{error && <p className="error">{error}</p>}{data.activeRoute ? <button className="danger" onClick={end}>End route</button> : <button onClick={start}>Start route & GPS</button>}</aside></div><form className="announcement-form" onSubmit={publish}><p className="section-label">Passenger alert</p><h2>Broadcast an important update</h2><textarea required minLength="3" maxLength="500" value={announcement} onChange={event=>setAnnouncement(event.target.value)} placeholder="e.g. Bus is delayed due to traffic near the main gate."/><button>Send to all students</button>{notice&&<p className="success">{notice}</p>}</form></section>;
}
