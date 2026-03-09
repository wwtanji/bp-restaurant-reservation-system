import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Restaurant } from '../../interfaces/restaurant';
import { resolveImageUrl } from '../../utils/api';

const PRICE_SYMBOL: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

function ratingLabel(rating: number | null): string {
  if (!rating) return '';
  if (rating >= 4.5) return 'Exceptional';
  if (rating >= 4.0) return 'Awesome';
  if (rating >= 3.5) return 'Very Good';
  return 'Good';
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  isActive: boolean;
  onHover: (id: number | null) => void;
}

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    className={`w-3.5 h-3.5 ${filled ? 'text-ot-primary' : 'text-ot-iron dark:text-dark-border'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
  </svg>
);

const Stars: React.FC<{ rating: number | null }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <StarIcon key={i} filled={i <= Math.round(rating ?? 0)} />
    ))}
  </div>
);

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, isActive, onHover }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/restaurant/${restaurant.slug}`)}
      onMouseEnter={() => onHover(restaurant.id)}
      onMouseLeave={() => onHover(null)}
      className={`flex gap-4 p-4 rounded-ot-card transition-shadow cursor-pointer ${
        isActive ? 'shadow-md bg-ot-athens-gray dark:bg-dark-surface' : 'hover:shadow-sm'
      }`}
    >
      <div className="flex-shrink-0 w-36 h-28 rounded-ot-card overflow-hidden bg-ot-iron dark:bg-dark-border">
        <img
          src={resolveImageUrl(restaurant.cover_image)}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col justify-between min-w-0 flex-1">
        <div>
          <h3 className="font-bold text-ot-primary dark:text-dark-primary text-sm hover:underline truncate">
            {restaurant.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-1">
            <Stars rating={restaurant.rating} />
            <span className="text-xs font-bold text-ot-charade dark:text-dark-text">{ratingLabel(restaurant.rating)}</span>
            <span className="text-xs text-ot-manatee dark:text-dark-text-secondary">({restaurant.review_count})</span>
          </div>

          <p className="text-xs text-ot-pale-sky dark:text-dark-text-secondary mt-0.5">
            {PRICE_SYMBOL[restaurant.price_range]} &middot; {restaurant.cuisine} &middot; {restaurant.city}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
