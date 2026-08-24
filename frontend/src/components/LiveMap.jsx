import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const campusCenter=[30.970050,76.473167];
const icon=(label,kind)=>L.divIcon({className:'map-icon-wrap',html:`<div class="map-icon ${kind}">${label}</div>`,iconSize:[38,38],iconAnchor:[19,19]});
const point=(stop)=>stop?.latitude != null && stop?.longitude != null?[Number(stop.latitude),Number(stop.longitude)]:null;

export function LiveMap({bus,schedule}){
  const location=bus?.location&&[Number(bus.location.latitude),Number(bus.location.longitude)]; const current=point(bus?.currentStop),next=point(bus?.nextStop); const scheduledNext=schedule?.nextStop;
  const scheduleStops=(schedule?.stops??[]).filter((stop,index,all)=>point(stop)&&all.findIndex(candidate=>candidate.latitude===stop.latitude&&candidate.longitude===stop.longitude)===index);
  return <section className="map-card"><div className="map-heading"><div><p className="section-label">Live location</p><h2>Rupnagar · IIT Ropar</h2></div><span className="map-live"><i/> Updates every 5 sec</span></div><MapContainer center={location??point(scheduledNext)??current??campusCenter} zoom={13} scrollWheelZoom className="map-canvas"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{scheduleStops.map(stop=>{const isNext=stop.name===scheduledNext?.name&&stop.expected_arrival_time===scheduledNext?.expected_arrival_time;return <Marker key={`${stop.stop_order}-${stop.name}`} position={point(stop)} icon={icon(String(stop.stop_order),isNext?'next':'stop')}><Tooltip direction="top" offset={[0,-18]} opacity={1}>{stop.name} · {stop.expected_arrival_time.slice(0,5)}</Tooltip></Marker>})}{location&&<Marker position={location} icon={icon('🚌','bus')}><Tooltip direction="top" offset={[0,-18]} opacity={1}>{bus.bus_number} live location</Tooltip></Marker>}{current&&<Marker position={current} icon={icon('C','stop')}><Tooltip>{bus.currentStop.name}</Tooltip></Marker>}{next&&<Marker position={next} icon={icon('N','next')}><Tooltip>{bus.nextStop.name}</Tooltip></Marker>}</MapContainer><p className="map-note"><b>Green numbered marker</b> is the next stop in today’s timetable. Numbered markers show the scheduled trip.</p></section>;
}
