import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const campusCenter = [30.9755, 76.5395];
const icon = (label, kind) => L.divIcon({ className: 'map-icon-wrap', html: `<div class="map-icon ${kind}">${label}</div>`, iconSize: [38, 38], iconAnchor: [19, 19] });
const point = (stop) => stop ? [Number(stop.latitude), Number(stop.longitude)] : null;

export function LiveMap({ bus }) {
  const location = bus?.location && [Number(bus.location.latitude), Number(bus.location.longitude)];
  const current = point(bus?.currentStop);
  const next = point(bus?.nextStop);
  const route = [current, next].filter(Boolean);
  return <section className="map-card"><div className="map-heading"><div><p className="section-label">Live location</p><h2>Rupnagar · IIT Ropar</h2></div><span className="map-live"><i /> Updates every 5 sec</span></div><MapContainer center={location ?? current ?? campusCenter} zoom={15} scrollWheelZoom className="map-canvas"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{current && <Marker position={current} icon={icon('C', 'stop')}><Tooltip direction="top" offset={[0, -18]} opacity={1}>{bus.currentStop.name}</Tooltip></Marker>}{next && <Marker position={next} icon={icon('N', 'next')}><Tooltip direction="top" offset={[0, -18]} opacity={1}>{bus.nextStop.name}</Tooltip></Marker>}{location && <Marker position={location} icon={icon('🚌', 'bus')}><Tooltip direction="top" offset={[0, -18]} opacity={1}>{bus.bus_number} live location</Tooltip></Marker>}{route.length > 1 && <Polyline positions={route} pathOptions={{ color: '#f58220', weight: 4, dashArray: '8 9' }} />}</MapContainer><p className="map-note">Map centres on IIT Ropar, Rupnagar, Punjab. The bus marker updates when the driver shares GPS.</p></section>;
}
