import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PRICE_SYMBOLS } from '../../constants/reservation';
import { Review } from '../../interfaces/review';
import { apiFetch } from '../../utils/api';

const AVATAR_COLORS = ['#2D333F', '#6B7280', '#4B5563', '#374151', '#9CA3AF'];

const Stars: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'w-4 h-4' }) => {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`${size} ${i <= filled ? 'text-ot-primary' : 'text-[#E1E1E1]'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  );
};

const ReviewCard: React.FC<{ review: Review; index: number }> = ({ review, index }) => {
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = review.author.first_name[0];
  const reviewDate = new Date(review.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="flex-shrink-0 w-[392px] h-[360px] flex flex-col rounded-ot-card shadow-[0_2px_4px_rgba(45,51,63,0.2)] overflow-hidden bg-white">
      <div className="p-4 pb-2">
        <div className="flex items-start gap-2 mb-1">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            <span className="text-white font-medium text-sm">{initial}</span>
          </div>
          <div className="min-w-0">
            <span className="text-[15px] text-ot-charade block">{review.author.first_name}</span>
            <span className="text-[13.5px] text-ot-pale-sky">
              {review.restaurant.city}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Stars rating={review.rating} />
          <span className="text-[14px] text-ot-charade">
            Dined on {reviewDate}
          </span>
        </div>
      </div>

      <div className="px-4 flex-1 overflow-hidden">
        <p className="text-[15.5px] leading-6 text-ot-charade tracking-[-0.15px] line-clamp-5">
          {review.text}
        </p>
      </div>

      <div className="px-4 pb-3 text-right">
        <Link
          to={`/restaurant/${review.restaurant.slug}`}
          className="text-[15.8px] font-medium text-ot-primary cursor-pointer hover:underline"
        >
          More info
        </Link>
      </div>

      <div className="bg-ot-athens-gray px-4 py-4 flex items-center justify-between mt-auto">
        <div className="min-w-0">
          <Link
            to={`/restaurant/${review.restaurant.slug}`}
            className="text-[15.5px] font-medium text-ot-charade leading-[18px] mb-1 block hover:underline"
          >
            {review.restaurant.name}
          </Link>
          <span className="text-[13.7px] text-ot-charade">
            {PRICE_SYMBOLS[review.restaurant.price_range] ?? '$$'}
            <span className="mx-0.5">&middot;</span>
            {review.restaurant.cuisine}
            <span className="mx-0.5">&middot;</span>
            {review.restaurant.city}
            {review.restaurant.rating && (
              <>
                <span className="mx-0.5">&middot;</span>
                <svg className="w-2.5 h-2.5 text-ot-primary inline-block mb-[1px]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                </svg>
                {' '}{review.restaurant.rating}
              </>
            )}
          </span>
        </div>
        <button className="flex-shrink-0 ml-4 text-ot-primary hover:text-ot-primary-dark">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </button>
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
      <svg className="w-5 h-5 text-ot-charade" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {direction === 'left' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
};

const ReviewsSection: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    apiFetch<Review[]>('/reviews/latest?limit=10')
      .then(setReviews)
      .catch(() => {});
  }, []);

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
  }, [reviews]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (reviews.length === 0) return null;

  return (
    <div className="bg-white py-12 border-t border-ot-iron">
      <div className="max-w-ot mx-auto px-4">
        <h2 className="text-[22px] font-bold text-ot-charade mb-1">
          See what locals rave about in Slovakia
        </h2>
        <p className="text-sm text-ot-pale-sky mb-6">From verified diners like you</p>

        <div className="relative">
          <ScrollArrow direction="left" onClick={() => scroll('left')} visible={canScrollLeft} />
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          >
            {reviews.map((review, index) => (
              <ReviewCard key={review.id} review={review} index={index} />
            ))}
          </div>
          <ScrollArrow direction="right" onClick={() => scroll('right')} visible={canScrollRight} />
        </div>
      </div>
    </div>
  );
};

export default ReviewsSection;
