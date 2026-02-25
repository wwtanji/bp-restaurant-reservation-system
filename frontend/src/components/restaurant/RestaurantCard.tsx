import React from 'react';
import { Restaurant } from '../../interfaces/restaurant';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isActive: boolean;
  onHover: (id: number | null) => void;
}

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    className={`w-3.5 h-3.5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
  </svg>
);

const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <StarIcon key={i} filled={i <= Math.round(rating)} />
    ))}
  </div>
);

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, isActive, onHover }) => {
  return (
    <div
      onMouseEnter={() => onHover(restaurant.id)}
      onMouseLeave={() => onHover(null)}
      className={`flex gap-4 p-4 rounded-xl transition-shadow cursor-pointer ${
        isActive ? 'shadow-md bg-gray-50' : 'hover:shadow-sm'
      }`}
    >
      <div className="flex-shrink-0 w-36 h-28 rounded-lg overflow-hidden bg-gray-200">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col justify-between min-w-0 flex-1">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[#006AFF] text-sm hover:underline truncate">
              {restaurant.name}
            </h3>
            {restaurant.isNew && (
              <span className="text-xs font-semibold text-white bg-[#D4111E] px-2 py-0.5 rounded-full">
                NEW
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <Stars rating={restaurant.rating} />
            <span className="text-xs font-semibold text-gray-700">{restaurant.ratingLabel}</span>
            <span className="text-xs text-gray-400">({restaurant.reviewCount})</span>
          </div>

          <p className="text-xs text-gray-500 mt-0.5">
            {restaurant.priceRange} · {restaurant.cuisine} · {restaurant.city}
          </p>

          {restaurant.bookedToday > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-500">Booked {restaurant.bookedToday} times today</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {restaurant.availableTimes.map(time => (
            <button
              key={time}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#D4111E] hover:bg-[#b80e19] rounded-md transition-colors"
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
