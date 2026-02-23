import React, { useState } from 'react';
import { RestaurantDetail, Review } from '../../interfaces/restaurant';

interface Props {
  restaurant: RestaurantDetail;
  reviews: Review[];
}

const AVATAR_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
  'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500',
];

const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const formatDinedAt = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 14) return `${diffDays} days ago`;
  return `on ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
};

const StarRow: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <svg
        key={s}
        className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-red-500' : 'text-gray-200'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

// Rating distribution (computed from average in a realistic bell-curve shape)
const getRatingDistribution = (avg: number, total: number) => {
  if (total === 0) return [0, 0, 0, 0, 0];
  // weights for 5,4,3,2,1 stars based on average
  const w5 = Math.max(0, (avg - 3) / 2);
  const w4 = 1 - Math.abs(avg - 4) / 2;
  const w3 = Math.max(0, 1 - Math.abs(avg - 3) / 1.5);
  const w2 = Math.max(0, (4 - avg) / 3);
  const w1 = Math.max(0, (3.5 - avg) / 3);
  const sum = w5 + w4 + w3 + w2 + w1 || 1;
  return [w5, w4, w3, w2, w1].map(w => Math.round((w / sum) * total));
};

const ReviewsSection: React.FC<Props> = ({ restaurant, reviews }) => {
  const [helpfulClicked, setHelpfulClicked] = useState<Set<number>>(new Set());
  const dist = getRatingDistribution(restaurant.average_rating, restaurant.total_reviews);
  const maxDist = Math.max(...dist, 1);

  return (
    <section id="reviews">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        What {restaurant.total_reviews > 0 ? restaurant.total_reviews.toLocaleString() : 'people'} are saying
      </h2>

      {/* Overall rating breakdown */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Overall ratings and reviews</h3>

        <p className="text-xs text-gray-500 mb-4">
          Reviews can only be made by diners who have eaten at this restaurant
        </p>

        <div className="flex gap-8 flex-wrap">
          {/* Stars + average */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <StarRow rating={restaurant.average_rating} />
              <span className="text-sm text-gray-700 font-medium">
                {restaurant.average_rating.toFixed(1)} based on recent ratings
              </span>
            </div>

            {/* Sub-ratings */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              {[
                { label: 'Food', value: restaurant.food_rating },
                { label: 'Service', value: restaurant.service_rating },
                { label: 'Ambience', value: restaurant.ambience_rating },
                { label: 'Value', value: restaurant.value_rating },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-bold text-gray-900">{value.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Noise level */}
            {restaurant.noise_level && (
              <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Noise · {restaurant.noise_level}
              </p>
            )}
          </div>

          {/* Star distribution bars */}
          <div className="flex-1 min-w-[160px]">
            {[5, 4, 3, 2, 1].map((star, i) => (
              <div key={star} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-gray-500 w-2">{star}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(dist[i] / maxDist) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loved For */}
        {restaurant.loved_for.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">Loved For</p>
            <div className="flex gap-2 flex-wrap">
              {restaurant.loved_for.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700"
                >
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search + count + sort */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search all reviews"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        {restaurant.total_reviews > 0 && (
          <p className="text-sm font-semibold text-gray-700 flex-shrink-0">
            {restaurant.total_reviews.toLocaleString()} Reviews
          </p>
        )}
        <select className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
          <option>Newest</option>
          <option>Highest rated</option>
          <option>Lowest rated</option>
        </select>
      </div>

      {/* Review cards */}
      <div className="flex flex-col divide-y divide-gray-100">
        {reviews.map(review => (
          <div key={review.id} className="py-6">
            {/* Reviewer header */}
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold ${avatarColor(review.reviewer_name)}`}>
                {review.reviewer_name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{review.reviewer_name}</p>
                <p className="text-xs text-gray-400">
                  {review.reviewer_location} · {review.reviewer_review_count}{' '}
                  {review.reviewer_review_count === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            {/* Stars + date */}
            <div className="flex items-center gap-2 mb-1">
              <StarRow rating={review.overall} />
              <span className="text-xs text-gray-500">Dined {formatDinedAt(review.dined_at)}</span>
            </div>

            {/* Metric breakdown */}
            <p className="text-xs text-gray-500 mb-2">
              Overall {review.overall} · Food {review.food} · Service {review.service} · Ambience {review.ambience}
            </p>

            {/* Review text */}
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{review.text}</p>

            {/* Helpful */}
            <button
              onClick={() =>
                setHelpfulClicked(prev => {
                  const next = new Set(prev);
                  next.has(review.id) ? next.delete(review.id) : next.add(review.id);
                  return next;
                })
              }
              className={`mt-3 flex items-center gap-1.5 text-xs transition-colors ${
                helpfulClicked.has(review.id)
                  ? 'text-red-600 font-semibold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={helpfulClicked.has(review.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              Is this helpful?
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReviewsSection;
