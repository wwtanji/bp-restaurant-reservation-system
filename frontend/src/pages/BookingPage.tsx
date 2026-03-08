import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Restaurant } from '../interfaces/restaurant';
import { Reservation, SlotAvailability } from '../interfaces/reservation';
import {
  TIME_OPTIONS,
  PARTY_SIZES,
  toApiTime,
  toApiPartySize,
  todayISO,
  formatDate,
  fromApiTime,
  RESERVATION_STATUS_PENDING,
} from '../constants/reservation';

const CalendarIcon = () => (
  <svg className="w-4 h-4 text-ot-manatee" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const ClockIcon = () => (
  <svg className="w-4 h-4 text-ot-manatee" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const PersonIcon = () => (
  <svg className="w-4 h-4 text-ot-manatee" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const ChevronIcon = () => (
  <svg className="w-4 h-4 text-ot-manatee pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const BookingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const editReservation = (location.state as { editReservation?: Reservation } | null)?.editReservation ?? null;
  const isEditMode = editReservation !== null;

  const [selectedDate, setSelectedDate] = useState(
    editReservation ? editReservation.reservation_date : (searchParams.get('date') || todayISO())
  );
  const [selectedTime, setSelectedTime] = useState(
    editReservation ? fromApiTime(editReservation.reservation_time) : (searchParams.get('time') || '7:00 PM')
  );
  const [partySize, setPartySize] = useState(
    editReservation
      ? (editReservation.party_size === 1 ? '1 person' : `${editReservation.party_size} people`)
      : (searchParams.get('party') || '2 people')
  );

  const [guestName, setGuestName]           = useState(editReservation?.guest_name || '');
  const [guestPhone, setGuestPhone]         = useState(editReservation?.guest_phone || '');
  const [specialRequests, setSpecialRequests] = useState(editReservation?.special_requests || '');

  const [restaurant, setRestaurant]       = useState<Restaurant | null>(null);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [confirmation, setConfirmation]   = useState<Reservation | null>(null);
  const [availableSeats, setAvailableSeats]     = useState<number | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  useEffect(() => {
    if (user && !isEditMode) setGuestName(`${user.first_name} ${user.last_name}`);
  }, [user, isEditMode]);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    setAvailabilityLoading(true);
    const params = new URLSearchParams({
      reservation_date: selectedDate,
      reservation_time: toApiTime(selectedTime),
    });
    apiFetch<SlotAvailability>(`/reservations/${slug}/availability?${params}`)
      .then(data => setAvailableSeats(data.available_seats))
      .catch(() => {})
      .finally(() => setAvailabilityLoading(false));
    return () => controller.abort();
  }, [slug, selectedDate, selectedTime]);

  useEffect(() => {
    if (availableSeats === null || availableSeats === 0) return;
    if (toApiPartySize(partySize) > availableSeats) {
      setPartySize(PARTY_SIZES[availableSeats - 1]);
    }
  }, [availableSeats, partySize]);

  useEffect(() => {
    if (!slug) return;
    apiFetch<Restaurant>(`/restaurants/${slug}`)
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
      const url = isEditMode
        ? `/reservations/${editReservation.id}`
        : `/reservations/${slug}`;
      const method = isEditMode ? 'PUT' : 'POST';

      const data = await apiFetch<Reservation>(url, {
        method,
        body: JSON.stringify({
          party_size:       toApiPartySize(partySize),
          reservation_date: selectedDate,
          reservation_time: toApiTime(selectedTime),
          guest_name:       guestName   || null,
          guest_phone:      guestPhone  || null,
          special_requests: specialRequests || null,
        }),
      });
      setConfirmation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmation) {
    const isPending = confirmation.status === RESERVATION_STATUS_PENDING;
    const iconColor = isEditMode ? 'bg-indigo-100' : isPending ? 'bg-amber-100' : 'bg-green-100';

    return (
      <div className="min-h-screen bg-ot-athens-gray flex items-center justify-center p-4">
        <div className="bg-white rounded-ot-card shadow-lg border border-ot-iron p-8 max-w-md w-full text-center opacity-0 animate-fade-in-up">

          <div className={`w-16 h-16 ${iconColor} rounded-full flex items-center justify-center mx-auto mb-5 opacity-0 animate-scale-in`}>
            {isEditMode ? (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ strokeDasharray: 30, strokeDashoffset: 30 }} className="w-8 h-8 text-indigo-600 animate-check-draw">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : isPending ? (
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ strokeDasharray: 30, strokeDashoffset: 30 }} className="w-8 h-8 text-green-600 animate-check-draw">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          <h2 className="text-xl font-extrabold text-ot-charade mb-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            {isEditMode ? 'Reservation updated!' : isPending ? 'Reservation submitted!' : 'You\'re all set!'}
          </h2>
          <p className="text-sm text-ot-pale-sky mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            {isEditMode
              ? 'Your reservation has been updated successfully.'
              : isPending
                ? 'Your reservation is pending confirmation from the restaurant.'
                : 'Your reservation is confirmed. See you there!'}
          </p>

          <div className="bg-ot-athens-gray rounded-ot-card p-4 text-left space-y-2.5 mb-6 border border-ot-iron opacity-0 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            {[
              ['Restaurant', confirmation.restaurant.name],
              ['Date',       formatDate(confirmation.reservation_date)],
              ['Time',       fromApiTime(confirmation.reservation_time)],
              ['Party',      `${confirmation.party_size} ${confirmation.party_size === 1 ? 'person' : 'people'}`],
              ...(confirmation.guest_name ? [['Name', confirmation.guest_name]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-ot-pale-sky">{label}</span>
                <span className="font-bold text-ot-charade">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-1 border-t border-ot-iron">
              <span className="text-ot-pale-sky">Confirmation #</span>
              <span className="font-mono text-xs font-bold text-ot-charade bg-ot-iron px-2 py-0.5 rounded-ot-btn">
                #{confirmation.id}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ot-pale-sky">Status</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isPending ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
              }`}>
                {isPending ? 'Pending' : 'Confirmed'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <Link
              to="/my-reservations"
              className="w-full py-3 text-sm font-bold text-white bg-ot-primary rounded-ot-btn hover:bg-ot-primary-dark transition-colors text-center"
            >
              View my reservations
            </Link>
            <Link
              to={`/restaurant/${slug}`}
              className="w-full py-3 text-sm font-medium text-ot-charade border border-ot-iron rounded-ot-btn hover:bg-ot-athens-gray transition-colors text-center"
            >
              Back to Restaurant
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ot-athens-gray">

      <div className="bg-white border-b border-ot-iron px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(`/restaurant/${slug}`)}
            className="text-ot-manatee hover:text-ot-charade transition-colors"
            aria-label="Back to restaurant"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-bold text-ot-charade truncate">
            {isEditMode ? 'Edit reservation' : (restaurant?.name ?? 'Complete your reservation')}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          <div className="flex-1 min-w-0">

            <div className="bg-white rounded-ot-card border border-ot-iron p-4 mb-6 flex items-center gap-4">
              {restaurant?.cover_image ? (
                <img
                  src={restaurant.cover_image}
                  alt={restaurant.name}
                  className="w-14 h-14 rounded-ot-card object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-ot-card bg-ot-iron flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-bold text-ot-charade text-sm truncate">{restaurant?.name}</p>
                <p className="text-xs text-ot-pale-sky mt-0.5">
                  {formatDate(selectedDate)} &middot; {selectedTime} &middot; {partySize}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="bg-white rounded-ot-card border border-ot-iron p-5">
                <h2 className="text-sm font-extrabold text-ot-charade mb-4">Your details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ot-pale-sky uppercase tracking-wide mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-4 py-3 border border-ot-iron rounded-ot-btn text-sm text-ot-charade focus:outline-none focus:ring-2 focus:ring-ot-primary bg-white placeholder-ot-manatee"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ot-pale-sky uppercase tracking-wide mb-1.5">
                      Phone number <span className="text-ot-primary">*</span>
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      placeholder="+421 900 000 000"
                      required
                      pattern="^\+?[\d\s\-()]{6,20}$"
                      className="w-full px-4 py-3 border border-ot-iron rounded-ot-btn text-sm text-ot-charade focus:outline-none focus:ring-2 focus:ring-ot-primary bg-white placeholder-ot-manatee"
                    />
                    <p className="mt-1 text-xs text-ot-manatee">
                      We'll only use this to contact you about your reservation
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-ot-card border border-ot-iron p-5">
                <h2 className="text-sm font-extrabold text-ot-charade mb-4">Reservation details</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">

                  <div>
                    <label className="block text-xs font-bold text-ot-pale-sky uppercase tracking-wide mb-1.5">
                      Party size
                    </label>
                    {availableSeats === 0 ? (
                      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-ot-btn text-sm text-red-600 font-medium">
                        Fully booked
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><PersonIcon /></div>
                        <select
                          value={partySize}
                          onChange={e => setPartySize(e.target.value)}
                          className="w-full pl-9 pr-8 py-3 border border-ot-iron rounded-ot-btn text-sm text-ot-charade appearance-none focus:outline-none focus:ring-2 focus:ring-ot-primary bg-white"
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

                  <div>
                    <label className="block text-xs font-bold text-ot-pale-sky uppercase tracking-wide mb-1.5">
                      Date
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"><CalendarIcon /></div>
                      <input
                        type="date"
                        value={selectedDate}
                        min={todayISO()}
                        onChange={e => { setSelectedDate(e.target.value); setError(null); }}
                        className="w-full pl-9 pr-2 py-3 border border-ot-iron rounded-ot-btn text-sm text-ot-charade focus:outline-none focus:ring-2 focus:ring-ot-primary bg-white"
                      />
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-ot-pale-sky uppercase tracking-wide mb-1.5">
                      Time
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><ClockIcon /></div>
                      <select
                        value={selectedTime}
                        onChange={e => setSelectedTime(e.target.value)}
                        className="w-full pl-9 pr-8 py-3 border border-ot-iron rounded-ot-btn text-sm text-ot-charade appearance-none focus:outline-none focus:ring-2 focus:ring-ot-primary bg-white"
                      >
                        {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronIcon /></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ot-pale-sky uppercase tracking-wide mb-1.5">
                    Special requests{' '}
                    <span className="font-normal text-ot-manatee normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={e => setSpecialRequests(e.target.value)}
                    placeholder="Allergies, anniversary, high chair needed..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-ot-iron rounded-ot-btn text-sm text-ot-charade focus:outline-none focus:ring-2 focus:ring-ot-primary bg-white resize-none placeholder-ot-manatee"
                  />
                  <p className="mt-1 text-xs text-ot-manatee text-right">
                    {specialRequests.length}/500
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-ot-btn p-3 text-sm text-red-700 flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !guestPhone || availableSeats === 0}
                className="w-full py-4 text-sm font-bold text-white bg-ot-primary rounded-ot-btn hover:bg-ot-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {isEditMode ? 'Updating reservation...' : 'Completing reservation...'}
                  </>
                ) : (
                  isEditMode ? 'Update reservation' : 'Complete reservation'
                )}
              </button>

              <p className="text-xs text-ot-manatee text-center">
                You won't be charged until after your visit
              </p>
            </form>
          </div>

          <div className="lg:w-72 xl:w-80 flex-shrink-0">
            <div className="bg-white rounded-ot-card border border-ot-iron p-5 lg:sticky lg:top-8">
              <h3 className="text-sm font-extrabold text-ot-charade mb-4">Booking summary</h3>

              <div className="space-y-3.5">
                {[
                  { icon: <CalendarIcon />, label: 'Date', value: formatDate(selectedDate) },
                  { icon: <ClockIcon />,    label: 'Time', value: selectedTime },
                  { icon: <PersonIcon />,   label: 'Party', value: partySize },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex-shrink-0">{icon}</div>
                    <div>
                      <p className="text-xs text-ot-manatee">{label}</p>
                      <p className="text-sm font-bold text-ot-charade">{value}</p>
                    </div>
                  </div>
                ))}

                {restaurant && (
                  <div className="flex items-start gap-3 pt-3 border-t border-ot-iron">
                    <svg className="w-4 h-4 text-ot-manatee flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-xs text-ot-manatee">Location</p>
                      <p className="text-sm font-bold text-ot-charade truncate">{restaurant.name}</p>
                      <p className="text-xs text-ot-pale-sky">{restaurant.address}, {restaurant.city}</p>
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
