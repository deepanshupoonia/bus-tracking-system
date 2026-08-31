import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const campusCenter=[30.970050,76.473167];
const point=(bus)=>bus?.location?.latitude != null&&bus?.location?.longitude != null?[Number(bus.location.latitude),Number(bus.location.longitude)]:null;
const busIcon=(selected)=>L.divIcon({className:'map-icon-wrap',html:`<div class="map-icon bus${selected?' next':''}">🚌</div>`,iconSize:[38,38],iconAnchor:[19,19]});

export function FleetMap({buses,selectedBusId}) {
  const selected=selectedBusId==='all'?null:buses.find(bus=>String(bus.id)===selectedBusId);
  const visible=selected?[selected]:buses;
  const located=visible.filter(point);
  const center=point(selected)??point(located[0])??campusCenter;
  return <section className="map-card"><div className="map-heading"><div><p className="section-label">Fleet location</p><h2>{selected?selected.bus_number:'All active buses'}</h2></div><span className="map-live"><i/> {located.length} live</span></div><MapContainer key={selectedBusId} center={center} zoom={13} scrollWheelZoom className="map-canvas"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{located.map(bus=><Marker key={bus.id} position={point(bus)} icon={busIcon(String(bus.id)===selectedBusId)}><Tooltip direction="top" offset={[0,-18]} opacity={1}><b>{bus.bus_number}</b><br/>{bus.route_name??'No route'}<br/>{bus.nextStop?.name?`Next: ${bus.nextStop.name}`:'Location received'}</Tooltip></Marker>)}</MapContainer><p className="map-note">Use the selector to focus on one bus. Only buses with an active route and a received GPS point appear on the map.</p></section>;
}
