import React, { useState, useRef, useEffect, useMemo, useReducer } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Restaurant } from '../interfaces/restaurant';
import { SlotAvailability } from '../interfaces/reservation';
import { Review } from '../interfaces/review';
import { apiFetch, ApiError, resolveImageUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PhotoGalleryModal from '../components/restaurant/PhotoGalleryModal';
import useFetch from '../hooks/useFetch';
import FavoriteButton from '../components/FavoriteButton';
import StarRating from '../components/common/StarRating';

import {
  TIME_OPTIONS,
  QUICK_TIME_SLOTS,
  PARTY_SIZES,
  todayISO,
  toApiTime,
  toApiPartySize,
  PRICE_SYMBOLS,
} from '../constants/reservation';

const NAV_TABS = ['Overview', 'Concierge', 'Photos', 'Menu', 'Reviews', 'Details', 'FAQs'];

const TAGS = [
  'Vegetarian-friendly',
  'Vegan-friendly',
  'Good for groups',
  'Great for creative dining',
  'Halal',
];

const CONCIERGE_SUGGESTIONS = [
  { emoji: '\u{1F33F}', text: 'Is it suitable for a romantic dinner?' },
  { emoji: '\u{1F354}', text: 'What are the most popular dishes?' },
  { emoji: '\u{1F332}', text: 'Tell me about the atmosphere' },
  { emoji: '\u{1F465}', text: 'Can it accommodate large groups?' },
];

const AVATAR_COLORS = [
  'from-gray-600 to-gray-800',
  'from-gray-400 to-gray-600',
  'from-gray-500 to-gray-700',
  'from-gray-300 to-gray-500',
];

type ReviewFormAction =
  | { type: 'OPEN_FORM' }
  | { type: 'CLOSE_FORM' }
  | { type: 'SET_RATING'; rating: number }
  | { type: 'SET_TEXT'; text: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string };

interface ReviewFormState {
  showForm: boolean;
  rating: number;
  text: string;
  submitting: boolean;
  error: string | null;
}

const REVIEW_FORM_INITIAL_STATE: ReviewFormState = {
  showForm: false,
  rating: 0,
  text: '',
  submitting: false,
  error: null,
};

function reviewFormReducer(state: ReviewFormState, action: ReviewFormAction): ReviewFormState {
  switch (action.type) {
    case 'OPEN_FORM':
      return { ...state, showForm: true };
    case 'CLOSE_FORM':
      return { ...REVIEW_FORM_INITIAL_STATE };
    case 'SET_RATING':
      return { ...state, rating: action.rating };
    case 'SET_TEXT':
      return { ...state, text: action.text };
    case 'SUBMIT_START':
      return { ...state, submitting: true, error: null };
    case 'SUBMIT_SUCCESS':
      return { ...REVIEW_FORM_INITIAL_STATE };
    case 'SUBMIT_ERROR':
      return { ...state, submitting: false, error: action.error };
    default:
      return state;
  }
}

const StarSelector: React.FC<{
  value: number;
  onChange: (rating: number) => void;
}> = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(i => (
      <button
        key={i}
        type="button"
        onClick={() => onChange(i)}
        className="focus:outline-none"
      >
        <svg
          className={`w-7 h-7 transition-colors ${i <= value ? 'text-ot-primary' : 'text-ot-iron dark:text-dark-border hover:text-ot-manatee dark:hover:text-dark-text-secondary'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      </button>
    ))}
  </div>
);

function ratingLabel(rating: number | null): string {
  if (!rating) return '';
  if (rating >= 4.5) return 'Exceptional';
  if (rating >= 4.0) return 'Awesome';
  if (rating >= 3.5) return 'Very Good';
  return 'Good';
}

const RatingBar: React.FC<{ score: number }> = ({ score }) => (
  <div className="flex-1 h-1.5 bg-ot-iron dark:bg-dark-border rounded-full overflow-hidden">
    <div
      className="h-full bg-ot-primary rounded-full transition-all duration-700"
      style={{ width: `${(score / 5) * 100}%` }}
    />
  </div>
);

const NoiseBar: React.FC<{ level: number }> = ({ level }) => (
  <div className="flex items-end gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className={`w-1.5 rounded-sm transition-all ${
          i <= level ? 'bg-ot-primary' : 'bg-ot-iron dark:bg-dark-border'
        }`}
        style={{ height: `${8 + i * 3}px` }}
      />
    ))}
  </div>
);

const createPinIcon = () =>
  L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:36px;height:46px;">
        <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="#2D333F"/>
          <circle cx="18" cy="18" r="8" fill="white"/>
          <circle cx="18" cy="18" r="4" fill="#2D333F"/>
        </svg>
      </div>
    `,
    iconSize: [36, 46],
    iconAnchor: [18, 46],
  });

const BRATISLAVA_CENTER: [number, number] = [48.148, 17.107];

const LocationMiniMap: React.FC<{ lat: number | null; lng: number | null; name: string }> = ({ lat, lng, name }) => {
  const position: [number, number] = lat && lng ? [lat, lng] : BRATISLAVA_CENTER;
  const icon = useMemo(createPinIcon, []);

  return (
    <MapContainer
      center={position}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      <Marker position={position} icon={icon} title={name} />
    </MapContainer>
  );
};


const RestaurantDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: restaurant, isLoading: restaurantLoading, error: restaurantError, refetch: refetchRestaurant } =
    useFetch<Restaurant>(slug ? `/restaurants/${slug}` : null);

  const [partySize, setPartySize]       = useState(searchParams.get('party') || '2 people');
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || todayISO);
  const [selectedTime, setSelectedTime] = useState(searchParams.get('time') || '7:00 PM');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [availability, setAvailability] = useState<SlotAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [activeTab, setActiveTab]       = useState('Overview');
  const [reviewSearch, setReviewSearch] = useState('');
  const [galleryPhotoIndex, setGalleryPhotoIndex] = useState<number | null>(null);
  const [conciergeQuery, setConciergeQuery] = useState('');

  const { data: fetchedReviews, isLoading: reviewsLoading, refetch: refetchReviews } =
    useFetch<Review[]>(restaurant ? `/reviews/restaurant/${restaurant.id}` : null);
  const reviews = fetchedReviews ?? [];

  const [reviewForm, dispatchReview] = useReducer(reviewFormReducer, REVIEW_FORM_INITIAL_STATE);

  const { user } = useAuth();

  const overviewRef  = useRef<HTMLDivElement>(null);
  const reviewsRef   = useRef<HTMLDivElement>(null);
  const conciergeRef = useRef<HTMLDivElement>(null);

  const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    Overview:  overviewRef,
    Concierge: conciergeRef,
    Reviews:   reviewsRef,
  };

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    setAvailabilityLoading(true);
    const params = new URLSearchParams({
      reservation_date: selectedDate,
      reservation_time: toApiTime(selectedTime),
      party_size: String(toApiPartySize(partySize)),
    });
    apiFetch<SlotAvailability>(`/reservations/${slug}/availability?${params}`)
      .then(setAvailability)
      .catch(() => {})
      .finally(() => setAvailabilityLoading(false));
    return () => controller.abort();
  }, [slug, selectedDate, selectedTime, partySize]);

  const handleSubmitReview = async () => {
    if (!restaurant || reviewForm.rating === 0) return;
    dispatchReview({ type: 'SUBMIT_START' });
    try {
      await apiFetch(`/reviews/${restaurant.id}`, {
        method: 'POST',
        body: JSON.stringify({
          rating: reviewForm.rating,
          text: reviewForm.text.trim() || null,
        }),
      });
      dispatchReview({ type: 'SUBMIT_SUCCESS' });
      refetchReviews();
      refetchRestaurant();
    } catch (err) {
      if (err instanceof ApiError) {
        dispatchReview({ type: 'SUBMIT_ERROR', error: err.message });
      }
    }
  };

  const scrollToSection = (tab: string) => {
    setActiveTab(tab);
    const ref = sectionRefs[tab];
    if (ref?.current) {
      const offset = 72;
      const top = ref.current.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 100;
      if (reviewsRef.current && scrollY >= reviewsRef.current.offsetTop) {
        setActiveTab('Reviews');
      } else if (conciergeRef.current && scrollY >= conciergeRef.current.offsetTop) {
        setActiveTab('Concierge');
      } else if (overviewRef.current && scrollY >= overviewRef.current.offsetTop) {
        setActiveTab('Overview');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredReviews = reviews.filter(
    r =>
      reviewSearch === '' ||
      (r.text && r.text.toLowerCase().includes(reviewSearch.toLowerCase())) ||
      r.author.first_name.toLowerCase().includes(reviewSearch.toLowerCase())
  );

  const handleSlotClick = (slot: string) => {
    if (slot === selectedSlot) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
      setSelectedTime(slot);
    }
  };

  const handleTimeDropdownChange = (time: string) => {
    setSelectedTime(time);
    setSelectedSlot(null);
  };

  const handleBook = () => {
    if (!slug) return;
    const params = new URLSearchParams({ date: selectedDate, time: selectedTime, party: partySize });
    navigate(`/restaurant/${slug}/book?${params.toString()}`);
  };

  if (restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ot-primary" />
      </div>
    );
  }

  if (restaurantError || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-ot-pale-sky dark:text-dark-text-secondary">{restaurantError ?? 'Restaurant not found'}</p>
        <button onClick={() => navigate('/search')} className="text-ot-primary dark:text-dark-primary font-bold hover:underline">
          Back to search
        </button>
      </div>
    );
  }

  const priceLabel = PRICE_SYMBOLS[restaurant.price_range] ?? '$$';
  const overallRating = restaurant.rating ?? 4.5;

  const allPhotos: string[] = [
    ...(restaurant.cover_image ? [resolveImageUrl(restaurant.cover_image)] : []),
    ...(restaurant.gallery_images?.map(resolveImageUrl) ?? []),
  ];

  const heroImage = allPhotos[0] ?? null;

  return (
    <div className="min-h-screen bg-white dark:bg-dark-paper">

      <div className="relative h-64 md:h-[420px] overflow-hidden cursor-pointer" onClick={() => allPhotos.length > 0 && setGalleryPhotoIndex(0)}>
        {heroImage ? (
          <img
            src={heroImage}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-ot-athens-gray dark:bg-dark-bg flex flex-col items-center justify-center gap-2 text-ot-manatee dark:text-dark-text-secondary">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">No photos yet</span>
          </div>
        )}
        {allPhotos.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setGalleryPhotoIndex(0); }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-dark-paper/90 backdrop-blur-sm text-ot-charade dark:text-dark-text text-sm font-bold px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:bg-white dark:hover:bg-dark-paper transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            See all {allPhotos.length} photos
          </button>
        )}
      </div>

      <div className="sticky top-0 z-30 bg-white dark:bg-dark-paper border-b border-ot-iron dark:border-dark-border">
        <div className="max-w-6xl mx-auto px-4 flex items-center overflow-x-auto scrollbar-hide">
          {NAV_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => scrollToSection(tab)}
              className={`flex-shrink-0 px-4 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'border-ot-primary text-ot-primary dark:text-dark-primary'
                  : 'border-transparent text-ot-pale-sky dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text hover:border-ot-iron dark:hover:border-dark-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          <div className="flex-1 min-w-0">

            <div ref={overviewRef} className="mb-8 scroll-mt-20">
              <div className="flex items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-ot-charade dark:text-dark-text leading-tight">
                  {restaurant.name}
                </h1>
                <FavoriteButton restaurantId={restaurant.id} variant="labeled" />
              </div>

              <div className="flex items-center gap-2 flex-wrap text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-3">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={overallRating} size="w-3.5 h-3.5" />
                  <span className="font-bold text-ot-charade dark:text-dark-text">{ratingLabel(restaurant.rating)}</span>
                  <span className="text-ot-manatee dark:text-dark-text-secondary">({restaurant.review_count} reviews)</span>
                </div>
                <span className="text-ot-iron hidden sm:block">|</span>
                <span className="font-medium">{priceLabel}</span>
                <span className="text-ot-iron">&middot;</span>
                <span>{restaurant.cuisine}</span>
                <span className="text-ot-iron">&middot;</span>
                <span>{restaurant.city}</span>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-ot-pale-sky dark:text-dark-text-secondary">
                <svg className="w-4 h-4 text-ot-manatee dark:text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{restaurant.address}, {restaurant.city}</span>
              </div>
            </div>

            <hr className="border-ot-iron/50 dark:border-dark-border mb-8" />

            {restaurant.description && (
              <>
                <div className="mb-10">
                  <h2 className="text-lg font-extrabold text-ot-charade dark:text-dark-text mb-4">About this restaurant</h2>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {TAGS.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-ot-athens-gray dark:bg-dark-bg text-ot-charade dark:text-dark-text text-sm rounded-ot-btn border border-ot-iron dark:border-dark-border cursor-default flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 text-ot-manatee dark:text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-ot-pale-sky dark:text-dark-text-secondary text-sm leading-relaxed">{restaurant.description}</p>
                </div>
                <hr className="border-ot-iron/50 dark:border-dark-border mb-10" />
              </>
            )}

            <div ref={conciergeRef} className="mb-10 scroll-mt-20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{'\u2728'}</span>
                <h2 className="text-lg font-extrabold text-ot-charade dark:text-dark-text">Concierge</h2>
                <span className="text-xs bg-ot-athens-gray dark:bg-dark-bg text-ot-pale-sky dark:text-dark-text-secondary px-2 py-0.5 rounded-ot-btn font-bold border border-ot-iron dark:border-dark-border">
                  AI-Powered
                </span>
              </div>
              <p className="text-sm text-ot-manatee dark:text-dark-text-secondary mb-5">Ask me anything about this restaurant</p>

              <div className="bg-ot-athens-gray dark:bg-dark-bg rounded-ot-card p-5 border border-ot-iron dark:border-dark-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {CONCIERGE_SUGGESTIONS.map((card, i) => (
                    <button
                      key={i}
                      onClick={() => setConciergeQuery(card.text)}
                      className="flex items-center gap-3 bg-white dark:bg-dark-paper p-3.5 rounded-ot-card border border-ot-iron dark:border-dark-border text-left hover:shadow-md hover:border-ot-primary/30 transition-all group"
                    >
                      <span className="text-xl flex-shrink-0">{card.emoji}</span>
                      <span className="text-sm text-ot-charade dark:text-dark-text group-hover:text-ot-charade dark:group-hover:text-dark-text flex-1">{card.text}</span>
                      <svg className="w-4 h-4 text-ot-iron flex-shrink-0 group-hover:text-ot-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={conciergeQuery}
                    onChange={e => setConciergeQuery(e.target.value)}
                    placeholder="Ask a question about this restaurant..."
                    className="flex-1 text-sm border border-ot-iron dark:border-dark-border rounded-ot-btn px-4 py-3 bg-white dark:bg-dark-surface dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-ot-primary dark:ring-dark-primary placeholder-ot-manatee dark:placeholder-dark-text-secondary"
                  />
                  <button className="bg-ot-primary text-white p-3 rounded-ot-btn hover:bg-ot-primary-dark transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-ot-iron/50 dark:border-dark-border mb-10" />

            <div ref={reviewsRef} className="scroll-mt-20">
              <h2 className="text-lg font-extrabold text-ot-charade dark:text-dark-text mb-6">Overall ratings and reviews</h2>

              <div className="bg-ot-athens-gray dark:bg-dark-bg rounded-ot-card p-6 mb-6 border border-ot-iron dark:border-dark-border">
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                  <div className="flex flex-col items-center justify-center sm:w-32 flex-shrink-0 text-center">
                    <span className="text-5xl font-extrabold text-ot-charade dark:text-dark-text tracking-tight mb-1">{overallRating.toFixed(1)}</span>
                    <StarRating rating={overallRating} size="w-5 h-5" />
                    <span className="text-sm font-bold text-ot-charade dark:text-dark-text mt-1.5">{ratingLabel(restaurant.rating)}</span>
                    <span className="text-xs text-ot-manatee dark:text-dark-text-secondary mt-0.5">{restaurant.review_count} reviews</span>
                  </div>

                  <div className="flex-1">
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = reviews.filter(r => r.rating === star).length;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <span className="text-sm text-ot-pale-sky dark:text-dark-text-secondary w-6 text-right flex-shrink-0">{star}</span>
                            <svg className="w-4 h-4 text-ot-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                            </svg>
                            <RatingBar score={pct / 20} />
                            <span className="text-xs text-ot-manatee dark:text-dark-text-secondary w-6 text-right flex-shrink-0">{count}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-ot-iron dark:border-dark-border">
                      <svg className="w-4 h-4 text-ot-manatee dark:text-dark-text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                      <span className="text-sm text-ot-pale-sky dark:text-dark-text-secondary">
                        Noise: <span className="font-bold text-ot-charade dark:text-dark-text">Energetic</span>
                      </span>
                      <NoiseBar level={4} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mb-6">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ot-manatee dark:text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={reviewSearch}
                  onChange={e => setReviewSearch(e.target.value)}
                  placeholder="Search reviews..."
                  className="w-full pl-10 pr-4 py-3 border border-ot-iron dark:border-dark-border rounded-ot-btn text-sm focus:outline-none focus:ring-2 focus:ring-ot-primary dark:ring-dark-primary bg-white dark:bg-dark-surface dark:text-dark-text placeholder-ot-manatee dark:placeholder-dark-text-secondary"
                />
                {reviewSearch && (
                  <button onClick={() => setReviewSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ot-manatee dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {user && (
                <div className="mb-6">
                  {!reviewForm.showForm ? (
                    <button
                      onClick={() => dispatchReview({ type: 'OPEN_FORM' })}
                      className="inline-flex items-center gap-2 bg-ot-primary hover:bg-ot-primary-dark text-white font-bold px-5 py-2.5 rounded-ot-btn transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Write a Review
                    </button>
                  ) : (
                    <div className="bg-ot-athens-gray dark:bg-dark-bg rounded-ot-card p-5 border border-ot-iron dark:border-dark-border">
                      <h3 className="text-sm font-bold text-ot-charade dark:text-dark-text mb-3">Your Review</h3>
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-ot-pale-sky dark:text-dark-text-secondary uppercase tracking-wide mb-2">Rating</label>
                        <StarSelector value={reviewForm.rating} onChange={r => dispatchReview({ type: 'SET_RATING', rating: r })} />
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-ot-pale-sky dark:text-dark-text-secondary uppercase tracking-wide mb-2">Review (optional)</label>
                        <textarea
                          value={reviewForm.text}
                          onChange={e => dispatchReview({ type: 'SET_TEXT', text: e.target.value })}
                          placeholder="Share your experience..."
                          maxLength={2000}
                          rows={4}
                          className="w-full border border-ot-iron dark:border-dark-border rounded-ot-btn px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ot-primary dark:ring-dark-primary bg-white dark:bg-dark-surface dark:text-dark-text placeholder-ot-manatee dark:placeholder-dark-text-secondary resize-none"
                        />
                      </div>
                      {reviewForm.error && (
                        <p className="text-xs text-red-600 mb-3">{reviewForm.error}</p>
                      )}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleSubmitReview}
                          disabled={reviewForm.rating === 0 || reviewForm.submitting}
                          className="bg-ot-primary hover:bg-ot-primary-dark text-white font-bold px-5 py-2.5 rounded-ot-btn transition-colors text-sm disabled:opacity-40"
                        >
                          {reviewForm.submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button
                          onClick={() => dispatchReview({ type: 'CLOSE_FORM' })}
                          className="text-sm text-ot-pale-sky dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {reviewSearch && (
                <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-4">
                  Showing {filteredReviews.length} of {reviews.length} reviews
                </p>
              )}

              {reviewsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-primary" />
                </div>
              ) : (
                <div className="space-y-7">
                  {filteredReviews.length > 0 ? (
                    filteredReviews.map((review, index) => {
                      const initials = review.author.first_name.charAt(0).toUpperCase();
                      const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                      const reviewDate = new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      });
                      return (
                        <div key={review.id} className="border-b border-ot-iron/50 dark:border-dark-border pb-7 last:border-0">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white font-bold text-xs">{initials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-sm font-bold text-ot-charade dark:text-dark-text">{review.author.first_name}</span>
                                <StarRating rating={review.rating} size="w-3.5 h-3.5" />
                                <span className="text-xs font-bold text-ot-charade dark:text-dark-text">
                                  {ratingLabel(review.rating)}
                                </span>
                              </div>
                              <span className="text-xs text-ot-manatee dark:text-dark-text-secondary">{reviewDate}</span>
                            </div>
                          </div>
                          {review.text && (
                            <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary leading-relaxed">{review.text}</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-10 h-10 text-ot-iron mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <p className="text-ot-manatee dark:text-dark-text-secondary text-sm">
                        {reviewSearch ? 'No reviews match your search.' : 'No reviews yet. Be the first to share your experience!'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-80 xl:w-[22rem] flex-shrink-0">
            <div className="lg:sticky lg:top-20 space-y-4">

              <div className="bg-white dark:bg-dark-paper rounded-ot-card border border-ot-iron dark:border-dark-border shadow-lg overflow-hidden">
                <div className="bg-ot-primary px-5 py-4">
                  <h3 className="text-base font-bold text-white">Make a reservation</h3>
                  <p className="text-white/60 text-xs mt-0.5">No credit card required</p>
                </div>

                <div className="p-5">
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-ot-pale-sky dark:text-dark-text-secondary uppercase tracking-wide mb-1.5">
                        Party size
                      </label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ot-manatee dark:text-dark-text-secondary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <select
                          value={partySize}
                          onChange={e => setPartySize(e.target.value)}
                          className="w-full pl-9 pr-8 py-3 border border-ot-iron dark:border-dark-border rounded-ot-btn text-sm text-ot-charade dark:text-dark-text appearance-none focus:outline-none focus:ring-2 focus:ring-ot-primary dark:ring-dark-primary bg-white dark:bg-dark-surface cursor-pointer font-medium"
                        >
                          {PARTY_SIZES.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ot-manatee dark:text-dark-text-secondary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div>
                        <label className="block text-xs font-bold text-ot-pale-sky dark:text-dark-text-secondary uppercase tracking-wide mb-1.5">
                          Date
                        </label>
                        <div className="relative">
                          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ot-manatee dark:text-dark-text-secondary pointer-events-none z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <input
                            type="date"
                            value={selectedDate}
                            min={todayISO()}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="w-full pl-8 pr-2 py-3 border border-ot-iron dark:border-dark-border rounded-ot-btn text-xs text-ot-charade dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-ot-primary dark:ring-dark-primary bg-white dark:bg-dark-surface cursor-pointer font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ot-pale-sky dark:text-dark-text-secondary uppercase tracking-wide mb-1.5">
                          Time
                        </label>
                        <div className="relative">
                          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ot-manatee dark:text-dark-text-secondary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <select
                            value={selectedTime}
                            onChange={e => handleTimeDropdownChange(e.target.value)}
                            className="w-full pl-8 pr-6 py-3 border border-ot-iron dark:border-dark-border rounded-ot-btn text-xs text-ot-charade dark:text-dark-text appearance-none focus:outline-none focus:ring-2 focus:ring-ot-primary dark:ring-dark-primary bg-white dark:bg-dark-surface cursor-pointer font-medium"
                          >
                            {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                          </select>
                          <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ot-manatee dark:text-dark-text-secondary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {availability && !availabilityLoading && (
                      <div className={`mb-4 px-3 py-2 rounded-ot-btn text-xs font-medium ${
                        availability.available_tables === 0
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800'
                          : availability.available_tables <= 3
                            ? 'bg-amber-50 dark:bg-yellow-900/20 text-amber-700 border border-amber-200 dark:border-yellow-800'
                            : 'bg-green-50 dark:bg-green-900/20 text-green-700 border border-green-200 dark:border-green-800'
                      }`}>
                        {availability.available_tables === 0
                          ? 'No tables available for this time slot'
                          : availability.available_tables <= 3
                            ? `Only ${availability.available_tables} table${availability.available_tables === 1 ? '' : 's'} left`
                            : `${availability.available_tables} tables available`}
                      </div>
                    )}

                    <p className="text-xs font-bold text-ot-pale-sky dark:text-dark-text-secondary uppercase tracking-wide mb-2">
                      Quick-select a time
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {QUICK_TIME_SLOTS.map(slot => (
                        <button
                          key={slot}
                          onClick={() => handleSlotClick(slot)}
                          className={`py-2 text-xs font-bold rounded-ot-btn transition-all ${
                            selectedSlot === slot
                              ? 'bg-ot-charade dark:bg-dark-primary text-white ring-2 ring-ot-charade dark:ring-dark-primary ring-offset-1'
                              : 'bg-ot-primary text-white hover:bg-ot-primary-dark'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleBook}
                      disabled={availability?.available_tables === 0}
                      className="w-full py-3.5 text-sm font-bold text-white bg-ot-primary rounded-ot-btn hover:bg-ot-primary-dark transition-colors mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {availability?.available_tables === 0
                        ? 'No tables available'
                        : `Book a Table \u00B7 ${selectedTime}`}
                    </button>

                    <button className="w-full py-3 text-sm font-medium text-ot-charade dark:text-dark-text border border-ot-iron dark:border-dark-border rounded-ot-btn hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Notify me
                    </button>

                    <p className="text-xs text-ot-manatee dark:text-dark-text-secondary text-center mt-3">
                      You won't be charged until after your visit
                    </p>
                  </div>
              </div>

              <div className="bg-white dark:bg-dark-paper rounded-ot-card border border-ot-iron dark:border-dark-border overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <LocationMiniMap
                    lat={restaurant.latitude}
                    lng={restaurant.longitude}
                    name={restaurant.name}
                  />
                </div>
                <div className="px-4 py-3.5">
                  <p className="text-sm font-bold text-ot-charade dark:text-dark-text">{restaurant.address}</p>
                  <p className="text-xs text-ot-pale-sky dark:text-dark-text-secondary mt-0.5">{restaurant.city}, {restaurant.country}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${restaurant.address}, ${restaurant.city}, ${restaurant.country}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-ot-primary dark:text-dark-primary mt-2 hover:underline"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Get directions
                  </a>
                </div>
              </div>

              <div className="bg-ot-athens-gray dark:bg-dark-bg rounded-ot-card p-4 border border-ot-iron dark:border-dark-border">
                <h4 className="text-sm font-bold text-ot-charade dark:text-dark-text mb-3">Good to know</h4>
                <div className="space-y-2">
                  {[
                    { icon: '\u{1F550}', text: 'Open until 11:00 PM today' },
                    ...(restaurant.phone_number ? [{ icon: '\u{1F4DE}', text: restaurant.phone_number }] : []),
                    { icon: '\u{1F17F}\u{FE0F}', text: 'Parking nearby' },
                    { icon: '\u{267F}', text: 'Wheelchair accessible' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-ot-pale-sky dark:text-dark-text-secondary">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PhotoGalleryModal
        images={allPhotos}
        restaurantName={restaurant.name}
        isOpen={galleryPhotoIndex !== null}
        onClose={() => setGalleryPhotoIndex(null)}
      />
    </div>
  );
};

export default RestaurantDetailPage;
