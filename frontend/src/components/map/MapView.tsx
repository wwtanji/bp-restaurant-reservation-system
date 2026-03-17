import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Restaurant } from '../../interfaces/restaurant';
import { resolveImageUrl } from '../../utils/api';
import { PRICE_SYMBOLS } from '../../constants/reservation';
import { useThemeMode } from '../../context/ThemeContext';

const TILE_LIGHT = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
const TILE_DARK = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://stadiamaps.com/">Stadia Maps</a>';

const ThemeTileLayer: React.FC = () => {
  const { isDark } = useThemeMode();
  return <TileLayer attribution={TILE_ATTRIBUTION} url={isDark ? TILE_DARK : TILE_LIGHT} />;
};

const MARKER_BG_ACTIVE = '#2D333F';
const MARKER_BG_INACTIVE = '#ffffff';
const MARKER_TEXT_ACTIVE = '#ffffff';
const MARKER_TEXT_INACTIVE = '#2D333F';
const MARKER_BORDER_INACTIVE = '1px solid #E5E7EB';
const MARKER_NO_RATING_LABEL = 'New';

const createPillMarker = (rating: number | null, isActive: boolean): L.DivIcon =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 40px;
        height: 28px;
        padding: 0 10px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.15s ease;
        background: ${isActive ? MARKER_BG_ACTIVE : MARKER_BG_INACTIVE};
        color: ${isActive ? MARKER_TEXT_ACTIVE : MARKER_TEXT_INACTIVE};
        border: ${isActive ? 'none' : MARKER_BORDER_INACTIVE};
        box-shadow: ${isActive ? '0 4px 12px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.15)'};
        transform: ${isActive ? 'scale(1.15)' : 'scale(1)'};
      ">${rating ? rating.toFixed(1) : MARKER_NO_RATING_LABEL}</div>
    `,
    iconSize: [40, 28],
    iconAnchor: [20, 14],
  });

interface PopupCardProps {
  restaurant: Restaurant;
  onClose: () => void;
  onClick: (slug: string) => void;
}

const PopupCard: React.FC<PopupCardProps> = ({ restaurant, onClose, onClick }) => {
  const map = useMap();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!restaurant.latitude || !restaurant.longitude) return;
    const point = map.latLngToContainerPoint([restaurant.latitude, restaurant.longitude]);
    setPosition({ x: point.x, y: point.y });
  }, [map, restaurant.latitude, restaurant.longitude]);

  useEffect(() => {
    updatePosition();
    map.on('move zoom viewreset', updatePosition);
    return () => {
      map.off('move zoom viewreset', updatePosition);
    };
  }, [map, updatePosition]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-popup-card]')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  if (!position) return null;

  const ratingLabel = restaurant.rating
    ? restaurant.rating >= 4.5
      ? 'Exceptional'
      : restaurant.rating >= 4.0
        ? 'Awesome'
        : restaurant.rating >= 3.5
          ? 'Very Good'
          : 'Good'
    : null;

  return (
    <div
      data-popup-card
      onClick={() => onClick(restaurant.slug)}
      className="absolute z-[1000] cursor-pointer"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, calc(-100% - 20px))',
      }}
    >
      <div className="w-60 bg-white dark:bg-dark-paper rounded-xl shadow-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 hover:shadow-2xl transition-shadow">
        <div className="flex">
          <div className="w-20 h-16 flex-shrink-0">
            <img
              src={resolveImageUrl(restaurant.cover_image)}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 px-2.5 py-2">
            <p className="text-sm font-semibold text-ot-charade dark:text-dark-text truncate leading-tight">
              {restaurant.name}
            </p>
            <p className="text-xs text-ot-pale-sky dark:text-dark-text-secondary mt-0.5 truncate">
              {restaurant.cuisine} · {PRICE_SYMBOLS[restaurant.price_range] ?? ''}
            </p>
            {ratingLabel && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs font-semibold text-ot-charade dark:text-dark-text">
                  {restaurant.rating?.toFixed(1)}
                </span>
                <span className="text-xs text-ot-pale-sky dark:text-dark-text-secondary">
                  {ratingLabel} ({restaurant.review_count})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className="w-3 h-3 bg-white dark:bg-dark-paper mx-auto -mt-1.5 rotate-45 shadow-sm"
        style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%)' }}
      />
    </div>
  );
};

interface FlyToActiveProps {
  restaurants: Restaurant[];
  activeId: number | null;
}

const FlyToActive: React.FC<FlyToActiveProps> = ({ restaurants, activeId }) => {
  const map = useMap();

  useEffect(() => {
    if (activeId === null) return;
    const r = restaurants.find((r) => r.id === activeId);
    if (r?.latitude && r?.longitude) {
      map.panTo([r.latitude, r.longitude], { animate: true, duration: 0.4 });
    }
  }, [activeId, restaurants, map]);

  return null;
};

interface RestaurantMarkerProps {
  restaurant: Restaurant;
  isActive: boolean;
  onNavigate: (slug: string) => void;
  onHover?: (id: number | null) => void;
  onSelect: (id: number) => void;
}

const RestaurantMarker: React.FC<RestaurantMarkerProps> = ({
  restaurant,
  isActive,
  onNavigate,
  onHover,
  onSelect,
}) => {
  const icon = useMemo(
    () => createPillMarker(restaurant.rating, isActive),
    [restaurant.rating, isActive],
  );

  if (!restaurant.latitude || !restaurant.longitude) return null;

  return (
    <Marker
      position={[restaurant.latitude, restaurant.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(restaurant.id),
        dblclick: () => onNavigate(restaurant.slug),
        mouseover: () => onHover?.(restaurant.id),
        mouseout: () => onHover?.(null),
      }}
    />
  );
};

interface MapViewProps {
  restaurants: Restaurant[];
  activeId: number | null;
  onMarkerClick: (slug: string) => void;
  onMarkerHover?: (id: number | null) => void;
  center?: [number, number];
  zoom?: number;
}

const MapView: React.FC<MapViewProps> = ({
  restaurants,
  activeId,
  onMarkerClick,
  onMarkerHover,
  center = [48.148, 17.107],
  zoom = 13,
}) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedId) ?? null,
    [restaurants, selectedId],
  );

  const handleSelect = useCallback((id: number) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleClosePopup = useCallback(() => setSelectedId(null), []);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <ThemeTileLayer />

      <FlyToActive restaurants={restaurants} activeId={activeId} />

      {restaurants.map((r) => (
        <RestaurantMarker
          key={r.id}
          restaurant={r}
          isActive={activeId === r.id || selectedId === r.id}
          onNavigate={onMarkerClick}
          onHover={onMarkerHover}
          onSelect={handleSelect}
        />
      ))}

      {selectedRestaurant && (
        <PopupCard
          restaurant={selectedRestaurant}
          onClose={handleClosePopup}
          onClick={onMarkerClick}
        />
      )}
    </MapContainer>
  );
};

export default MapView;
