import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapPoint { id: number; lat: number; lng: number; display_name: string; timestamp: number; }
interface MultiMapProps { points: MapPoint[]; }

const MultiMap = ({ points }: MultiMapProps) => {
  if (points.length === 0) return null;
  const center: [number, number] = [points[0].lat, points[0].lng];

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map(p => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={DefaultIcon}>
            <Popup>
              <strong>{p.display_name}</strong><br />
              {new Date(p.timestamp).toLocaleString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MultiMap;