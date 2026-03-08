import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Restaurant } from '../../interfaces/restaurant';
import { apiFetch, resolveImageUrl } from '../../utils/api';
import { PRICE_SYMBOLS, QUICK_TIME_SLOTS } from '../../constants/reservation';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&h=300&fit=crop',
];

function getFallbackImage(id: number): string {
  return FALLBACK_IMAGES[id % FALLBACK_IMAGES.length];
}


const Stars: React.FC<{ rating: number | null }> = ({ rating }) => {
  const filled = Math.round(rating ?? 0);
  return (
    <div className="flex items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`w-4 h-4 ${i <= filled ? 'text-ot-primary' : 'text-[#E1E1E1]'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  );
};

const RestaurantCard: React.FC<{
  restaurant: Restaurant;
  bookedToday: number;
  onClick: () => void;
}> = ({ restaurant, bookedToday, onClick }) => {

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-[234px] cursor-pointer group rounded-lg border border-ot-iron shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="h-[140px] overflow-hidden bg-ot-athens-gray">
        <img
          src={resolveImageUrl(restaurant.cover_image) || getFallbackImage(restaurant.id)}
          alt={restaurant.name}
          onError={e => { (e.target as HTMLImageElement).src = getFallbackImage(restaurant.id); }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="flex flex-col items-start p-2 h-[160px] bg-white">
        <h3 className="w-full font-bold text-[17px] leading-6 text-ot-charade line-clamp-1 pb-1">
          {restaurant.name}
        </h3>

        <div className="flex items-center pb-1">
          <Stars rating={restaurant.rating} />
          <span className="text-[12.7px] font-medium leading-5 text-ot-charade pl-1">
            {restaurant.review_count} reviews
          </span>
        </div>

        <p className="text-[13.8px] leading-5 text-ot-charade pb-2">
          {restaurant.cuisine}
          <span className="mx-1">&middot;</span>
          {PRICE_SYMBOLS[restaurant.price_range]}
          <span className="mx-1">&middot;</span>
          {restaurant.city}
        </p>

        <div className="flex items-center h-6">
          <svg className="w-6 h-6 text-ot-charade flex-shrink-0 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[13.5px] font-medium leading-5 text-ot-charade">
            Booked {bookedToday} {bookedToday === 1 ? 'time' : 'times'} today
          </span>
        </div>

        <div className="flex gap-1 pt-2 self-stretch">
          {QUICK_TIME_SLOTS.slice(0, 3).map(slot => (
            <button
              key={slot}
              onClick={e => {
                e.stopPropagation();
                onClick();
              }}
              className="flex items-center justify-center w-[70px] h-8 bg-ot-primary rounded text-white font-bold text-[13.8px] leading-8 hover:bg-ot-primary-dark transition-colors"
            >
              {slot}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ScrollArrow: React.FC<{
  direction: 'left' | 'right';
  onClick: () => void;
  visible: boolean;
}> = ({ direction, onClick, visible }) => {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-ot-athens-gray transition-colors ${
        direction === 'left' ? 'left-0' : 'right-0'
      }`}
    >
      <svg
        className="w-5 h-5 text-ot-charade"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {direction === 'left' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
};

const RestaurantRow: React.FC<{
  title: string;
  restaurants: Restaurant[];
  bookedTodayMap: Record<number, number>;
  onCardClick: (slug: string) => void;
}> = ({ title, restaurants, bookedTodayMap, onCardClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [restaurants]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="mb-10">
      <h2 className="text-[22px] font-bold text-ot-charade mb-4">{title}</h2>

      <div className="relative">
        <ScrollArrow direction="left" onClick={() => scroll('left')} visible={canScrollLeft} />
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
          {restaurants.map(r => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              bookedToday={bookedTodayMap[r.id] ?? 0}
              onClick={() => onCardClick(r.slug)}
            />
          ))}
        </div>
        <ScrollArrow direction="right" onClick={() => scroll('right')} visible={canScrollRight} />
      </div>
    </section>
  );
};

const TopRatedSection: React.FC = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [bookedTodayMap, setBookedTodayMap] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Restaurant[]>('/restaurants/?limit=50'),
      apiFetch<Record<number, number>>('/restaurants/booked-today').catch(() => ({})),
    ])
      .then(([restaurantData, bookedData]) => {
        setRestaurants(restaurantData);
        setBookedTodayMap(bookedData);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-ot mx-auto px-4">
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) return null;

  const topRated = [...restaurants]
    .filter(r => (r.rating ?? 0) >= 3.5)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const cuisineGroups: Record<string, Restaurant[]> = {};
  for (const r of restaurants) {
    const key = r.cuisine || 'Other';
    if (!cuisineGroups[key]) cuisineGroups[key] = [];
    cuisineGroups[key].push(r);
  }

  const cuisineSections = Object.entries(cuisineGroups)
    .filter(([, items]) => items.length >= 2)
    .slice(0, 4);

  const handleClick = (slug: string) => navigate(`/restaurant/${slug}`);

  return (
    <div className="bg-white py-12">
      <div className="max-w-ot mx-auto px-4">
        {topRated.length > 0 && (
          <RestaurantRow
            title="Top Rated Restaurants"
            restaurants={topRated}
            bookedTodayMap={bookedTodayMap}
            onCardClick={handleClick}
          />
        )}

        {cuisineSections.map(([cuisine, items]) => (
          <RestaurantRow
            key={cuisine}
            title={cuisine}
            restaurants={items}
            bookedTodayMap={bookedTodayMap}
            onCardClick={handleClick}
          />
        ))}
      </div>
    </div>
  );
};

export default TopRatedSection;
