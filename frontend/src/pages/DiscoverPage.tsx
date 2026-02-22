import React, { useState, useEffect, useCallback } from 'react';
import DiscoverHeader from '../components/discover/DiscoverHeader';
import RestaurantList from '../components/discover/RestaurantList';
import RestaurantMap from '../components/discover/RestaurantMap';
import { RestaurantListItem, RestaurantFilters } from '../interfaces/restaurant';
import { getRestaurants } from '../services/restaurantService';

const DiscoverPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [filters, setFilters] = useState<RestaurantFilters>({});
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false); // mobile toggle

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRestaurants(filters)
      .then(data => { if (!cancelled) setRestaurants(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const handleHover = useCallback((id: number | null) => setHoveredId(id), []);

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* ── Sticky header ── */}
      <DiscoverHeader filters={filters} onFiltersChange={setFilters} />

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left column – scrollable restaurant list */}
        <div className={`
          w-full lg:w-[55%] overflow-y-auto bg-gray-50
          ${showMap ? 'hidden lg:block' : 'block'}
        `}>
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500" />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-3">
                  <span className="font-semibold text-gray-800">{restaurants.length}</span> restaurants available
                </p>
                <RestaurantList
                  restaurants={restaurants}
                  hoveredId={hoveredId}
                  onHover={handleHover}
                />
              </>
            )}
          </div>
        </div>

        {/* Right column – sticky map */}
        <div className={`
          absolute inset-0 lg:static lg:w-[45%] lg:block
          ${showMap ? 'block' : 'hidden lg:block'}
        `}>
          <RestaurantMap
            restaurants={restaurants}
            hoveredId={hoveredId}
            onMarkerHover={handleHover}
          />
        </div>
      </div>

      {/* ── Mobile map toggle button ── */}
      <button
        onClick={() => setShowMap(v => !v)}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl"
      >
        {showMap ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            View List
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            View Map
          </>
        )}
      </button>
    </div>
  );
};

export default DiscoverPage;
