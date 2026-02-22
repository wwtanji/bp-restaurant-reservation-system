import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { RestaurantListItem } from '../../interfaces/restaurant';

interface Props {
  restaurant: RestaurantListItem;
  isHovered: boolean;
  onHover: (id: number | null) => void;
}

const TIME_SLOTS = ['6:30 PM', '6:45 PM', '7:00 PM', '7:15 PM', '7:30 PM'];

const PRICE_MAP: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

const getRatingLabel = (r: number) => {
  if (r >= 4.8) return 'Exceptional';
  if (r >= 4.5) return 'Awesome';
  if (r >= 4.0) return 'Very Good';
  if (r >= 3.5) return 'Good';
  return 'Fair';
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(star => (
      <svg
        key={star}
        className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const RestaurantCard = forwardRef<HTMLDivElement, Props>(
  ({ restaurant, isHovered, onHover }, ref) => {
    // Stable pseudo-random booking count derived from id (avoids re-render flicker)
    const bookedToday = (restaurant.id * 7 + 3) % 15 + 3;

    const cardBody = (
      <div
        ref={ref}
        onMouseEnter={() => onHover(restaurant.id)}
        onMouseLeave={() => onHover(null)}
        className={`
          flex gap-4 p-4 rounded-xl border transition-all duration-150 cursor-pointer
          ${isHovered
            ? 'border-red-400 shadow-md bg-red-50'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}
        `}
      >
        {/* Cover image */}
        <div className="flex-shrink-0 w-36 h-28 rounded-lg overflow-hidden bg-gray-100">
          {restaurant.cover_image_url ? (
            <img
              src={restaurant.cover_image_url}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No photo
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name + verified badge */}
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-gray-900 text-[15px] leading-tight truncate">
              {restaurant.name}
            </h3>
            {restaurant.is_verified && (
              <svg className="w-4 h-4 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          {/* Stars + label + count */}
          <div className="flex items-center gap-1.5 mt-1">
            <StarRating rating={restaurant.average_rating} />
            <span className="text-sm font-medium text-gray-700">
              {getRatingLabel(restaurant.average_rating)}
            </span>
            {restaurant.total_reviews > 0 && (
              <span className="text-sm text-gray-400">
                ({restaurant.total_reviews.toLocaleString()})
              </span>
            )}
          </div>

          {/* Price · cuisine · city */}
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="font-semibold text-gray-700">{PRICE_MAP[restaurant.price_range] ?? '$$'}</span>
            {' · '}{restaurant.cuisine_type}
            {' · '}{restaurant.city}
          </p>

          {/* Booked today */}
          <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Booked {bookedToday} times today
          </p>

          {/* Time slots */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {TIME_SLOTS.map(slot => (
              <button
                key={slot}
                onClick={e => e.preventDefault()}
                className="flex flex-col items-center bg-red-600 hover:bg-red-700 text-white rounded-md px-2.5 py-1.5 transition-colors"
              >
                <span className="text-xs font-semibold">{slot}</span>
                {restaurant.is_verified && (
                  <span className="text-[10px] opacity-80 leading-none">+1,000 pts</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );

    return restaurant.slug ? (
      <Link to={`/restaurants/${restaurant.slug}`} className="block">
        {cardBody}
      </Link>
    ) : (
      cardBody
    );
  }
);

RestaurantCard.displayName = 'RestaurantCard';

export default RestaurantCard;
