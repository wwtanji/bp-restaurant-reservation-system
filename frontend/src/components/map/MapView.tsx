import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Restaurant } from '../../interfaces/restaurant';


const createMarkerIcon = (isActive: boolean) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width: ${isActive ? '18px' : '14px'};
        height: ${isActive ? '18px' : '14px'};
        background: ${isActive ? '#D4111E' : 'white'};
        border: 2.5px solid ${isActive ? '#D4111E' : '#6b7280'};
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,${isActive ? '0.35' : '0.2'});
        transition: all 0.15s ease;
      "></div>
    `,
    iconSize: [isActive ? 18 : 14, isActive ? 18 : 14],
    iconAnchor: [isActive ? 9 : 7, isActive ? 9 : 7],
  });


interface FlyToActiveProps {
  restaurants: Restaurant[];
  activeId: number | null;
}

const FlyToActive: React.FC<FlyToActiveProps> = ({ restaurants, activeId }) => {
  const map = useMap();

  useEffect(() => {
    if (activeId === null) return;
    const restaurant = restaurants.find(r => r.id === activeId);
    if (restaurant) {
      map.panTo(restaurant.coords, { animate: true, duration: 0.4 });
    }
  }, [activeId, restaurants, map]);

  return null;
};


interface RestaurantMarkerProps {
  restaurant: Restaurant;
  isActive: boolean;
  onNavigate: (slug: string) => void;
}

const RestaurantMarker: React.FC<RestaurantMarkerProps> = ({
  restaurant,
  isActive,
  onNavigate,
}) => {
  const icon = useMemo(
    () => createMarkerIcon(isActive),
    [isActive]
  );

  return (
    <Marker
      position={restaurant.coords}
      icon={icon}
      eventHandlers={{
        click: () => onNavigate(restaurant.slug),
      }}
    >
      <Popup>
        <div className="text-sm">
          <p className="font-semibold text-gray-800">{restaurant.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {restaurant.cuisine} · {restaurant.priceRange}
          </p>
          <p className="text-yellow-500 text-xs mt-0.5">★ {restaurant.rating}</p>
        </div>
      </Popup>
    </Marker>
  );
};


interface MapViewProps {
  restaurants: Restaurant[];
  activeId: number | null;
  onMarkerClick: (slug: string) => void;
  center?: [number, number];
  zoom?: number;
}

const MapView: React.FC<MapViewProps> = ({
  restaurants,
  activeId,
  onMarkerClick,
  center = [48.148, 17.107],
  zoom = 13,
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToActive restaurants={restaurants} activeId={activeId} />

      {restaurants.map(restaurant => (
        <RestaurantMarker
          key={restaurant.id}
          restaurant={restaurant}
          isActive={activeId === restaurant.id}
          onNavigate={onMarkerClick}
        />
      ))}
    </MapContainer>
  );
};

export default MapView;
