import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NavbarComponent from '../components/section/NavbarComponent';
import { useAuth } from '../context/AuthContext';
import { apiFetch, ApiError } from '../utils/api';
import { Reservation } from '../interfaces/reservation';
import {
  formatDate,
  fromApiTime,
  todayISO,
  RESERVATION_STATUS_PENDING,
  RESERVATION_STATUS_CONFIRMED,
  RESERVATION_STATUS_CANCELLED,
  RESERVATION_STATUS_COMPLETED,
  RESERVATION_STATUS_NO_SHOW,
} from '../constants/reservation';

type SidebarSection = 'reservations' | 'reviews' | 'saved' | 'transactions' | 'settings';
type ReservationTab = 'upcoming' | 'past' | 'cancelled';

const SIDEBAR_ITEMS: { key: SidebarSection; label: string; icon: React.ReactNode }[] = [
  {
    key: 'reservations',
    label: 'Reservations',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'reviews',
    label: 'Review Center',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    key: 'saved',
    label: 'Saved Venues',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    key: 'transactions',
    label: 'Transaction History',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Account Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  [RESERVATION_STATUS_PENDING]:   { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Pending' },
  [RESERVATION_STATUS_CONFIRMED]: { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Confirmed' },
  [RESERVATION_STATUS_CANCELLED]: { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Cancelled' },
  [RESERVATION_STATUS_COMPLETED]: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Completed' },
  [RESERVATION_STATUS_NO_SHOW]:   { bg: 'bg-red-100',    text: 'text-red-600',    label: 'No Show' },
};

const RESERVATION_TABS: { key: ReservationTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<SidebarSection>('reservations');

  return (
    <div className="min-h-screen bg-ot-athens-gray">
      <NavbarComponent />

      <div className="max-w-ot mx-auto px-4 lg:px-6 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-ot-card border border-ot-iron sticky top-8">
              <div className="p-6 border-b border-ot-iron">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-ot-charade flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-ot-charade truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-ot-pale-sky truncate">{user?.user_email}</p>
                    <p className="text-xs text-ot-manatee mt-0.5">
                      Member since {user?.registered_at ? new Date(user.registered_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="p-2">
                {SIDEBAR_ITEMS.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-ot-btn text-sm font-medium transition-colors ${
                      activeSection === item.key
                        ? 'bg-ot-athens-gray text-ot-charade'
                        : 'text-ot-pale-sky hover:bg-ot-athens-gray hover:text-ot-charade'
                    }`}
                  >
                    <span className={activeSection === item.key ? 'text-ot-charade' : 'text-ot-manatee'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="lg:hidden w-full mb-0">
            <div className="bg-white rounded-ot-card border border-ot-iron p-4 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-ot-charade flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ot-charade truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-ot-pale-sky truncate">{user?.user_email}</p>
                </div>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {SIDEBAR_ITEMS.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-ot-btn text-xs font-medium whitespace-nowrap transition-colors ${
                      activeSection === item.key
                        ? 'bg-ot-charade text-white'
                        : 'bg-ot-athens-gray text-ot-pale-sky'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <main className="flex-1 min-w-0">
            {activeSection === 'reservations' && <ReservationsSection />}
            {activeSection === 'reviews' && <ReviewsSection />}
            {activeSection === 'saved' && <SavedVenuesSection />}
            {activeSection === 'transactions' && <TransactionsSection />}
            {activeSection === 'settings' && <SettingsSection />}
          </main>
        </div>
      </div>
    </div>
  );
};


const ReservationsSection: React.FC = () => {
  const [tab, setTab] = useState<ReservationTab>('upcoming');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchReservations = () => {
    setIsLoading(true);
    setError(null);
    apiFetch<Reservation[]>('/reservations/my')
      .then(setReservations)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load reservations');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(fetchReservations, []);

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await apiFetch(`/reservations/${id}`, { method: 'DELETE' });
      setReservations(prev =>
        prev.map(r => r.id === id ? { ...r, status: RESERVATION_STATUS_CANCELLED } : r)
      );
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  const today = todayISO();
  const upcoming = reservations.filter(r =>
    r.reservation_date >= today &&
    (r.status === RESERVATION_STATUS_PENDING || r.status === RESERVATION_STATUS_CONFIRMED)
  );
  const past = reservations.filter(r =>
    (r.reservation_date < today && r.status !== RESERVATION_STATUS_CANCELLED) ||
    r.status === RESERVATION_STATUS_COMPLETED ||
    r.status === RESERVATION_STATUS_NO_SHOW
  );
  const cancelled = reservations.filter(r => r.status === RESERVATION_STATUS_CANCELLED);

  const tabData: Record<ReservationTab, Reservation[]> = { upcoming, past, cancelled };
  const displayed = tabData[tab];

  const canCancel = (status: string) =>
    status === RESERVATION_STATUS_PENDING || status === RESERVATION_STATUS_CONFIRMED;

  return (
    <div>
      <h2 className="text-xl font-bold text-ot-charade mb-6">My Reservations</h2>

      <div className="flex gap-1 bg-white rounded-ot-btn p-1 mb-6 border border-ot-iron">
        {RESERVATION_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-ot-btn transition-all ${
              tab === t.key
                ? 'bg-ot-charade text-white'
                : 'text-ot-pale-sky hover:text-ot-charade'
            }`}
          >
            {t.label} ({tabData[t.key].length})
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-ot-btn p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-ot-charade" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-ot-card border border-ot-iron text-center py-16 px-6">
          <svg className="w-14 h-14 text-ot-iron mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-base font-bold text-ot-charade mb-1">
            {tab === 'upcoming' && 'No upcoming reservations'}
            {tab === 'past' && 'No past reservations'}
            {tab === 'cancelled' && 'No cancelled reservations'}
          </h3>
          <p className="text-sm text-ot-pale-sky mb-6">
            {tab === 'upcoming' && 'Find a restaurant and book a table to get started.'}
            {tab === 'past' && 'Your completed reservations will appear here.'}
            {tab === 'cancelled' && 'Cancelled reservations will appear here.'}
          </p>
          {tab === 'upcoming' && (
            <Link
              to="/search"
              className="inline-flex items-center gap-2 bg-ot-charade hover:bg-ot-primary-dark text-white font-bold px-6 py-3 rounded-ot-btn transition-colors text-sm"
            >
              Find restaurants
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(reservation => {
            const badge = STATUS_BADGE[reservation.status] ?? STATUS_BADGE[RESERVATION_STATUS_PENDING];
            const isCancelling = cancellingId === reservation.id;

            return (
              <div
                key={reservation.id}
                className="bg-white rounded-ot-card border border-ot-iron overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <Link
                        to={`/restaurant/${reservation.restaurant.slug}`}
                        className="text-base font-bold text-ot-charade hover:text-ot-teal transition-colors"
                      >
                        {reservation.restaurant.name}
                      </Link>
                      <p className="text-xs text-ot-pale-sky mt-0.5">
                        {reservation.restaurant.address}, {reservation.restaurant.city}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-ot-pale-sky mb-4">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-ot-manatee" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{formatDate(reservation.reservation_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-ot-manatee" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{fromApiTime(reservation.reservation_time)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-ot-manatee" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">
                        {reservation.party_size} {reservation.party_size === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                  </div>

                  {reservation.special_requests && (
                    <p className="text-xs text-ot-pale-sky italic mb-3">
                      &ldquo;{reservation.special_requests}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-ot-manatee">
                    <span>Confirmation #{reservation.id}</span>
                  </div>
                </div>

                <div className="border-t border-ot-iron px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/restaurant/${reservation.restaurant.slug}`}
                      className="text-xs font-bold text-ot-pale-sky hover:text-ot-charade px-3 py-1.5 rounded-ot-btn border border-ot-iron transition-colors"
                    >
                      View Restaurant
                    </Link>
                    {canCancel(reservation.status) && (
                      <Link
                        to={`/restaurant/${reservation.restaurant.slug}/book`}
                        className="text-xs font-bold text-ot-pale-sky hover:text-ot-charade px-3 py-1.5 rounded-ot-btn border border-ot-iron transition-colors"
                      >
                        Edit Booking
                      </Link>
                    )}
                  </div>
                  {canCancel(reservation.status) && (
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      disabled={isCancelling}
                      className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-ot-btn transition-colors disabled:opacity-50"
                    >
                      {isCancelling ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


const ReviewsSection: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold text-ot-charade mb-6">Review Center</h2>

      <div className="bg-white rounded-ot-card border border-ot-iron p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-ot-charade">0</p>
            <p className="text-xs text-ot-pale-sky mt-1">Reviews</p>
          </div>
          <div className="h-12 w-px bg-ot-iron" />
          <div className="text-center">
            <p className="text-4xl font-bold text-ot-charade">&mdash;</p>
            <p className="text-xs text-ot-pale-sky mt-1">Avg. Rating</p>
          </div>
          <div className="h-12 w-px bg-ot-iron" />
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="flex items-center gap-2 mb-1">
                <span className="text-xs text-ot-pale-sky w-3">{star}</span>
                <div className="flex-1 h-2 bg-ot-athens-gray rounded-full overflow-hidden">
                  <div className="h-full bg-ot-charade rounded-full" style={{ width: '0%' }} />
                </div>
                <span className="text-xs text-ot-manatee w-4">0</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-ot-card border border-ot-iron text-center py-16 px-6">
        <svg className="w-14 h-14 text-ot-iron mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <h3 className="text-base font-bold text-ot-charade mb-1">No reviews yet</h3>
        <p className="text-sm text-ot-pale-sky mb-6">
          After dining at a restaurant, you can share your experience here.
        </p>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 bg-ot-charade hover:bg-ot-primary-dark text-white font-bold px-6 py-3 rounded-ot-btn transition-colors text-sm"
        >
          Find restaurants to review
        </Link>
      </div>
    </div>
  );
};


const SavedVenuesSection: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold text-ot-charade mb-6">Saved Venues</h2>

      <div className="bg-white rounded-ot-card border border-ot-iron text-center py-16 px-6">
        <svg className="w-14 h-14 text-ot-iron mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h3 className="text-base font-bold text-ot-charade mb-1">No saved venues</h3>
        <p className="text-sm text-ot-pale-sky mb-6">
          Save your favorite restaurants so you can easily find them later.
        </p>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 bg-ot-charade hover:bg-ot-primary-dark text-white font-bold px-6 py-3 rounded-ot-btn transition-colors text-sm"
        >
          Explore restaurants
        </Link>
      </div>
    </div>
  );
};


const TransactionsSection: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold text-ot-charade mb-6">Transaction History</h2>

      <div className="bg-white rounded-ot-card border border-ot-iron text-center py-16 px-6">
        <svg className="w-14 h-14 text-ot-iron mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <h3 className="text-base font-bold text-ot-charade mb-1">No transactions</h3>
        <p className="text-sm text-ot-pale-sky">
          Your booking receipts and invoices will appear here once payments are enabled.
        </p>
      </div>
    </div>
  );
};


const SettingsSection: React.FC = () => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const profileChanged = firstName !== (user?.first_name ?? '') || lastName !== (user?.last_name ?? '');

  const handleProfileSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setProfileMsg({ type: 'error', text: 'First and last name are required.' });
      return;
    }
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await apiFetch('/authentication/me', {
        method: 'PUT',
        body: JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim() }),
      });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: unknown) {
      setProfileMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setPasswordSaving(true);
    try {
      await apiFetch('/authentication/change-password', {
        method: 'PUT',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: unknown) {
      setPasswordMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to change password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-ot-charade mb-6">Account Settings</h2>

      <div className="bg-white rounded-ot-card border border-ot-iron overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-ot-iron">
          <h3 className="text-sm font-bold text-ot-charade">Personal Details</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ot-pale-sky mb-1.5">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}

                className="w-full px-3 py-2.5 text-sm border border-ot-iron rounded-ot-btn bg-white text-ot-charade focus:outline-none focus:border-ot-charade transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ot-pale-sky mb-1.5">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}

                className="w-full px-3 py-2.5 text-sm border border-ot-iron rounded-ot-btn bg-white text-ot-charade focus:outline-none focus:border-ot-charade transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ot-pale-sky mb-1.5">Email Address</label>
            <input
              type="email"
              defaultValue={user?.user_email}
              disabled
              className="w-full px-3 py-2.5 text-sm border border-ot-iron rounded-ot-btn bg-ot-athens-gray text-ot-charade disabled:opacity-60"
            />
          </div>

          {profileMsg && (
            <p className={`text-xs font-medium ${profileMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {profileMsg.text}
            </p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleProfileSave}
              disabled={!profileChanged || profileSaving}
              className="text-sm font-bold text-white bg-ot-charade hover:bg-ot-primary-dark px-5 py-2.5 rounded-ot-btn transition-colors disabled:opacity-40"
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-ot-card border border-ot-iron overflow-hidden">
        <div className="px-6 py-4 border-b border-ot-iron">
          <h3 className="text-sm font-bold text-ot-charade">Security</h3>
        </div>
        <div className="p-6">
          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ot-charade">Password</p>
                <p className="text-xs text-ot-pale-sky mt-0.5">Change your account password</p>
              </div>
              <button
                onClick={() => { setShowPasswordForm(true); setPasswordMsg(null); }}
                className="text-xs font-bold text-ot-charade border border-ot-iron px-4 py-2 rounded-ot-btn hover:bg-ot-athens-gray transition-colors"
              >
                Change Password
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ot-pale-sky mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-ot-iron rounded-ot-btn bg-white text-ot-charade focus:outline-none focus:border-ot-charade transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ot-pale-sky mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-ot-iron rounded-ot-btn bg-white text-ot-charade focus:outline-none focus:border-ot-charade transition-colors"
                />
                <p className="text-xs text-ot-manatee mt-1">Min. 8 characters, 1 uppercase, 1 lowercase, 1 number</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-ot-pale-sky mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-ot-iron rounded-ot-btn bg-white text-ot-charade focus:outline-none focus:border-ot-charade transition-colors"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              {passwordMsg && (
                <p className={`text-xs font-medium ${passwordMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordMsg.text}
                </p>
              )}

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordMsg(null);
                  }}
                  className="text-sm font-medium text-ot-pale-sky hover:text-ot-charade transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="text-sm font-bold text-white bg-ot-charade hover:bg-ot-primary-dark px-5 py-2.5 rounded-ot-btn transition-colors disabled:opacity-40"
                >
                  {passwordSaving ? 'Changing...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
