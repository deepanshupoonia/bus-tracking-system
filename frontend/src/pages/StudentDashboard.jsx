import { useEffect, useState } from 'react';
import { LiveMap } from '../components/LiveMap.jsx';
import { api } from '../services/api.js';
import { createSocket } from '../services/socket.js';

const name = (stop) => stop?.name ?? '—';

export function StudentDashboard() {
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const socket = createSocket();
    const load = () => api.get('/tracking/buses').then((response) => {
      setBuses(response.data.data.buses);
      response.data.data.buses.forEach((bus) => socket.emit('bus:join', bus.id));
    }).catch((requestError) => setError(requestError.response?.data?.message ?? 'Unable to load buses'));
    socket.on('bus:location', load);
    load();
    const refreshId = setInterval(load, 10000);
    return () => { clearInterval(refreshId); socket.disconnect(); };
  }, []);
  const primary = buses[0];
  return <section className="workspace"><div className="intro"><div><p className="eyebrow">IIT Ropar transport</p><h1>Your campus ride, in real time.</h1><p>Follow the next bus around Rupnagar without refreshing the page.</p></div><div className="time-card"><span>Tracking refresh</span><strong>5 seconds</strong><small>Live when driver GPS is active</small></div></div>{error && <p className="error">{error}</p>}<div className="tracking-grid"><LiveMap bus={primary} /><aside className="arrival-card"><p className="section-label">Next arrival</p><h2>{primary?.nextStop?.name ?? 'Select a live bus'}</h2><p>{primary?.route_name ?? 'No route available'}</p><div className="arrival-time">{primary?.location ? 'Live GPS connected' : 'Waiting for driver'}<span>{primary?.status ?? 'INACTIVE'}</span></div></aside></div><div className="section-title"><div><p className="section-label">Available buses</p><h2>Campus fleet</h2></div><span>{buses.length} vehicle{buses.length === 1 ? '' : 's'}</span></div><div className="cards">{buses.map((bus) => <article className="card bus-card" key={bus.id}><div className="row"><div><p className="bus-label">Campus shuttle</p><h2>{bus.bus_number}</h2></div><span className={`badge ${bus.status.toLowerCase()}`}>{bus.status}</span></div><p className="route">{bus.route_name ?? 'No route assigned'}</p><div className="stops"><div><span>Now near</span><strong>{name(bus.currentStop)}</strong></div><div><span>Next stop</span><strong>{name(bus.nextStop)}</strong></div></div><p className="coordinates">{bus.location ? `GPS ${Number(bus.location.latitude).toFixed(5)}, ${Number(bus.location.longitude).toFixed(5)}` : 'No location received yet'}</p></article>)}</div></section>;
}
