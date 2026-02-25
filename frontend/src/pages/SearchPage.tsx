import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurantCard from '../components/restaurant/RestaurantCard';
import MapView from '../components/map/MapView';
import { Restaurant } from '../interfaces/restaurant';

// ─── Mock data (replace with API call) ─────────────────────────────────────

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 1,
    name: 'Albrecht Restaurant',
    slug: 'albrecht-restaurant-bratislava',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=280&fit=crop',
    rating: 4.8,
    reviewCount: 524,
    ratingLabel: 'Exceptional',
    cuisine: 'Slovak',
    city: 'Bratislava',
    priceRange: '$$$',
    bookedToday: 26,
    coords: [48.155, 17.074],
    availableTimes: ['6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'],
    isNew: false,
  },
  {
    id: 2,
    name: 'Sky Bar & Restaurant',
    slug: 'sky-bar-bratislava',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=280&fit=crop',
    rating: 4.5,
    reviewCount: 336,
    ratingLabel: 'Awesome',
    cuisine: 'International',
    city: 'Bratislava',
    priceRange: '$$$',
    bookedToday: 11,
    coords: [48.142, 17.111],
    availableTimes: ['6:45 PM', '7:00 PM', '7:15 PM', '7:30 PM'],
    isNew: true,
  },
  {
    id: 3,
    name: 'Paparazzi',
    slug: 'paparazzi-bratislava',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=280&fit=crop',
    rating: 4.6,
    reviewCount: 289,
    ratingLabel: 'Exceptional',
    cuisine: 'Italian',
    city: 'Bratislava',
    priceRange: '$$',
    bookedToday: 18,
    coords: [48.144, 17.104],
    availableTimes: ['6:30 PM', '7:00 PM', '8:00 PM'],
    isNew: false,
  },
  {
    id: 4,
    name: 'Tempus Fugit',
    slug: 'tempus-fugit-bratislava',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cfd06327?w=400&h=280&fit=crop',
    rating: 4.7,
    reviewCount: 412,
    ratingLabel: 'Exceptional',
    cuisine: 'European',
    city: 'Bratislava',
    priceRange: '$$',
    bookedToday: 9,
    coords: [48.146, 17.102],
    availableTimes: ['6:00 PM', '7:00 PM', '7:30 PM', '9:00 PM'],
    isNew: false,
  },
  {
    id: 5,
    name: 'UFO Restaurant',
    slug: 'ufo-restaurant-bratislava',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=280&fit=crop',
    rating: 4.3,
    reviewCount: 678,
    ratingLabel: 'Awesome',
    cuisine: 'International',
    city: 'Bratislava',
    priceRange: '$$$$',
    bookedToday: 33,
    coords: [48.144, 17.105],
    availableTimes: ['7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'],
    isNew: false,
  },
  {
    id: 6,
    name: 'Zylinder',
    slug: 'zylinder-bratislava',
    image: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400&h=280&fit=crop',
    rating: 4.4,
    reviewCount: 195,
    ratingLabel: 'Awesome',
    cuisine: 'Slovak',
    city: 'Bratislava',
    priceRange: '$$',
    bookedToday: 7,
    coords: [48.148, 17.108],
    availableTimes: ['6:30 PM', '7:00 PM', '7:45 PM'],
    isNew: false,
  },
];

// ─── Category chips ─────────────────────────────────────────────────────────

const CATEGORIES = ['Featured', 'Romantic', 'Italian', 'Brunch', 'Mexican', 'Pizza', 'Seafood', 'American', 'Japanese', 'Birthdays'];

// ─── Component ──────────────────────────────────────────────────────────────

const SearchPage: React.FC = () => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('Featured');
  const navigate = useNavigate();

  const handleMarkerClick = (slug: string) => {
    navigate(`/restaurant/${slug}`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">

      {/* ── Top search bar ─────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-[#1a1a2e] px-6 py-3">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Date */}
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 flex-1 min-w-0">
            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-700 truncate">Mar 12, 2026</span>
            <svg className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 flex-1 min-w-0">
            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-700">7:00 PM</span>
            <svg className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Party size */}
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 flex-1 min-w-0">
            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm text-gray-700">2 people</span>
            <svg className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Location search */}
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 flex-[2] min-w-0">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Location, Restaurant or Cuisine"
              className="text-sm text-gray-600 bg-transparent outline-none w-full placeholder-gray-400"
            />
          </div>

          {/* Find a table button */}
          <button className="bg-[#D4111E] hover:bg-[#b80e19] text-white text-sm font-semibold px-5 py-2 rounded-lg flex-shrink-0 transition-colors">
            Find a table
          </button>
        </div>
      </div>

      {/* ── Category chips ──────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1 px-6 py-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === cat
                  ? 'border-gray-800 bg-white text-gray-800 font-semibold'
                  : 'border-transparent text-gray-600 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Split layout ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: scrollable restaurant list */}
        <div className="w-[55%] overflow-y-auto">
          <div className="px-6 py-4">
            <p className="text-sm text-gray-500 mb-4">
              Restaurants you may also like
            </p>

            <div className="divide-y divide-gray-100">
              {MOCK_RESTAURANTS.map(restaurant => (
                <div key={restaurant.id} className="py-2">
                  <RestaurantCard
                    restaurant={restaurant}
                    isActive={activeId === restaurant.id}
                    onHover={setActiveId}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: sticky map */}
        <div className="w-[45%] flex-shrink-0">
          <MapView
            restaurants={MOCK_RESTAURANTS}
            activeId={activeId}
            onMarkerClick={handleMarkerClick}
            center={[48.148, 17.107]}
            zoom={13}
          />
        </div>

      </div>
    </div>
  );
};

export default SearchPage;
