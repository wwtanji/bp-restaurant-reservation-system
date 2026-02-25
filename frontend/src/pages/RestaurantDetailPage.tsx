import React, { useState, useRef, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────

interface Review {
  id: number;
  author: string;
  initials: string;
  dined: string;
  rating: number;
  text: string;
  avatarColor: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const NAV_TABS = ['Overview', 'Concierge', 'Photos', 'Menu', 'Reviews', 'Details', 'FAQs'];

const TAGS = [
  'Vegetarian-friendly',
  'Vegan-friendly',
  'Good for groups',
  'Great for creative dining',
  'Halal',
];

const TIME_SLOTS = ['6:30 PM', '6:45 PM', '7:00 PM', '7:15 PM', '7:30 PM'];

const PARTY_SIZES = Array.from({ length: 8 }, (_, i) =>
  i === 0 ? '1 person' : `${i + 1} people`
);

const CONCIERGE_SUGGESTIONS = [
  { emoji: '🌿', text: 'Is it suitable for a romantic dinner?' },
  { emoji: '🍔', text: 'What are the most popular dishes?' },
  { emoji: '🌲', text: 'Tell me about the forest-themed atmosphere' },
  { emoji: '👥', text: 'Can it accommodate large groups?' },
];

const RATING_CATEGORIES = [
  { label: 'Food',     score: 4.7 },
  { label: 'Service',  score: 4.4 },
  { label: 'Ambience', score: 4.6 },
  { label: 'Value',    score: 4.3 },
];

const REVIEWS: Review[] = [
  {
    id: 1,
    author: 'Sarah M.',
    initials: 'SM',
    dined: 'Dined on February 18, 2026',
    rating: 5,
    text: 'Absolutely magical atmosphere! The towering tree-like structures and warm amber lighting create a truly enchanting fairy-tale forest vibe. The burgers were fantastic and the staff was very attentive. Perfect for a special occasion dinner — my partner was completely wowed by the decor.',
    avatarColor: 'from-rose-400 to-red-500',
  },
  {
    id: 2,
    author: 'Thomas K.',
    initials: 'TK',
    dined: 'Dined on February 14, 2026',
    rating: 4,
    text: 'Great food, truly unique interior design. One downside is the noise level — it gets quite energetic during peak hours, making conversation a bit of a challenge. The menu system (digital ordering) is also a bit complicated at first, but the staff was very helpful. Definitely recommend booking the separate room for larger groups.',
    avatarColor: 'from-blue-400 to-indigo-500',
  },
  {
    id: 3,
    author: 'Julia W.',
    initials: 'JW',
    dined: 'Dined on January 30, 2026',
    rating: 4,
    text: 'Booked the private separate room for our office team of 12 — worked out perfectly! Great selection of burgers and the vegetarian options were surprisingly good and creative. The music was energetic which suited our group vibe perfectly, though one colleague mentioned it was hard to hear across the table.',
    avatarColor: 'from-purple-400 to-pink-500',
  },
  {
    id: 4,
    author: 'Marco B.',
    initials: 'MB',
    dined: 'Dined on January 22, 2026',
    rating: 3,
    text: 'Beautiful restaurant with jaw-dropping decor. The acoustics in the main hall make it very loud — noise-sensitive guests should be aware! The digital menu ordering system is a bit overwhelming at first glance. Food quality is genuinely high, but prices are on the steeper side for a burger restaurant. Overall a 3/5 experience.',
    avatarColor: 'from-amber-400 to-orange-500',
  },
  {
    id: 5,
    author: 'Anna L.',
    initials: 'AL',
    dined: 'Dined on December 15, 2025',
    rating: 5,
    text: 'One of the best burger places in Vienna! The forest-themed decor is absolutely stunning and unlike anything else in the city. Ordered the truffle burger and it was exceptional. Service was quick even though it was a packed Friday evening. The vegan options are also outstanding. Will definitely be back!',
    avatarColor: 'from-emerald-400 to-teal-500',
  },
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&h=600&fit=crop',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=450&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=450&h=300&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=450&h=300&fit=crop',
  'https://images.unsplash.com/photo-1550966871-3ed3cfd06327?w=450&h=300&fit=crop',
];

// ── Sub-components ────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg' }> = ({
  rating,
  size = 'md',
}) => {
  const dim = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }[size];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`${dim} ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  );
};

const RatingBar: React.FC<{ score: number }> = ({ score }) => (
  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
    <div
      className="h-full bg-[#d32f2f] rounded-full transition-all duration-700"
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
          i <= level ? 'bg-[#d32f2f]' : 'bg-gray-200'
        }`}
        style={{ height: `${8 + i * 3}px` }}
      />
    ))}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────

const RestaurantDetailPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [partySize, setPartySize] = useState('2 people');
  const [selectedDate, setSelectedDate] = useState('2026-03-12');
  const [selectedTime, setSelectedTime] = useState('7:00 PM');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reviewSearch, setReviewSearch] = useState('');
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [conciergeQuery, setConciergeQuery] = useState('');

  const overviewRef  = useRef<HTMLDivElement>(null);
  const reviewsRef   = useRef<HTMLDivElement>(null);
  const conciergeRef = useRef<HTMLDivElement>(null);

  const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    Overview:   overviewRef,
    Concierge:  conciergeRef,
    Reviews:    reviewsRef,
  };

  const scrollToSection = (tab: string) => {
    setActiveTab(tab);
    const ref = sectionRefs[tab];
    if (ref?.current) {
      const offset = 72; // sticky nav height
      const top = ref.current.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Highlight active tab based on scroll position
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

  const filteredReviews = REVIEWS.filter(
    r =>
      reviewSearch === '' ||
      r.text.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.author.toLowerCase().includes(reviewSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Montserrat', 'Open Sans', sans-serif" }}>

      {/* ── Hero Gallery ─────────────────────────────────────────────── */}
      <div className="relative">
        {/* Mobile: single image */}
        <div className="md:hidden h-64 overflow-hidden">
          <img
            src={HERO_IMAGES[0]}
            alt="Peter Pane interior"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Desktop: 5-image grid */}
        <div className="hidden md:grid md:grid-cols-[2fr_1fr] md:grid-rows-2 h-[480px] gap-0.5 overflow-hidden">
          <img
            src={HERO_IMAGES[0]}
            alt="Peter Pane main interior"
            className="row-span-2 w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer"
            onClick={() => setShowAllPhotos(true)}
          />
          {HERO_IMAGES.slice(1).map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Restaurant photo ${i + 2}`}
              className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer"
              onClick={() => setShowAllPhotos(true)}
            />
          ))}
        </div>

        {/* View all photos button */}
        <button
          onClick={() => setShowAllPhotos(true)}
          className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm text-gray-800 text-sm font-semibold px-4 py-2 rounded-xl shadow-lg hover:bg-white hover:shadow-xl transition-all flex items-center gap-2 border border-gray-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          View all photos
        </button>
      </div>

      {/* ── Sticky Navigation Tabs ────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center overflow-x-auto scrollbar-hide">
          {NAV_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => scrollToSection(tab)}
              className={`flex-shrink-0 px-4 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'border-[#d32f2f] text-[#d32f2f]'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Page Body ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* ── Left Column ──────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Restaurant Header */}
            <div ref={overviewRef} className="mb-8 scroll-mt-20">
              <div className="flex items-start gap-3 flex-wrap mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                  Peter Pane – Wien Mariahilferstraße
                </h1>
                <span className="text-xs font-bold text-white bg-[#d32f2f] px-2.5 py-1 rounded-full mt-1 flex-shrink-0">
                  NEW
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={4.5} size="sm" />
                  <span className="font-bold text-gray-900">Awesome</span>
                  <span className="text-gray-400">(659 reviews)</span>
                </div>
                <span className="text-gray-300 hidden sm:block">|</span>
                <span className="font-medium">$$$$</span>
                <span className="text-gray-300">·</span>
                <span>Burgers</span>
                <span className="text-gray-300">·</span>
                <span>Vienna, Mariahilferstraße</span>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Booked <span className="font-semibold text-gray-700">26 times</span> today</span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  In high demand
                </span>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-100 mb-8" />

            {/* About Section */}
            <div className="mb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-4">About this restaurant</h2>

              {/* Tag chips */}
              <div className="flex flex-wrap gap-2 mb-5">
                {TAGS.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition cursor-default flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
                <p>
                  Step into a fairy-tale world at <strong className="text-gray-900">Peter Pane</strong> on
                  Vienna's famous Mariahilferstraße. Our restaurant enchants guests with its spectacular
                  interior — towering tree-like structures, lush greenery, and warm amber lighting that
                  transforms every meal into a truly magical experience.
                </p>
                <p>
                  We serve premium hand-crafted burgers using high-quality, sustainably sourced ingredients,
                  with an extensive menu featuring creative options for every dietary preference — from
                  hearty meat lovers' choices to imaginative vegan and vegetarian alternatives. Our digital
                  ordering system puts the entire menu at your fingertips.
                </p>
                <p>
                  For larger celebrations and corporate gatherings, we offer a dedicated separate dining
                  room that can be reserved exclusively for your group, ensuring a more intimate atmosphere
                  away from the vibrant main floor.
                </p>
              </div>
            </div>

            <hr className="border-gray-100 mb-10" />

            {/* Concierge AI Section */}
            <div ref={conciergeRef} className="mb-10 scroll-mt-20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">✨</span>
                <h2 className="text-lg font-bold text-gray-900">Concierge</h2>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                  AI-Powered
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                Ask me anything about Peter Pane – Wien Mariahilferstraße
              </p>

              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl p-5 border border-amber-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {CONCIERGE_SUGGESTIONS.map((card, i) => (
                    <button
                      key={i}
                      onClick={() => setConciergeQuery(card.text)}
                      className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-amber-200/70 text-left hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all group"
                    >
                      <span className="text-xl flex-shrink-0">{card.emoji}</span>
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                        {card.text}
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-[#d32f2f] transition-colors"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
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
                    className="flex-1 text-sm border border-amber-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder-gray-400"
                  />
                  <button className="bg-[#d32f2f] text-white p-3 rounded-xl hover:bg-[#b71c1c] active:scale-95 transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-gray-100 mb-10" />

            {/* ── Reviews Section ───────────────────────────────────── */}
            <div ref={reviewsRef} className="scroll-mt-20">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Overall ratings and reviews</h2>

              {/* Ratings Dashboard */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">

                  {/* Overall score */}
                  <div className="flex flex-col items-center justify-center sm:w-32 flex-shrink-0 text-center">
                    <span className="text-5xl font-bold text-gray-900 tracking-tight mb-1">4.5</span>
                    <StarRating rating={4.5} size="lg" />
                    <span className="text-sm font-bold text-gray-800 mt-1.5">Awesome</span>
                    <span className="text-xs text-gray-400 mt-0.5">659 reviews</span>
                  </div>

                  {/* Category bars */}
                  <div className="flex-1">
                    <div className="space-y-3 mb-5">
                      {RATING_CATEGORIES.map(cat => (
                        <div key={cat.label} className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 w-16 flex-shrink-0">{cat.label}</span>
                          <RatingBar score={cat.score} />
                          <span className="text-sm font-bold text-gray-900 w-8 text-right flex-shrink-0">
                            {cat.score}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Noise indicator */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        Noise: <span className="font-bold text-gray-900">Energetic</span>
                      </span>
                      <NoiseBar level={4} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Review search */}
              <div className="relative mb-6">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={reviewSearch}
                  onChange={e => setReviewSearch(e.target.value)}
                  placeholder="Search reviews..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white placeholder-gray-400"
                />
                {reviewSearch && (
                  <button
                    onClick={() => setReviewSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Review count */}
              {reviewSearch && (
                <p className="text-sm text-gray-500 mb-4">
                  Showing {filteredReviews.length} of {REVIEWS.length} reviews
                </p>
              )}

              {/* Review list */}
              <div className="space-y-7">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map(review => (
                    <div key={review.id} className="border-b border-gray-100 pb-7 last:border-0">
                      <div className="flex items-start gap-3 mb-3">
                        {/* Avatar */}
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${review.avatarColor} flex items-center justify-center flex-shrink-0 shadow-sm`}
                        >
                          <span className="text-white font-bold text-xs">{review.initials}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-sm font-bold text-gray-900">{review.author}</span>
                            <StarRating rating={review.rating} size="sm" />
                            <span className="text-xs font-semibold text-gray-700">
                              {review.rating === 5 ? 'Exceptional' : review.rating === 4 ? 'Awesome' : 'Good'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{review.dined}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>

                      <button className="mt-2 text-xs text-[#006AFF] hover:underline flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        Helpful
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-400 text-sm">No reviews match your search.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column: Reservation Widget ─────────────────────── */}
          <div className="lg:w-80 xl:w-[22rem] flex-shrink-0">
            <div className="lg:sticky lg:top-20 space-y-4">

              {/* Reservation Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                {/* Card header */}
                <div className="bg-gradient-to-r from-[#d32f2f] to-[#b71c1c] px-5 py-4">
                  <h3 className="text-base font-bold text-white">Make a reservation</h3>
                  <p className="text-red-200 text-xs mt-0.5">No credit card required</p>
                </div>

                <div className="p-5">
                  {/* Party size */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Party size
                    </label>
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <select
                        value={partySize}
                        onChange={e => setPartySize(e.target.value)}
                        className="w-full pl-9 pr-8 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#d32f2f] bg-white cursor-pointer font-medium"
                      >
                        {PARTY_SIZES.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <svg
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Date & Time row */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Date
                      </label>
                      <div className="relative">
                        <svg
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none z-10"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={e => setSelectedDate(e.target.value)}
                          className="w-full pl-8 pr-2 py-3 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#d32f2f] bg-white cursor-pointer font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Time
                      </label>
                      <div className="relative">
                        <svg
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <select
                          value={selectedTime}
                          onChange={e => setSelectedTime(e.target.value)}
                          className="w-full pl-8 pr-6 py-3 border border-gray-200 rounded-xl text-xs text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#d32f2f] bg-white cursor-pointer font-medium"
                        >
                          {['5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM'].map(t => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                        <svg
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Available time slots */}
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Select a time
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot === selectedSlot ? null : slot)}
                        className={`py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${
                          selectedSlot === slot
                            ? 'bg-gray-900 text-white shadow-lg ring-2 ring-gray-900 ring-offset-1'
                            : 'bg-[#d32f2f] text-white hover:bg-[#b71c1c] shadow-sm hover:shadow-md'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>

                  {/* View full availability */}
                  <button className="w-full py-3 text-sm font-bold text-[#d32f2f] border-2 border-[#d32f2f] rounded-xl hover:bg-red-50 transition-colors mb-3">
                    View full availability
                  </button>

                  {/* Notify me */}
                  <button className="w-full py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notify me
                  </button>

                  <p className="text-xs text-gray-400 text-center mt-3">
                    You won't be charged until after your visit
                  </p>
                </div>
              </div>

              {/* Location mini-card */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="relative h-32 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 flex items-center justify-center overflow-hidden">
                  {/* Simulated map background pattern */}
                  <div className="absolute inset-0 opacity-20">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="absolute border-gray-400 border" style={{
                        left: `${i * 16}%`, top: 0, bottom: 0, width: '1px'
                      }} />
                    ))}
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="absolute border-gray-400 border" style={{
                        top: `${i * 25}%`, left: 0, right: 0, height: '1px'
                      }} />
                    ))}
                  </div>
                  <div className="text-center relative z-10">
                    <div className="w-9 h-9 bg-[#d32f2f] rounded-full flex items-center justify-center mx-auto mb-1.5 shadow-lg ring-4 ring-white">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      Mariahilferstraße
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">Mariahilferstraße 1-7</p>
                  <p className="text-xs text-gray-500">1060 Vienna, Austria</p>
                  <button className="text-xs text-[#006AFF] mt-1.5 hover:underline flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Get directions
                  </button>
                </div>
              </div>

              {/* Additional info card */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Good to know</h4>
                <div className="space-y-2">
                  {[
                    { icon: '🕐', text: 'Open until 11:00 PM today' },
                    { icon: '📞', text: '+43 1 234 5678' },
                    { icon: '🅿️', text: 'Parking nearby' },
                    { icon: '♿', text: 'Wheelchair accessible' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
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

      {/* ── Photo Lightbox Modal ──────────────────────────────────────── */}
      {showAllPhotos && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={() => setShowAllPhotos(false)}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-white font-semibold text-lg">
              Peter Pane – Wien Mariahilferstraße · All photos
            </h3>
            <button
              onClick={() => setShowAllPhotos(false)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div
            className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-1 p-4 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {HERO_IMAGES.map((src, i) => (
              <div key={i} className={`overflow-hidden rounded-lg ${i === 0 ? 'col-span-2 md:col-span-1' : ''}`}>
                <img src={src} alt={`Photo ${i + 1}`} className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetailPage;
