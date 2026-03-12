import React from 'react';

const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z';

const STAR_INDICES = [1, 2, 3, 4, 5];

const StarRating: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'w-4 h-4' }) => {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {STAR_INDICES.map(i => (
        <svg
          key={i}
          className={`${size} ${i <= filled ? 'text-ot-primary' : 'text-ot-iron dark:text-dark-border'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
};

export default StarRating;
