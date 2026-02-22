import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RestaurantListItem } from '../../interfaces/restaurant';

interface Props {
  restaurants: RestaurantListItem[];
  hoveredId: number | null;
  onMarkerHover: (id: number | null) => void;
}

// ── Custom marker icons ──────────────────────────────────────────────────────

const createIcon = (hovered: boolean): L.DivIcon => {
  const size = hovered ? 22 : 14;
  const bg = hovered ? '#ef4444' : '#1f2937';
  const shadow = hovered
    ? '0 0 0 4px rgba(239,68,68,0.25), 0 3px 8px rgba(0,0,0,.35)'
    : '0 2px 5px rgba(0,0,0,.35)';

  return L.divIcon({
    html: `<div style="
      width:${size}px;
      height:${size}px;
      background:${bg};
      border-radius:50%;
      border:2.5px solid #fff;
      box-shadow:${shadow};
      transition:all .15s ease;
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ── Auto-fit bounds when restaurants change ──────────────────────────────────

const BoundsUpdater: React.FC<{ restaurants: RestaurantListItem[] }> = ({ restaurants }) => {
  const map = useMap();

  useEffect(() => {
    const pts = restaurants.filter(r => r.latitude != null && r.longitude != null);
    if (pts.length === 0) return;

    if (pts.length === 1) {
      map.setView([pts[0].latitude!, pts[0].longitude!], 14);
    } else {
      const bounds = L.latLngBounds(pts.map(r => [r.latitude!, r.longitude!] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [restaurants, map]);

  return null;
};

// ── Single marker that updates its icon when hover state changes ─────────────

const RestaurantMarker: React.FC<{
  restaurant: RestaurantListItem;
  isHovered: boolean;
  onHover: (id: number | null) => void;
}> = ({ restaurant, isHovered, onHover }) => {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    markerRef.current?.setIcon(createIcon(isHovered));
  }, [isHovered]);

  return (
    <Marker
      ref={markerRef}
      position={[restaurant.latitude!, restaurant.longitude!]}
      icon={createIcon(isHovered)}
      eventHandlers={{
        mouseover: () => onHover(restaurant.id),
        mouseout: () => onHover(null),
      }}
    >
      <Popup>
        <div className="text-sm">
          <p className="font-semibold text-gray-900">{restaurant.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {restaurant.cuisine_type} · {restaurant.city}
          </p>
          {restaurant.address && (
            <p className="text-gray-400 text-xs mt-0.5">{restaurant.address}</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

// ── Map root ─────────────────────────────────────────────────────────────────

const DEFAULT_CENTER: [number, number] = [48.1440, 17.1077]; // Bratislava

const RestaurantMap: React.FC<Props> = ({ restaurants, hoveredId, onMarkerHover }) => {
  const withCoords = restaurants.filter(r => r.latitude != null && r.longitude != null);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <BoundsUpdater restaurants={withCoords} />
      {withCoords.map(r => (
        <RestaurantMarker
          key={r.id}
          restaurant={r}
          isHovered={hoveredId === r.id}
          onHover={onMarkerHover}
        />
      ))}
    </MapContainer>
  );
};

export default RestaurantMap;
