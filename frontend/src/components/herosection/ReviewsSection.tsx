import React, { useState, useEffect, useRef } from 'react';
import { PRICE_SYMBOLS } from '../../constants/reservation';

const AVATAR_COLORS = ['#2D333F', '#6B7280', '#4B5563', '#374151', '#9CA3AF'];

interface MockReview {
  id: number;
  authorName: string;
  authorLocation: string;
  reviewCount: number;
  rating: number;
  dinedOn: string;
  text: string;
  restaurantName: string;
  cuisine: string;
  city: string;
  priceRange: number;
  restaurantRating: number;
}

const MOCK_REVIEWS: MockReview[] = [
  {
    id: 1,
    authorName: 'Martin',
    authorLocation: 'Bratislava',
    reviewCount: 3,
    rating: 4,
    dinedOn: 'Feb 28, 2026',
    text: 'When we arrived, our table was not quite ready yet, so we were invited to wait next to the bar. After about 10 minutes, we were seated at our table. We got a cozy corner table, which was very comfortable and pleasant for two people. The service staff was...',
    restaurantName: 'La Trattoria',
    cuisine: 'Italian',
    city: 'Bratislava',
    priceRange: 3,
    restaurantRating: 4.6,
  },
  {
    id: 2,
    authorName: 'Zuzana',
    authorLocation: 'Kosice',
    reviewCount: 1,
    rating: 5,
    dinedOn: 'Mar 1, 2026',
    text: 'Beautiful place, good food experience, very nice people!',
    restaurantName: 'Sushi Garden',
    cuisine: 'Japanese',
    city: 'Bratislava',
    priceRange: 3,
    restaurantRating: 4.4,
  },
  {
    id: 3,
    authorName: 'Peter',
    authorLocation: 'Vienna',
    reviewCount: 12,
    rating: 5,
    dinedOn: 'Feb 25, 2026',
    text: 'This was one of our best, if not THE best, meals we had in Bratislava. We had the lamb, souvlaki, and eggplant salad and it was all delicious! The lamb were both tender, cooked perfectly and so good! Great portions. Service was...',
    restaurantName: 'Greek Corner',
    cuisine: 'Greek',
    city: 'Bratislava',
    priceRange: 2,
    restaurantRating: 4.6,
  },
  {
    id: 4,
    authorName: 'Jana',
    authorLocation: 'Bratislava',
    reviewCount: 7,
    rating: 4,
    dinedOn: 'Mar 3, 2026',
    text: 'Really enjoyed the atmosphere and the food was great. The waiter was very attentive and made excellent recommendations. Would definitely come back again for a special occasion.',
    restaurantName: 'Bistro Slovak',
    cuisine: 'Slovak',
    city: 'Bratislava',
    priceRange: 2,
    restaurantRating: 4.2,
  },
  {
    id: 5,
    authorName: 'Tomas',
    authorLocation: 'Brno',
    reviewCount: 5,
    rating: 5,
    dinedOn: 'Feb 20, 2026',
    text: 'Absolutely fantastic dining experience. The chef clearly puts a lot of passion into every dish. The tasting menu was outstanding and the wine pairing was perfect. Highly recommend for food lovers.',
    restaurantName: 'Fine Dining SK',
    cuisine: 'French',
    city: 'Bratislava',
    priceRange: 4,
    restaurantRating: 4.8,
  },
];

const Stars: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'w-4 h-4' }) => {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`${size} ${i <= filled ? 'text-ot-red' : 'text-[#E1E1E1]'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  );
};

const ReviewCard: React.FC<{ review: MockReview }> = ({ review }) => {
  const colorIndex = review.id % AVATAR_COLORS.length;
  const avatarColor = AVATAR_COLORS[colorIndex];
  const initial = review.authorName[0];

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
            <span className="text-[15px] text-ot-charade block">{review.authorName}</span>
            <span className="text-[13.5px] text-ot-pale-sky">
              {review.authorLocation} &middot; {review.reviewCount} {review.reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Stars rating={review.rating} />
          <span className="text-[14px] text-ot-charade">
            Dined on {review.dinedOn}
          </span>
        </div>
      </div>

      <div className="px-4 flex-1 overflow-hidden">
        <p className="text-[15.5px] leading-6 text-ot-charade tracking-[-0.15px] line-clamp-5">
          {review.text}
        </p>
      </div>

      <div className="px-4 pb-3 text-right">
        <span className="text-[15.8px] font-medium text-ot-red cursor-pointer hover:underline">
          More info
        </span>
      </div>

      <div className="bg-ot-athens-gray px-4 py-4 flex items-center justify-between mt-auto">
        <div className="min-w-0">
          <p className="text-[15.5px] font-medium text-ot-charade leading-[18px] mb-1">
            {review.restaurantName}
          </p>
          <span className="text-[13.7px] text-ot-charade">
            {PRICE_SYMBOLS[review.priceRange]}
            <span className="mx-0.5">&middot;</span>
            {review.cuisine}
            <span className="mx-0.5">&middot;</span>
            {review.city}
            <span className="mx-0.5">&middot;</span>
            <svg className="w-2.5 h-2.5 text-ot-red inline-block mb-[1px]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
            </svg>
            {' '}{review.restaurantRating}
          </span>
        </div>
        <button className="flex-shrink-0 ml-4 text-ot-red hover:text-ot-red-dark">
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
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

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
            {MOCK_REVIEWS.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          <ScrollArrow direction="right" onClick={() => scroll('right')} visible={canScrollRight} />
        </div>
      </div>
    </div>
  );
};

export default ReviewsSection;
