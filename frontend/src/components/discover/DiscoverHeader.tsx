import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RestaurantFilters } from '../../interfaces/restaurant';

interface Props {
  filters: RestaurantFilters;
  onFiltersChange: (filters: RestaurantFilters) => void;
}

const CATEGORIES = [
  { label: 'Romantic', emoji: '♥' },
  { label: 'Italian', emoji: '🍕' },
  { label: 'Brunch', emoji: '☕' },
  { label: 'Mexican', emoji: '🌮' },
  { label: 'Pizza', emoji: '🍕' },
  { label: 'Seafood', emoji: '🦐' },
  { label: 'American', emoji: '🍔' },
  { label: 'Fun', emoji: '🎉' },
  { label: 'Japanese', emoji: '🍜' },
  { label: 'Birthdays', emoji: '🎂' },
  { label: 'Sushi', emoji: '🍣' },
  { label: 'Steak', emoji: '🥩' },
  { label: 'Casual', emoji: '👔' },
];

const DiscoverHeader: React.FC<Props> = ({ filters, onFiltersChange }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleCategory = (label: string) => {
    const next = activeCategory === label ? null : label;
    setActiveCategory(next);
    onFiltersChange({ ...filters, cuisine: next ?? undefined });
  };

  const handleField = (key: keyof RestaurantFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-50">
      {/* ── Top bar: brand + search controls ── */}
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        {/* Brand */}
        <Link to="/" className="text-lg font-extrabold text-indigo-600 whitespace-nowrap mr-2">
          Reservelt
        </Link>

        {/* Date */}
        <input
          type="date"
          min={today}
          defaultValue={today}
          onChange={e => handleField('date', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {/* Time */}
        <select
          defaultValue="19:00"
          onChange={e => handleField('time', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {['17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Guests */}
        <select
          defaultValue="2"
          onChange={e => handleField('guests', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {[1,2,3,4,5,6,7,8].map(n => (
            <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
          ))}
        </select>

        {/* City */}
        <input
          type="text"
          placeholder="City or location"
          defaultValue={filters.city ?? ''}
          onChange={e => handleField('city', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-40"
        />

        {/* Search button */}
        <button
          onClick={() => onFiltersChange({ ...filters })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Search
        </button>
      </div>

      {/* ── Category chips ── */}
      <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.label}
            onClick={() => handleCategory(cat.label)}
            className={`
              flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full border text-sm font-medium transition-colors flex-shrink-0
              ${activeCategory === cat.label
                ? 'bg-gray-900 border-gray-900 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-500'}
            `}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DiscoverHeader;
