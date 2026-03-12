import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

interface FavoriteButtonProps {
  restaurantId: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'overlay' | 'surface' | 'labeled';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
};

const UNFAVORITED_ICON_CLASSES = {
  overlay: 'text-white hover:text-white',
  surface: 'text-ot-charade dark:text-dark-text hover:text-ot-charade dark:hover:text-dark-text',
};

const BookmarkIcon: React.FC<{ filled: boolean; className?: string }> = ({ filled, className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
    />
  </svg>
);

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ restaurantId, size = 'md', variant = 'overlay', className = '' }) => {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!isAuthenticated) return null;

  const favorited = isFavorite(restaurantId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(restaurantId);
  };

  if (variant === 'labeled') {
    return (
      <button
        onClick={handleClick}
        className={`group/fav flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all active:scale-95 flex-shrink-0 ${
          favorited
            ? 'border-ot-primary dark:border-dark-primary bg-ot-primary/5 dark:bg-dark-primary/10 text-ot-primary dark:text-dark-primary'
            : 'border-ot-iron dark:border-dark-border bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg'
        } ${className}`}
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <BookmarkIcon filled={favorited} className={`w-5 h-5 flex-shrink-0 transition-colors ${favorited ? 'text-ot-primary dark:text-dark-primary' : 'text-ot-charade dark:text-dark-text'}`} />
        <span className="text-sm font-semibold whitespace-nowrap">
          {favorited ? 'Restaurant saved' : 'Save this restaurant'}
        </span>
      </button>
    );
  }

  const sizeClass = SIZE_CLASSES[size];
  const iconClasses = favorited
    ? 'text-ot-primary dark:text-dark-primary'
    : UNFAVORITED_ICON_CLASSES[variant];

  return (
    <button
      onClick={handleClick}
      className={`group/fav flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${className}`}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <BookmarkIcon filled={favorited} className={`${sizeClass} transition-colors ${iconClasses}`} />
    </button>
  );
};

export default FavoriteButton;
