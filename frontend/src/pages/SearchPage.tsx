import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/map/MapView';
import { Restaurant } from '../interfaces/restaurant';
import { resolveImageUrl } from '../utils/api';
import { PRICE_SYMBOLS, todayISO, formatDate } from '../constants/reservation';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import FavoriteButton from '../components/FavoriteButton';

function ratingLabel(rating: number | null): string {
  if (!rating) return '';
  if (rating >= 4.5) return 'Exceptional';
  if (rating >= 4.0) return 'Awesome';
  if (rating >= 3.5) return 'Very Good';
  return 'Good';
}

const CATEGORY_CUISINE: Record<string, string | undefined> = {
  Italian:  'Italian',
  Mexican:  'Mexican',
  Japanese: 'Japanese',
  Steak:    'Steakhouse',
  Vegan:    'Vegetarian',
  American: 'American',
  Seafood:  'Seafood',
};

type ViewMode = 'grid' | 'list';
type SortKey  = 'relevance' | 'rating' | 'reviews';

const CATEGORIES = [
  'Featured', 'Romantic', 'Italian', 'Brunch', 'Mexican',
  'Pizza', 'Seafood', 'American', 'Japanese', 'Birthdays', 'Steak', 'Vegan',
];

const StarIcon: React.FC = () => (
  <svg className="w-3 h-3 text-ot-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
  </svg>
);

const Stars: React.FC<{ rating: number | null }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <svg
        key={i}
        className={`w-3.5 h-3.5 ${i <= Math.round(rating ?? 0) ? 'text-ot-primary' : 'text-ot-iron dark:text-dark-border'}`}
        fill="currentColor" viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
      </svg>
    ))}
  </div>
);

const ShowcaseCard = React.memo<{
  restaurant: Restaurant;
  isActive: boolean;
  onHover: (id: number | null) => void;
  onCardClick: (slug: string) => void;
}>(({ restaurant, isActive, onHover, onCardClick }) => (
  <div
    onClick={() => onCardClick(restaurant.slug)}
    onMouseEnter={() => onHover(restaurant.id)}
    onMouseLeave={() => onHover(null)}
    className={`group rounded-[28px] overflow-hidden bg-white dark:bg-dark-paper cursor-pointer transition-all duration-200 ${
      isActive ? 'shadow-2xl ring-2 ring-ot-primary/30 dark:ring-dark-primary/30' : 'shadow-md hover:shadow-xl'
    }`}
  >
    <div className="relative h-44 overflow-hidden">
      <img
        src={resolveImageUrl(restaurant.cover_image)}
        alt={restaurant.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

<div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 dark:bg-dark-paper/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow text-xs font-bold text-ot-charade dark:text-dark-text">
        <StarIcon />
        {restaurant.rating ?? '—'}
      </div>
    </div>

    <div className="p-4">
      <div className="flex items-start justify-between gap-1 mb-1">
        <h3 className="font-semibold text-ot-charade dark:text-dark-text text-sm leading-snug line-clamp-1 group-hover:text-ot-primary dark:group-hover:text-dark-primary transition-colors">
          {restaurant.name}
        </h3>
        <svg
          className="w-4 h-4 text-ot-iron dark:text-dark-border flex-shrink-0 mt-0.5 group-hover:text-ot-primary dark:group-hover:text-dark-primary group-hover:translate-x-0.5 transition-all"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div className="flex items-center gap-1 text-xs text-ot-pale-sky dark:text-dark-text-secondary flex-wrap">
        <span className="font-semibold text-ot-charade dark:text-dark-text">{ratingLabel(restaurant.rating)}</span>
        <span className="text-ot-iron dark:text-dark-border">·</span>
        <span>({restaurant.review_count})</span>
        <span className="text-ot-iron dark:text-dark-border">·</span>
        <span>{PRICE_SYMBOLS[restaurant.price_range]}</span>
        <span className="text-ot-iron dark:text-dark-border">·</span>
        <span>{restaurant.cuisine}</span>
      </div>
    </div>
  </div>
));
ShowcaseCard.displayName = 'ShowcaseCard';

const ListCard = React.memo<{
  restaurant: Restaurant;
  isActive: boolean;
  onHover: (id: number | null) => void;
  onCardClick: (slug: string) => void;
}>(({ restaurant, isActive, onHover, onCardClick }) => (
  <div
    onClick={() => onCardClick(restaurant.slug)}
    onMouseEnter={() => onHover(restaurant.id)}
    onMouseLeave={() => onHover(null)}
    className={`group flex gap-4 py-5 cursor-pointer transition-colors ${
      isActive ? 'bg-ot-athens-gray dark:bg-dark-surface' : 'hover:bg-ot-athens-gray dark:hover:bg-dark-surface'
    }`}
  >
    <div className="relative w-36 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-ot-athens-gray dark:bg-dark-bg">
      <img
        src={resolveImageUrl(restaurant.cover_image)}
        alt={restaurant.name}
        className="w-full h-full object-cover"
      />
    </div>

    <div className="flex flex-col justify-between flex-1 min-w-0">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ot-charade dark:text-dark-text text-[15px] leading-snug group-hover:underline">
            {restaurant.name}
          </h3>
          <FavoriteButton restaurantId={restaurant.id} size="sm" variant="surface" className="flex-shrink-0 mt-0.5" />
        </div>

        <div className="flex items-center gap-1.5">
          <Stars rating={restaurant.rating} />
          <span className="text-sm font-semibold text-ot-charade dark:text-dark-text">{ratingLabel(restaurant.rating)}</span>
          <span className="text-sm text-ot-pale-sky dark:text-dark-text-secondary">({restaurant.review_count})</span>
        </div>

        <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary">
          {PRICE_SYMBOLS[restaurant.price_range]}
          <span className="mx-1.5 text-ot-iron dark:text-dark-border">·</span>
          {restaurant.cuisine}
          <span className="mx-1.5 text-ot-iron dark:text-dark-border">·</span>
          {restaurant.city}
        </p>

        {restaurant.address && (
          <p className="text-xs text-ot-manatee dark:text-dark-text-secondary truncate">{restaurant.address}</p>
        )}
      </div>
    </div>
  </div>
));
ListCard.displayName = 'ListCard';

const EmptyState: React.FC<{ query: string; onReset: () => void }> = ({ query, onReset }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="w-20 h-20 rounded-full bg-ot-athens-gray dark:bg-dark-surface flex items-center justify-center mb-5 shadow-inner">
      <svg className="w-9 h-9 text-ot-manatee dark:text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-ot-charade dark:text-dark-text mb-2">No restaurants found</h3>
    <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-6 max-w-xs leading-relaxed">
      {query
        ? `No results for "${query}". Try adjusting your search or clearing the filters.`
        : 'No restaurants match the selected category. Try a different filter.'}
    </p>
    <div className="flex items-center gap-3">
      <button
        onClick={onReset}
        className="bg-ot-primary hover:bg-ot-primary-dark active:scale-95 text-white font-semibold px-6 py-2.5 rounded-2xl transition-all shadow-sm hover:shadow-md text-sm"
      >
        Clear filters
      </button>
      <button
        onClick={() => window.history.back()}
        className="border border-ot-iron dark:border-dark-border hover:border-ot-charade dark:hover:border-dark-text hover:text-ot-charade dark:hover:text-dark-text text-ot-pale-sky dark:text-dark-text-secondary font-semibold px-6 py-2.5 rounded-2xl transition-all text-sm"
      >
        Back to Home
      </button>
    </div>
  </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-ot-charade dark:border-dark-text" />
  </div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <p className="text-sm text-red-500 mb-4">{message}</p>
    <button
      onClick={onRetry}
      className="bg-ot-primary hover:bg-ot-primary-dark text-white font-semibold px-6 py-2.5 rounded-2xl text-sm"
    >
      Retry
    </button>
  </div>
);

const SearchPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery]       = useState('');
  const [activeCategory, setActiveCategory] = useState('Featured');
  const [sortBy, setSortBy]                 = useState<SortKey>('relevance');
  const [viewMode, setViewMode]             = useState<ViewMode>('list');
  const [activeId, setActiveId]             = useState<number | null>(null);
  const [showMap, setShowMap]               = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 400);

  const fetchPath = useMemo(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (debouncedQuery) params.set('q', debouncedQuery);
    const cuisine = CATEGORY_CUISINE[activeCategory];
    if (cuisine) params.set('cuisine', cuisine);
    return `/restaurants/?${params}`;
  }, [debouncedQuery, activeCategory]);

  const { data: fetchedRestaurants, isLoading, error, refetch } = useFetch<Restaurant[]>(fetchPath);
  const restaurants = useMemo(() => fetchedRestaurants ?? [], [fetchedRestaurants]);

  const displayedRestaurants = useMemo(() => {
    const list = [...restaurants];
    if (sortBy === 'rating')  return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sortBy === 'reviews') return list.sort((a, b) => b.review_count - a.review_count);
    return list;
  }, [restaurants, sortBy]);

  const handleCardClick = useCallback((slug: string) => {
    navigate(`/restaurant/${slug}`);
  }, [navigate]);

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategory('Featured');
    setSortBy('relevance');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-ot-athens-gray dark:bg-dark-bg">

      <div className="flex-shrink-0 bg-ot-charade dark:bg-dark-paper px-4 pt-4 pb-4 shadow-lg">
        <div className="max-w-7xl mx-auto space-y-3">

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <a href="/" className="text-white font-extrabold text-lg tracking-tight mr-2 select-none">
              Reservelt
            </a>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                {
                  label: formatDate(todayISO()),
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
              ].map(({ label, icon }) => (
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
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-dark-surface rounded-2xl px-4 py-2.5 shadow-md">
              <svg className="w-4 h-4 text-ot-manatee dark:text-dark-text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Location, Restaurant or Cuisine"
                className="flex-1 text-sm text-ot-charade dark:text-dark-text bg-transparent outline-none placeholder-ot-manatee dark:placeholder-dark-text-secondary min-w-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-ot-manatee dark:text-dark-text-secondary hover:text-ot-pale-sky flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button className="flex-shrink-0 bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text font-bold text-sm px-5 py-2.5 rounded-2xl shadow-md hover:bg-ot-athens-gray dark:hover:bg-dark-hover hover:shadow-lg active:scale-95 transition-all whitespace-nowrap">
              Find a table
            </button>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-dark-paper border-b border-ot-iron dark:border-dark-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(label => {
            const active = activeCategory === label;
            return (
              <button
                key={label}
                onClick={() => setActiveCategory(label)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-ot-charade dark:bg-dark-primary text-white border-ot-charade dark:border-dark-primary shadow-sm'
                    : 'bg-white dark:bg-dark-surface text-ot-pale-sky dark:text-dark-text-secondary border-ot-iron dark:border-dark-border hover:border-ot-charade dark:hover:border-dark-text hover:text-ot-charade dark:hover:text-dark-text hover:bg-ot-athens-gray dark:hover:bg-dark-hover'
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

          <div className="flex-shrink-0 bg-white dark:bg-dark-paper border-b border-ot-iron/50 dark:border-dark-border px-4 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ot-charade dark:text-dark-text">
                  {isLoading ? '…' : displayedRestaurants.length}{' '}
                  {displayedRestaurants.length === 1 ? 'restaurant' : 'restaurants'}
                </p>
                <p className="text-xs text-ot-manatee dark:text-dark-text-secondary">
                  Slovakia · {activeCategory}
                  {debouncedQuery && ` · "${debouncedQuery}"`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortKey)}
                    className="appearance-none text-xs font-medium border border-ot-iron dark:border-dark-border rounded-xl pl-3 pr-7 py-1.5 bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-ot-charade/30 dark:focus:ring-dark-primary/30 cursor-pointer"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="rating">Highest Rated</option>
                    <option value="reviews">Most Reviewed</option>
                  </select>
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ot-manatee dark:text-dark-text-secondary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <div className="flex bg-ot-athens-gray dark:bg-dark-surface rounded-xl p-0.5 gap-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-white dark:bg-dark-paper shadow-sm text-ot-charade dark:text-dark-text' : 'text-ot-manatee dark:text-dark-text-secondary hover:text-ot-pale-sky'
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
                      viewMode === 'list' ? 'bg-white dark:bg-dark-paper shadow-sm text-ot-charade dark:text-dark-text' : 'text-ot-manatee dark:text-dark-text-secondary hover:text-ot-pale-sky'
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

          <div className="flex-1 overflow-y-auto bg-white dark:bg-dark-paper">
            <div className={viewMode === 'list' ? 'px-4' : 'p-4'}>
              {isLoading ? (
                <LoadingSpinner />
              ) : error ? (
                <ErrorState message={error} onRetry={refetch} />
              ) : displayedRestaurants.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 gap-4">
                    {displayedRestaurants.map(r => (
                      <ShowcaseCard
                        key={r.id}
                        restaurant={r}
                        isActive={activeId === r.id}
                        onHover={setActiveId}
                        onCardClick={handleCardClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-ot-iron/50 dark:divide-dark-border">
                    {displayedRestaurants.map(r => (
                      <ListCard
                        key={r.id}
                        restaurant={r}
                        isActive={activeId === r.id}
                        onHover={setActiveId}
                        onCardClick={handleCardClick}
                      />
                    ))}
                  </div>
                )
              ) : (
                <EmptyState query={debouncedQuery} onReset={resetFilters} />
              )}
            </div>
          </div>
        </div>

        <div className={`${showMap ? 'flex-1' : 'hidden'} md:block md:w-[45%] md:flex-none flex-shrink-0`}>
          <MapView
            restaurants={displayedRestaurants}
            activeId={activeId}
            onMarkerClick={slug => navigate(`/restaurant/${slug}`)}
            center={[48.148, 17.107]}
            zoom={7}
          />
        </div>
      </div>

      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <button
          onClick={() => setShowMap(v => !v)}
          className="pointer-events-auto flex items-center gap-2 bg-ot-charade dark:bg-dark-primary hover:bg-ot-primary-dark active:scale-95 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-xl transition-all"
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
