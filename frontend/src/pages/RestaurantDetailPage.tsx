import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RestaurantDetail, Review, Experience } from '../interfaces/restaurant';
import {
  getRestaurantDetail,
  getRestaurantReviews,
  getRestaurantExperiences,
} from '../services/restaurantDetailService';
import ReservationWidget from '../components/restaurant-detail/ReservationWidget';
import ReviewsSection from '../components/restaurant-detail/ReviewsSection';

// ── Helpers ──────────────────────────────────────────────────────────────────

const PRICE_LABEL: Record<number, string> = { 1: '€15 and under', 2: '€30 and under', 3: '€50 and under', 4: '€50+' };

const formatExperienceDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const TABS = ['Overview', 'Experiences', 'Photos', 'Menu', 'Reviews', 'Details', 'FAQs'] as const;
type Tab = typeof TABS[number];

// ── Sub-components ────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; small?: boolean }> = ({ rating, small }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <svg
        key={s}
        className={`${small ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${s <= Math.round(rating) ? 'text-red-500' : 'text-gray-200'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const RestaurantDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [expanded, setExpanded] = useState(false);

  const sectionRefs = useRef<Partial<Record<Tab, HTMLElement | null>>>({});

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    Promise.all([
      getRestaurantDetail(slug),
      getRestaurantReviews(0), // id resolved after detail loads
      getRestaurantExperiences(0),
    ]).then(([detail]) => {
      if (cancelled || !detail) return;
      setRestaurant(detail);
      Promise.all([
        getRestaurantReviews(detail.id),
        getRestaurantExperiences(detail.id),
      ]).then(([rv, ex]) => {
        if (cancelled) return;
        setReviews(rv);
        setExperiences(ex);
      });
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [slug]);

  const scrollTo = (tab: Tab) => {
    setActiveTab(tab);
    const el = sectionRefs.current[tab];
    if (el) {
      const offset = 110; // height of sticky tab nav
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // ── Loading / 404 ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <p className="text-xl font-semibold">Restaurant not found</p>
        <Link to="/discover" className="text-sm text-red-600 hover:underline">← Back to search</Link>
      </div>
    );
  }

  const descShort = (restaurant.description ?? '').slice(0, 220);
  const hasLongDesc = (restaurant.description ?? '').length > 220;

  return (
    <div className="min-h-screen bg-white">

      {/* ── ① Hero ────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-72 lg:h-[420px] overflow-hidden bg-gray-200">
        {restaurant.cover_image_url && (
          <img
            src={restaurant.cover_image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Back link */}
        <Link
          to="/discover"
          className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-sm font-medium text-gray-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        {/* Save button */}
        <button
          onClick={() => setSaved(v => !v)}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-sm font-medium text-gray-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-white transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-colors ${saved ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {saved ? 'Saved' : 'Save this restaurant'}
        </button>

        {/* See all photos */}
        <button
          onClick={() => scrollTo('Photos')}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-sm font-semibold text-gray-800 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          See all {restaurant.total_photos} photos
        </button>
      </div>

      {/* ── ② Sticky Tab Nav ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => scrollTo(tab)}
                className={`
                  flex-shrink-0 px-4 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── ③ Main content ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-10 items-start">

          {/* ── Left column ──────────────────────────────────────────────── */}
          <div className="flex-[65] min-w-0">

            {/* A. Overview header */}
            <section
              id="overview"
              ref={el => { sectionRefs.current['Overview'] = el; }}
              className="mb-8"
            >
              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">
                {restaurant.name}
              </h1>

              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap text-sm text-gray-600 mb-4">
                <StarRating rating={restaurant.average_rating} />
                <span className="font-semibold text-gray-800">{restaurant.average_rating.toFixed(1)}</span>
                {restaurant.total_reviews > 0 && (
                  <span>({restaurant.total_reviews.toLocaleString()})</span>
                )}
                <span className="text-gray-300">·</span>
                <span>{PRICE_LABEL[restaurant.price_range] ?? '€€'}</span>
                <span className="text-gray-300">·</span>
                <span>{restaurant.cuisine_type}</span>
              </div>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap mb-5">
                {restaurant.tags.map(tag => (
                  <span key={tag} className="border border-gray-300 rounded-full px-3 py-1 text-sm text-gray-700">
                    {tag}
                  </span>
                ))}
              </div>

              {/* About */}
              {restaurant.description && (
                <div>
                  <h2 className="text-base font-semibold text-gray-900 mb-2">About this restaurant</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {expanded || !hasLongDesc ? restaurant.description : descShort + '…'}
                  </p>
                  {hasLongDesc && (
                    <button
                      onClick={() => setExpanded(v => !v)}
                      className="text-sm text-red-600 font-semibold hover:underline mt-1"
                    >
                      {expanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* B. Experiences */}
            <section
              id="experiences"
              ref={el => { sectionRefs.current['Experiences'] = el; }}
              className="mb-10"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Experiences</h2>
              <div className="flex flex-col gap-4">
                {experiences.map(exp => (
                  <div key={exp.id} className="flex gap-4 border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                    {/* Thumbnail */}
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {exp.image_url ? (
                        <img src={exp.image_url} alt={exp.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm">{exp.title}</h3>
                      <p className="text-red-600 font-semibold text-sm mt-0.5">
                        €{exp.price_per_person.toFixed(2)} per person
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatExperienceDate(exp.date)}</p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">{exp.description}</p>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0 flex items-center">
                      <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                        Reserve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* C. Photos grid */}
            <section
              id="photos"
              ref={el => { sectionRefs.current['Photos'] = el; }}
              className="mb-10"
            >
              <h2 className="text-xl font-bold text-gray-900">{restaurant.total_photos} Photos</h2>
              <p className="text-sm text-red-600 mb-4 hover:underline cursor-pointer">
                Explore {restaurant.name}'s photos.
              </p>

              {restaurant.gallery_images.length >= 5 ? (
                <div className="grid grid-cols-3 grid-rows-2 gap-2 h-72 lg:h-96">
                  {/* Large left image */}
                  <div className="col-span-1 row-span-2 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={restaurant.gallery_images[0]}
                      alt="Gallery 1"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Top-right 2 */}
                  <div className="rounded-xl overflow-hidden bg-gray-100">
                    <img src={restaurant.gallery_images[1]} alt="Gallery 2" className="w-full h-full object-cover" />
                  </div>
                  <div className="rounded-xl overflow-hidden bg-gray-100">
                    <img src={restaurant.gallery_images[2]} alt="Gallery 3" className="w-full h-full object-cover" />
                  </div>
                  {/* Bottom-right 2 */}
                  <div className="rounded-xl overflow-hidden bg-gray-100">
                    <img src={restaurant.gallery_images[3]} alt="Gallery 4" className="w-full h-full object-cover" />
                  </div>
                  {/* Last: overlay */}
                  <div className="relative rounded-xl overflow-hidden bg-gray-100">
                    <img src={restaurant.gallery_images[4]} alt="Gallery 5" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        +{restaurant.total_photos - 4} More
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {restaurant.gallery_images.map((img, i) => (
                    <div key={i} className="w-32 h-28 rounded-xl overflow-hidden bg-gray-100">
                      <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* D. Menu placeholder */}
            <section
              id="menu"
              ref={el => { sectionRefs.current['Menu'] = el; }}
              className="mb-10"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-2">Menu</h2>
              <p className="text-sm text-gray-600 mb-3">{restaurant.name}'s menu.</p>
              {restaurant.website ? (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View menu on restaurant's website
                </a>
              ) : (
                <p className="text-sm text-gray-400 italic">Menu not available online.</p>
              )}
            </section>

            {/* E. Reviews */}
            <section
              ref={el => { sectionRefs.current['Reviews'] = el; }}
              className="mb-10"
            >
              <ReviewsSection restaurant={restaurant} reviews={reviews} />
            </section>

            {/* F. Details */}
            <section
              id="details"
              ref={el => { sectionRefs.current['Details'] = el; }}
              className="mb-10"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Address</p>
                  <p>{restaurant.address}</p>
                  <p>{restaurant.city}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Contact</p>
                  <p>{restaurant.phone}</p>
                  {restaurant.website && (
                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer"
                      className="text-red-600 hover:underline break-all">
                      {restaurant.website}
                    </a>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Hours</p>
                  {Object.entries(restaurant.operating_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between max-w-[200px]">
                      <span className="capitalize text-gray-600">{day.slice(0, 3)}</span>
                      <span>
                        {hours.is_closed ? 'Closed' : `${hours.open} – ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Amenities</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {restaurant.amenities.map(a => <li key={a}>{a}</li>)}
                  </ul>
                </div>
              </div>
            </section>

            {/* G. FAQs */}
            <section
              id="faqs"
              ref={el => { sectionRefs.current['FAQs'] = el; }}
              className="mb-16"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">FAQs</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold mb-1">What is the cancellation policy?</p>
                  <p className="text-gray-500">
                    Cancellations must be made at least {restaurant.cancellation_hours} hours in advance.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold mb-1">Is there outdoor seating?</p>
                  <p className="text-gray-500">
                    {restaurant.amenities.includes('Outdoor seating')
                      ? 'Yes, outdoor seating is available.'
                      : 'Outdoor seating is not available at this location.'}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold mb-1">Do you accept dietary restrictions?</p>
                  <p className="text-gray-500">Please contact the restaurant directly to discuss specific dietary requirements.</p>
                </div>
              </div>
            </section>
          </div>

          {/* ── Right column: sticky reservation widget ───────────────────── */}
          <div className="hidden lg:block w-80 flex-shrink-0 sticky top-24">
            <ReservationWidget restaurant={restaurant} />
          </div>
        </div>
      </div>

      {/* Mobile: floating reservation CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors">
          Reserve a Table
        </button>
      </div>
    </div>
  );
};

export default RestaurantDetailPage;
