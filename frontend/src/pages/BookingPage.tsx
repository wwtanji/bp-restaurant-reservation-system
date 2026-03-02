import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000/api';

const TIME_OPTIONS = [
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '1:00 PM',  '1:30 PM',  '2:00 PM',  '2:30 PM',
  '5:00 PM',  '5:30 PM',  '6:00 PM',  '6:30 PM',
  '7:00 PM',  '7:30 PM',  '8:00 PM',  '8:30 PM',  '9:00 PM',
];

const PARTY_SIZES = Array.from({ length: 10 }, (_, i) =>
  i === 0 ? '1 person' : `${i + 1} people`
);

function toApiTime(display: string): string {
  const [timePart, period] = display.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function toApiPartySize(display: string): number {
  return parseInt(display, 10);
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

interface RestaurantInfo {
  name: string;
  cuisine: string;
  city: string;
  address: string;
  cover_image: string | null;
}

interface BookingOut {
  id: number;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  guest_name: string | null;
  restaurant: { name: string; address: string; city: string };
}

// ── Shared icon components ─────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const ClockIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const PersonIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const ChevronIcon = () => (
  <svg className="w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// ── Main component ─────────────────────────────────────────────────────────

const BookingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Pre-filled from the detail page via query params
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || todayISO());
  const [selectedTime, setSelectedTime] = useState(searchParams.get('time') || '7:00 PM');
  const [partySize, setPartySize]       = useState(searchParams.get('party') || '2 people');

  // Guest info
  const [guestName, setGuestName]           = useState('');
  const [guestPhone, setGuestPhone]         = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Page state
  const [restaurant, setRestaurant]       = useState<RestaurantInfo | null>(null);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [confirmation, setConfirmation]   = useState<BookingOut | null>(null);
  const [availableSeats, setAvailableSeats]     = useState<number | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Pre-fill name from auth
  useEffect(() => {
    if (user) setGuestName(`${user.first_name} ${user.last_name}`);
  }, [user]);

  // Fetch slot availability whenever date or time changes
  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    setAvailabilityLoading(true);
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      reservation_date: selectedDate,
      reservation_time: toApiTime(selectedTime),
    });
    fetch(`${API_URL}/reservations/${slug}/availability?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then((data: { available_seats: number }) => setAvailableSeats(data.available_seats))
      .catch(() => {})
      .finally(() => setAvailabilityLoading(false));
    return () => controller.abort();
  }, [slug, selectedDate, selectedTime]);

  // Clamp party size if the selected slot has fewer seats than currently chosen
  useEffect(() => {
    if (availableSeats === null || availableSeats === 0) return;
    if (toApiPartySize(partySize) > availableSeats) {
      setPartySize(PARTY_SIZES[availableSeats - 1]);
    }
  }, [availableSeats, partySize]);

  // Fetch restaurant display info
  useEffect(() => {
    if (!slug) return;
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/restaurants/${slug}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(setRestaurant)
      .catch(() => navigate(`/restaurant/${slug}`));
  }, [slug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;

    if (selectedDate < todayISO()) {
      setError('Please select a date today or in the future.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/reservations/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          party_size:       toApiPartySize(partySize),
          reservation_date: selectedDate,
          reservation_time: toApiTime(selectedTime),
          guest_name:       guestName   || null,
          guest_phone:      guestPhone  || null,
          special_requests: specialRequests || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? 'Reservation failed. Please try again.');
      }

      setConfirmation(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success view ─────────────────────────────────────────────────────────

  if (confirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" style={{ fontFamily: "'Montserrat', 'Open Sans', sans-serif" }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">You're all set!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your reservation is confirmed. See you there!
          </p>

          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2.5 mb-6">
            {[
              ['Restaurant', confirmation.restaurant.name],
              ['Date',       formatDate(confirmation.reservation_date)],
              ['Time',       selectedTime],
              ['Party',      `${confirmation.party_size} ${confirmation.party_size === 1 ? 'person' : 'people'}`],
              ...(confirmation.guest_name ? [['Name', confirmation.guest_name]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-900">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
              <span className="text-gray-500">Confirmation #</span>
              <span className="font-mono text-xs font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded">
                #{confirmation.id}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              to={`/restaurant/${slug}`}
              className="w-full py-3 text-sm font-bold text-white bg-[#2563eb] rounded-xl hover:bg-[#1d4ed8] transition-colors text-center"
            >
              Back to Restaurant
            </Link>
            <Link
              to="/search"
              className="w-full py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              Explore more restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking form ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Montserrat', 'Open Sans', sans-serif" }}>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(`/restaurant/${slug}`)}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Back to restaurant"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700 truncate">
            {restaurant?.name ?? 'Complete your reservation'}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left: Form ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Restaurant + booking summary strip */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center gap-4">
              {restaurant?.cover_image ? (
                <img
                  src={restaurant.cover_image}
                  alt={restaurant.name}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-200 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{restaurant?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(selectedDate)} · {selectedTime} · {partySize}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Your details */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Your details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Phone number <span className="text-[#2563eb]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      placeholder="+421 900 000 000"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Reservation details */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Reservation details</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">

                  {/* Party size */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Party size
                    </label>
                    {availableSeats === 0 ? (
                      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                        Fully booked
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><PersonIcon /></div>
                        <select
                          value={partySize}
                          onChange={e => setPartySize(e.target.value)}
                          className="w-full pl-9 pr-8 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white"
                        >
                          {(availableSeats !== null && !availabilityLoading
                            ? PARTY_SIZES.slice(0, availableSeats)
                            : PARTY_SIZES
                          ).map(s => <option key={s}>{s}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronIcon /></div>
                      </div>
                    )}
                    {availableSeats !== null && availableSeats > 0 && availableSeats <= 3 && (
                      <p className="mt-1.5 text-xs text-amber-600 font-medium">
                        Only {availableSeats} seat{availableSeats === 1 ? '' : 's'} left
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Date
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"><CalendarIcon /></div>
                      <input
                        type="date"
                        value={selectedDate}
                        min={todayISO()}
                        onChange={e => { setSelectedDate(e.target.value); setError(null); }}
                        className="w-full pl-9 pr-2 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white"
                      />
                    </div>
                  </div>

                  {/* Time */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Time
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><ClockIcon /></div>
                      <select
                        value={selectedTime}
                        onChange={e => setSelectedTime(e.target.value)}
                        className="w-full pl-9 pr-8 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white"
                      >
                        {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronIcon /></div>
                    </div>
                  </div>
                </div>

                {/* Special requests */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Special requests{' '}
                    <span className="font-normal text-gray-400 normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={e => setSpecialRequests(e.target.value)}
                    placeholder="Allergies, anniversary, high chair needed…"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white resize-none"
                  />
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !guestPhone || availableSeats === 0}
                className="w-full py-4 text-sm font-bold text-white bg-[#2563eb] rounded-xl hover:bg-[#1d4ed8] active:scale-95 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Completing reservation…
                  </>
                ) : (
                  'Complete reservation'
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                You won't be charged until after your visit
              </p>
            </form>
          </div>

          {/* ── Right: Booking summary ───────────────────────────────────── */}
          <div className="lg:w-72 xl:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5 lg:sticky lg:top-8">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Booking summary</h3>

              <div className="space-y-3.5">
                {[
                  { icon: <CalendarIcon />, label: 'Date', value: formatDate(selectedDate) },
                  { icon: <ClockIcon />,    label: 'Time', value: selectedTime },
                  { icon: <PersonIcon />,   label: 'Party', value: partySize },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex-shrink-0">{icon}</div>
                    <div>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-semibold text-gray-800">{value}</p>
                    </div>
                  </div>
                ))}

                {restaurant && (
                  <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{restaurant.name}</p>
                      <p className="text-xs text-gray-500">{restaurant.address}, {restaurant.city}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingPage;
