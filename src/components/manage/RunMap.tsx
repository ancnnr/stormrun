import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface GeoPoint {
  lat: number;
  lng: number;
  missionTitle: string;
  difficulty: string | null;
  createdAt: string | null;
}

interface RunMapProps {
  points: GeoPoint[];
  difficultyColors: Record<string, string>;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Default center — will auto-fit to points if available
const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;

export default function RunMap({ points, difficultyColors }: RunMapProps) {
  // Compute bounding box center if we have points
  let center: [number, number] = DEFAULT_CENTER;
  let zoom = DEFAULT_ZOOM;

  if (points.length > 0) {
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    center = [(minLat + maxLat) / 2, (minLng + maxLng) / 2];

    // Rough zoom based on spread
    const spread = Math.max(maxLat - minLat, maxLng - minLng);
    if (spread < 0.5) zoom = 13;
    else if (spread < 2) zoom = 11;
    else if (spread < 10) zoom = 8;
    else if (spread < 50) zoom = 5;
    else zoom = 3;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '500px', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((point, i) => {
        const color = difficultyColors[point.difficulty ?? ''] ?? '#94a3b8';
        return (
          <CircleMarker
            key={i}
            center={[point.lat, point.lng]}
            radius={6}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.7,
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{point.missionTitle}</p>
                {point.difficulty && (
                  <p className="capitalize text-gray-500">{point.difficulty}</p>
                )}
                <p className="text-gray-400 text-xs mt-1">{formatDate(point.createdAt)}</p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
