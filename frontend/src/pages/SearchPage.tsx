import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/map/MapView';
import { Restaurant } from '../interfaces/restaurant';


type ViewMode = 'grid' | 'list';
type SortKey  = 'relevance' | 'rating' | 'reviews' | 'booked';


const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 1,
    name: 'Albrecht Restaurant',
    slug: 'albrecht-restaurant-bratislava',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
    rating: 4.8, reviewCount: 524, ratingLabel: 'Exceptional',
    cuisine: 'Slovak', city: 'Bratislava', priceRange: '$$$',
    bookedToday: 26, coords: [48.155, 17.074],
    availableTimes: ['6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'], isNew: false,
  },
  {
    id: 2,
    name: 'Sky Bar & Restaurant',
    slug: 'sky-bar-bratislava',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
    rating: 4.5, reviewCount: 336, ratingLabel: 'Awesome',
    cuisine: 'International', city: 'Bratislava', priceRange: '$$$',
    bookedToday: 11, coords: [48.142, 17.111],
    availableTimes: ['6:45 PM', '7:00 PM', '7:15 PM', '7:30 PM'], isNew: true,
  },
  {
    id: 3,
    name: 'Paparazzi',
    slug: 'paparazzi-bratislava',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
    rating: 4.6, reviewCount: 289, ratingLabel: 'Exceptional',
    cuisine: 'Italian', city: 'Bratislava', priceRange: '$$',
    bookedToday: 18, coords: [48.144, 17.104],
    availableTimes: ['6:30 PM', '7:00 PM', '8:00 PM'], isNew: false,
  },
  {
    id: 4,
    name: 'Tempus Fugit',
    slug: 'tempus-fugit-bratislava',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cfd06327?w=600&h=400&fit=crop',
    rating: 4.7, reviewCount: 412, ratingLabel: 'Exceptional',
    cuisine: 'European', city: 'Bratislava', priceRange: '$$',
    bookedToday: 9, coords: [48.146, 17.102],
    availableTimes: ['6:00 PM', '7:00 PM', '7:30 PM', '9:00 PM'], isNew: false,
  },
  {
    id: 5,
    name: 'UFO Restaurant',
    slug: 'ufo-restaurant-bratislava',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop',
    rating: 4.3, reviewCount: 678, ratingLabel: 'Awesome',
    cuisine: 'International', city: 'Bratislava', priceRange: '$$$$',
    bookedToday: 33, coords: [48.144, 17.105],
    availableTimes: ['7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'], isNew: false,
  },
  {
    id: 6,
    name: 'Zylinder',
    slug: 'zylinder-bratislava',
    image: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&h=400&fit=crop',
    rating: 4.4, reviewCount: 195, ratingLabel: 'Awesome',
    cuisine: 'Slovak', city: 'Bratislava', priceRange: '$$',
    bookedToday: 7, coords: [48.148, 17.108],
    availableTimes: ['6:30 PM', '7:00 PM', '7:45 PM'], isNew: false,
  },
];

const CATEGORIES = [
  { label: 'Featured',   },
  { label: 'Romantic',   },
  { label: 'Italian',   },
  { label: 'Brunch',     },
  { label: 'Mexican',    },
  { label: 'Pizza',      },
  { label: 'Seafood',    },
  { label: 'American',   },
  { label: 'Japanese',   },
  { label: 'Birthdays',  },
  { label: 'Steak',      },
  { label: 'Vegan',      },
];

// ── M3 Star icon ──────────────────────────────────────────────────────────

const StarIcon: React.FC = () => (
  <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
  </svg>
);


const ShowcaseCard: React.FC<{
  restaurant: Restaurant;
  isActive: boolean;
  onHover: (id: number | null) => void;
  onClick: () => void;
}> = ({ restaurant, isActive, onHover, onClick }) => (
  <div
    onClick={onClick}
    onMouseEnter={() => onHover(restaurant.id)}
    onMouseLeave={() => onHover(null)}
    className={`group rounded-[28px] overflow-hidden bg-white cursor-pointer transition-all duration-200 ${
      isActive
        ? 'shadow-2xl ring-2 ring-blue-500/30'
        : 'shadow-md hover:shadow-xl'
    }`}
  >
    <div className="relative h-44 overflow-hidden">
      <img
        src={restaurant.image}
        alt={restaurant.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {restaurant.isNew && (
        <span className="absolute top-3 left-3 text-[11px] font-bold text-white bg-blue-600 px-2.5 py-0.5 rounded-full shadow-sm">
          NEW
        </span>
      )}

      <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow text-xs font-bold text-gray-900">
        <StarIcon />
        {restaurant.rating}
      </div>

      {restaurant.bookedToday > 0 && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Booked {restaurant.bookedToday}× today
        </div>
      )}
    </div>

    <div className="p-4">
      <div className="flex items-start justify-between gap-1 mb-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
          {restaurant.name}
        </h3>
        <svg
          className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3 flex-wrap">
        <span className="font-semibold text-gray-700">{restaurant.ratingLabel}</span>
        <span className="text-gray-300">·</span>
        <span>({restaurant.reviewCount})</span>
        <span className="text-gray-300">·</span>
        <span>{restaurant.priceRange}</span>
        <span className="text-gray-300">·</span>
        <span>{restaurant.cuisine}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {restaurant.availableTimes.slice(0, 4).map(time => (
          <button
            key={time}
            onClick={e => e.stopPropagation()}
            className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-100 hover:border-blue-600 transition-colors"
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  </div>
);


const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <svg
        key={i}
        className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
        fill="currentColor" viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
      </svg>
    ))}
  </div>
);

const ListCard: React.FC<{
  restaurant: Restaurant;
  isActive: boolean;
  onHover: (id: number | null) => void;
  onClick: () => void;
}> = ({ restaurant, isActive, onHover, onClick }) => (
  <div
    onClick={onClick}
    onMouseEnter={() => onHover(restaurant.id)}
    onMouseLeave={() => onHover(null)}
    className={`group flex gap-4 py-5 cursor-pointer transition-colors ${
      isActive ? 'bg-blue-50/40' : 'hover:bg-slate-50'
    }`}
  >
    <div className="relative w-36 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
      <img
        src={restaurant.image}
        alt={restaurant.name}
        className="w-full h-full object-cover"
      />
    </div>

    <div className="flex flex-col justify-between flex-1 min-w-0">
      <div className="space-y-1">

        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-blue-600 text-[15px] leading-snug group-hover:underline">
            {restaurant.name}
          </h3>
          {restaurant.isNew && (
            <span className="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">
              NEW
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Stars rating={restaurant.rating} />
          <span className="text-sm font-semibold text-gray-800">{restaurant.ratingLabel}</span>
          <span className="text-sm text-gray-500">({restaurant.reviewCount})</span>
        </div>

        <p className="text-sm text-gray-500">
          {restaurant.priceRange}
          <span className="mx-1.5 text-gray-300">·</span>
          {restaurant.cuisine}
          <span className="mx-1.5 text-gray-300">·</span>
          {restaurant.city}
        </p>

        {/* Booked today */}
        {restaurant.bookedToday > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Booked {restaurant.bookedToday} times today
          </div>
        )}
      </div>

      {/* Time slot buttons — all times, filled blue */}
      <div className="flex flex-wrap gap-2 mt-3">
        {restaurant.availableTimes.map(time => (
          <button
            key={time}
            onClick={e => e.stopPropagation()}
            className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md transition-colors"
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ── M3 Empty State ────────────────────────────────────────────────────────

const EmptyState: React.FC<{ query: string; onReset: () => void }> = ({ query, onReset }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-5 shadow-inner">
      <svg className="w-9 h-9 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
    <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
      {query
        ? `No results for "${query}". Try adjusting your search or clearing the filters.`
        : 'No restaurants match the selected category. Try a different filter.'}
    </p>
    <div className="flex items-center gap-3">
      <button
        onClick={onReset}
        className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold px-6 py-2.5 rounded-2xl transition-all shadow-sm hover:shadow-md text-sm"
      >
        Clear filters
      </button>
      <button
        onClick={() => window.history.back()}
        className="border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 font-semibold px-6 py-2.5 rounded-2xl transition-all text-sm"
      >
        Back to Home
      </button>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────

const SearchPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery]       = useState('');
  const [activeCategory, setActiveCategory] = useState('Featured');
  const [sortBy, setSortBy]                 = useState<SortKey>('relevance');
  const [viewMode, setViewMode]             = useState<ViewMode>('list');
  const [activeId, setActiveId]             = useState<number | null>(null);
  const [showMap, setShowMap]               = useState(false);

  const handleMarkerClick = (slug: string) => navigate(`/restaurant/${slug}`);

  const displayedRestaurants = useMemo(() => {
    const filtered = MOCK_RESTAURANTS.filter(r =>
      searchQuery === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
    switch (sortBy) {
      case 'rating':  return [...filtered].sort((a, b) => b.rating - a.rating);
      case 'reviews': return [...filtered].sort((a, b) => b.reviewCount - a.reviewCount);
      case 'booked':  return [...filtered].sort((a, b) => b.bookedToday - a.bookedToday);
      default:        return filtered;
    }
  }, [searchQuery, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategory('Featured');
    setSortBy('relevance');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">

      {/* ── M3 Top App Bar ───────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-4 pt-4 pb-4 shadow-lg">
        <div className="max-w-7xl mx-auto space-y-3">

          {/* Logo + booking param pills */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <span className="text-white font-extrabold text-lg tracking-tight hidden sm:block mr-2 select-none">
              Reservelt
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  {
                    label: 'Mar 12, 2026',
                    icon: (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ),
                  },
                  {
                    label: '7:00 PM',
                    icon: (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                  },
                  {
                    label: '2 people',
                    icon: (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ),
                  },
                ] as { label: string; icon: React.ReactNode }[]
              ).map(({ label, icon }) => (
                <button
                  key={label}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  {icon}
                  <span>{label}</span>
                  <svg className="w-3 h-3 text-white/60 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-md">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Location, Restaurant or Cuisine"
                className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-400 min-w-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button className="flex-shrink-0 bg-white text-blue-600 font-bold text-sm px-5 py-2.5 rounded-2xl shadow-md hover:bg-blue-50 hover:shadow-lg active:scale-95 transition-all whitespace-nowrap">
              Find a table
            </button>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(({ label }) => {
            const active = activeCategory === label;
            return (
              <button
                key={label}
                onClick={() => setActiveCategory(label)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {active && (
                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        <div className={`${showMap ? 'hidden' : 'flex'} md:flex flex-col flex-1 overflow-hidden`}>

          <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {displayedRestaurants.length}{' '}
                  {displayedRestaurants.length === 1 ? 'restaurant' : 'restaurants'}
                </p>
                <p className="text-xs text-gray-400">
                  Bratislava · {activeCategory}
                  {searchQuery && ` · "${searchQuery}"`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortKey)}
                    className="appearance-none text-xs font-medium border border-slate-200 rounded-xl pl-3 pr-7 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="rating">Highest Rated</option>
                    <option value="reviews">Most Reviewed</option>
                    <option value="booked">Most Booked</option>
                  </select>
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <div className="flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    title="List view"
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            <div className={viewMode === 'list' ? 'px-4' : 'p-4'}>
              {displayedRestaurants.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 gap-4">
                    {displayedRestaurants.map(r => (
                      <ShowcaseCard
                        key={r.id}
                        restaurant={r}
                        isActive={activeId === r.id}
                        onHover={setActiveId}
                        onClick={() => navigate(`/restaurant/${r.slug}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {displayedRestaurants.map(r => (
                      <ListCard
                        key={r.id}
                        restaurant={r}
                        isActive={activeId === r.id}
                        onHover={setActiveId}
                        onClick={() => navigate(`/restaurant/${r.slug}`)}
                      />
                    ))}
                  </div>
                )
              ) : (
                <EmptyState query={searchQuery} onReset={resetFilters} />
              )}
            </div>
          </div>
        </div>

        <div className={`${showMap ? 'flex-1' : 'hidden'} md:block md:w-[45%] md:flex-none flex-shrink-0`}>
          <MapView
            restaurants={MOCK_RESTAURANTS}
            activeId={activeId}
            onMarkerClick={handleMarkerClick}
            center={[48.148, 17.107]}
            zoom={13}
          />
        </div>
      </div>
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <button
          onClick={() => setShowMap(v => !v)}
          className="pointer-events-auto flex items-center gap-2 bg-gray-900 hover:bg-gray-800 active:scale-95 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-xl transition-all"
        >
          {showMap ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Show list
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Show map
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SearchPage;
