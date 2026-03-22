import React, { ComponentType, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  HomeIcon,
  CalendarDaysIcon,
  StarIcon,
  HeartIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import NavbarComponent from '../components/section/NavbarComponent';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiFetch, ApiError } from '../utils/api';
import { User } from '../interfaces/user';
import { Reservation } from '../interfaces/reservation';
import { Review } from '../interfaces/review';
import { Transaction } from '../interfaces/payment';
import {
  formatDate,
  fromApiTime,
  todayISO,
  RESERVATION_STATUS_PENDING,
  RESERVATION_STATUS_CONFIRMED,
  RESERVATION_STATUS_CANCELLED,
  RESERVATION_STATUS_COMPLETED,
  RESERVATION_STATUS_NO_SHOW,
  PAYMENT_STATUS_PAID,
  PAYMENT_STATUS_PENDING,
  PAYMENT_STATUS_FAILED,
  PAYMENT_STATUS_EXPIRED,
  PRICE_SYMBOLS,
} from '../constants/reservation';
import { STORAGE_KEY_JUST_LOGGED_IN } from '../constants/storage';
import { useFavorites } from '../context/FavoritesContext';
import { resolveImageUrl } from '../utils/api';

type SidebarSection =
  | 'overview'
  | 'reservations'
  | 'reviews'
  | 'saved'
  | 'transactions'
  | 'settings';
const VALID_SECTIONS: SidebarSection[] = [
  'overview',
  'reservations',
  'reviews',
  'saved',
  'transactions',
  'settings',
];
type ReservationTab = 'upcoming' | 'past' | 'cancelled';

const ROLE_LABELS: Record<number, string> = {
  0: 'Customer',
  1: 'Restaurant Owner',
  2: 'Admin',
};

interface ProfileSidebarItem {
  key: SidebarSection;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface ProfileSidebarSection {
  label: string;
  items: ProfileSidebarItem[];
}

const PROFILE_SIDEBAR_SECTIONS: ProfileSidebarSection[] = [
  {
    label: 'Main',
    items: [
      { key: 'overview', label: 'Overview', icon: HomeIcon },
      { key: 'reservations', label: 'Reservations', icon: CalendarDaysIcon },
    ],
  },
  {
    label: 'Activity',
    items: [
      { key: 'reviews', label: 'Review Center', icon: StarIcon },
      { key: 'saved', label: 'Saved Venues', icon: HeartIcon },
      { key: 'transactions', label: 'Transactions', icon: CreditCardIcon },
    ],
  },
  {
    label: 'Account',
    items: [{ key: 'settings', label: 'Settings', icon: Cog6ToothIcon }],
  },
];

const ALL_SIDEBAR_ITEMS = PROFILE_SIDEBAR_SECTIONS.flatMap((s) => s.items);

const STORAGE_KEY_PROFILE_SIDEBAR_COLLAPSED = 'profile_sidebar_collapsed';

const getInitialProfileCollapsed = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY_PROFILE_SIDEBAR_COLLAPSED) === 'true';
  } catch {
    return false;
  }
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  [RESERVATION_STATUS_PENDING]: {
    bg: 'bg-amber-100 dark:bg-yellow-900/20',
    text: 'text-amber-700',
    label: 'Pending',
  },
  [RESERVATION_STATUS_CONFIRMED]: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-700',
    label: 'Confirmed',
  },
  [RESERVATION_STATUS_CANCELLED]: {
    bg: 'bg-gray-100 dark:bg-dark-surface',
    text: 'text-gray-500 dark:text-dark-text-secondary',
    label: 'Cancelled',
  },
  [RESERVATION_STATUS_COMPLETED]: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-700',
    label: 'Completed',
  },
  [RESERVATION_STATUS_NO_SHOW]: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-600',
    label: 'No Show',
  },
};

const RESERVATION_TABS: { key: ReservationTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const ProfilePage: React.FC = () => {
  const { user, logout: authLogout } = useAuth();
  const { show } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section') as SidebarSection | null;
  const initialSection =
    sectionParam && VALID_SECTIONS.includes(sectionParam) ? sectionParam : 'overview';
  const [activeSection, setActiveSection] = useState<SidebarSection>(initialSection);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);

  useEffect(() => {
    const param = searchParams.get('section') as SidebarSection | null;
    if (param && VALID_SECTIONS.includes(param)) {
      setActiveSection(param);
    }
  }, [searchParams]);

  useEffect(() => {
    apiFetch<Reservation[]>('/reservations/my')
      .then(setReservations)
      .catch(() => {})
      .finally(() => setReservationsLoading(false));
  }, []);

  const handleLogout = () => {
    authLogout();
    localStorage.removeItem(STORAGE_KEY_JUST_LOGGED_IN);
    show('You have successfully logged out', 'error');
    navigate('/');
  };

  const today = todayISO();
  const upcomingReservations = reservations.filter(
    (r) =>
      r.reservation_date >= today &&
      (r.status === RESERVATION_STATUS_PENDING || r.status === RESERVATION_STATUS_CONFIRMED),
  );

  return (
    <div className="min-h-screen bg-ot-athens-gray dark:bg-dark-bg">
      <NavbarComponent />

      <div className="max-w-ot mx-auto px-4 lg:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-0">
          <ProfileMobileNav
            user={user ?? undefined}
            activeSection={activeSection}
            onNavigate={setActiveSection}
          />

          <ProfileDesktopSidebar
            user={user ?? undefined}
            activeSection={activeSection}
            onNavigate={setActiveSection}
            onLogout={handleLogout}
            reservationCount={reservationsLoading ? null : reservations.length}
          />

          <main className="flex-1 min-w-0">
            {activeSection === 'overview' && (
              <OverviewSection
                reservations={reservations}
                upcomingReservations={upcomingReservations}
                isLoading={reservationsLoading}
                onNavigate={setActiveSection}
              />
            )}
            {activeSection === 'reservations' && (
              <ReservationsSection
                reservations={reservations}
                isLoading={reservationsLoading}
                onUpdate={setReservations}
              />
            )}
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

interface OverviewSectionProps {
  reservations: Reservation[];
  upcomingReservations: Reservation[];
  isLoading: boolean;
  onNavigate: (section: SidebarSection) => void;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({
  reservations,
  upcomingReservations,
  isLoading,
  onNavigate,
}) => {
  const { user } = useAuth();
  const completedCount = reservations.filter(
    (r) => r.status === RESERVATION_STATUS_COMPLETED,
  ).length;
  const cancelledCount = reservations.filter(
    (r) => r.status === RESERVATION_STATUS_CANCELLED,
  ).length;

  const statCards = [
    {
      label: 'Total Bookings',
      value: reservations.length,
      color: 'bg-indigo-50 dark:bg-blue-900/20 text-ot-primary dark:text-dark-primary',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      label: 'Upcoming',
      value: upcomingReservations.length,
      color: 'bg-amber-50 dark:bg-yellow-900/20 text-amber-600',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Completed',
      value: completedCount,
      color: 'bg-green-50 dark:bg-green-900/20 text-green-600',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Cancelled',
      value: cancelledCount,
      color: 'bg-red-50 dark:bg-red-900/20 text-red-500',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const accountRows = [
    { label: 'Full Name', value: `${user?.first_name} ${user?.last_name}` },
    {
      label: 'Email',
      value: (
        <span className="flex items-center gap-2 justify-end flex-wrap">
          {user?.user_email}
          {user?.email_verified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 text-xs font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Verified
            </span>
          )}
        </span>
      ),
    },
    { label: 'Phone', value: user?.phone_number || 'Not provided' },
    { label: 'Account Type', value: ROLE_LABELS[user?.role ?? 0] ?? 'Customer' },
    {
      label: 'Registered',
      value: user?.registered_at
        ? new Date(user.registered_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : '',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ot-charade dark:text-dark-text">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-ot-pale-sky dark:text-dark-text-secondary mt-1">
          Here's an overview of your account activity.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-4 shadow-sm"
          >
            <div
              className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}
            >
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-ot-charade dark:text-dark-text">
              {isLoading ? '–' : card.value}
            </p>
            <p className="text-xs text-ot-manatee dark:text-dark-text-secondary mt-0.5">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border overflow-hidden shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-ot-iron dark:border-dark-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-ot-charade dark:text-dark-text">
            Account Information
          </h2>
          <button
            onClick={() => onNavigate('settings')}
            className="text-xs font-bold text-ot-primary dark:text-dark-primary hover:text-ot-primary-dark transition-colors"
          >
            Edit
          </button>
        </div>
        <div className="divide-y divide-ot-iron dark:divide-dark-border">
          {accountRows.map((row, i) => (
            <div key={i} className="px-6 py-3.5 flex items-center justify-between gap-4">
              <span className="text-sm text-ot-pale-sky dark:text-dark-text-secondary flex-shrink-0">
                {row.label}
              </span>
              <span className="text-sm font-medium text-ot-charade dark:text-dark-text text-right">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {upcomingReservations.length > 0 && (
        <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-ot-iron dark:border-dark-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-ot-charade dark:text-dark-text">
              Upcoming Reservations
            </h2>
            <button
              onClick={() => onNavigate('reservations')}
              className="text-xs font-bold text-ot-primary dark:text-dark-primary hover:text-ot-primary-dark transition-colors"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-ot-iron dark:divide-dark-border">
            {upcomingReservations.slice(0, 3).map((r) => {
              const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE[RESERVATION_STATUS_PENDING];
              return (
                <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/restaurant/${r.restaurant.slug}`}
                      className="text-sm font-bold text-ot-charade dark:text-dark-text hover:text-ot-primary dark:hover:text-dark-primary transition-colors"
                    >
                      {r.restaurant.name}
                    </Link>
                    <p className="text-xs text-ot-pale-sky dark:text-dark-text-secondary mt-0.5">
                      {formatDate(r.reservation_date)} &middot; {fromApiTime(r.reservation_time)}{' '}
                      &middot; {r.party_size} {r.party_size === 1 ? 'person' : 'people'}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          to="/search"
          className="inline-flex items-center gap-2 bg-ot-primary hover:bg-ot-primary-dark text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Browse Restaurants
        </Link>
        <button
          onClick={() => onNavigate('settings')}
          className="inline-flex items-center gap-2 bg-white dark:bg-dark-paper border border-ot-iron dark:border-dark-border text-ot-charade dark:text-dark-text font-bold px-6 py-3 rounded-lg hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit Profile
        </button>
      </div>
    </div>
  );
};

interface ReservationsSectionProps {
  reservations: Reservation[];
  isLoading: boolean;
  onUpdate: React.Dispatch<React.SetStateAction<Reservation[]>>;
}

const ReservationsSection: React.FC<ReservationsSectionProps> = ({
  reservations,
  isLoading,
  onUpdate,
}) => {
  const [tab, setTab] = useState<ReservationTab>('upcoming');
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await apiFetch(`/reservations/${id}`, { method: 'DELETE' });
      onUpdate((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: RESERVATION_STATUS_CANCELLED } : r)),
      );
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  const today = todayISO();
  const upcoming = reservations.filter(
    (r) =>
      r.reservation_date >= today &&
      (r.status === RESERVATION_STATUS_PENDING || r.status === RESERVATION_STATUS_CONFIRMED),
  );
  const past = reservations.filter(
    (r) =>
      (r.reservation_date < today && r.status !== RESERVATION_STATUS_CANCELLED) ||
      r.status === RESERVATION_STATUS_COMPLETED ||
      r.status === RESERVATION_STATUS_NO_SHOW,
  );
  const cancelled = reservations.filter((r) => r.status === RESERVATION_STATUS_CANCELLED);

  const tabData: Record<ReservationTab, Reservation[]> = { upcoming, past, cancelled };
  const displayed = tabData[tab];

  const canCancel = (status: string) =>
    status === RESERVATION_STATUS_PENDING || status === RESERVATION_STATUS_CONFIRMED;

  return (
    <div>
      <h2 className="text-xl font-bold text-ot-charade dark:text-dark-text mb-6">
        My Reservations
      </h2>

      <div className="flex gap-1 bg-white dark:bg-dark-paper rounded-lg p-1 mb-6 border border-ot-iron dark:border-dark-border">
        {RESERVATION_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              tab === t.key
                ? 'bg-ot-primary text-white shadow-sm'
                : 'text-ot-pale-sky dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text'
            }`}
          >
            {t.label} ({tabData[t.key].length})
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-ot-primary" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border text-center py-16 px-6 shadow-sm">
          <svg
            className="w-14 h-14 text-ot-iron dark:text-dark-border mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-base font-bold text-ot-charade dark:text-dark-text mb-1">
            {tab === 'upcoming' && 'No upcoming reservations'}
            {tab === 'past' && 'No past reservations'}
            {tab === 'cancelled' && 'No cancelled reservations'}
          </h3>
          <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-6">
            {tab === 'upcoming' && 'Find a restaurant and book a table to get started.'}
            {tab === 'past' && 'Your completed reservations will appear here.'}
            {tab === 'cancelled' && 'Cancelled reservations will appear here.'}
          </p>
          {tab === 'upcoming' && (
            <Link
              to="/search"
              className="inline-flex items-center gap-2 bg-ot-primary hover:bg-ot-primary-dark text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Find restaurants
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((reservation) => {
            const badge =
              STATUS_BADGE[reservation.status] ?? STATUS_BADGE[RESERVATION_STATUS_PENDING];
            const isCancelling = cancellingId === reservation.id;

            return (
              <div
                key={reservation.id}
                className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border overflow-hidden hover:shadow-md transition-shadow shadow-sm"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <Link
                        to={`/restaurant/${reservation.restaurant.slug}`}
                        className="text-base font-bold text-ot-charade dark:text-dark-text hover:text-ot-primary dark:hover:text-dark-primary transition-colors"
                      >
                        {reservation.restaurant.name}
                      </Link>
                      <p className="text-xs text-ot-pale-sky dark:text-dark-text-secondary mt-0.5">
                        {reservation.restaurant.address}, {reservation.restaurant.city}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-4">
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4 text-ot-manatee dark:text-dark-text-secondary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">
                        {formatDate(reservation.reservation_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4 text-ot-manatee dark:text-dark-text-secondary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">
                        {fromApiTime(reservation.reservation_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4 text-ot-manatee dark:text-dark-text-secondary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span className="font-medium">
                        {reservation.party_size}{' '}
                        {reservation.party_size === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                  </div>

                  {reservation.special_requests && (
                    <p className="text-xs text-ot-pale-sky dark:text-dark-text-secondary italic mb-3">
                      &ldquo;{reservation.special_requests}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-ot-manatee dark:text-dark-text-secondary">
                    <span>Confirmation #{reservation.id}</span>
                  </div>
                </div>

                <div className="border-t border-ot-iron dark:border-dark-border px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/restaurant/${reservation.restaurant.slug}`}
                      className="text-xs font-bold text-ot-pale-sky dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text px-3 py-1.5 rounded-lg border border-ot-iron dark:border-dark-border transition-colors"
                    >
                      View Restaurant
                    </Link>
                    {canCancel(reservation.status) && (
                      <Link
                        to={`/restaurant/${reservation.restaurant.slug}/book`}
                        state={{ editReservation: reservation }}
                        className="text-xs font-bold text-ot-pale-sky dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text px-3 py-1.5 rounded-lg border border-ot-iron dark:border-dark-border transition-colors"
                      >
                        Edit Booking
                      </Link>
                    )}
                  </div>
                  {canCancel(reservation.status) && (
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      disabled={isCancelling}
                      className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
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

const ReviewStarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i <= rating ? 'text-ot-primary' : 'text-ot-iron dark:text-dark-border'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
      </svg>
    ))}
  </div>
);

const ReviewStarSelector: React.FC<{
  value: number;
  onChange: (rating: number) => void;
}> = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <button key={i} type="button" onClick={() => onChange(i)} className="focus:outline-none">
        <svg
          className={`w-6 h-6 transition-colors ${i <= value ? 'text-ot-primary' : 'text-ot-iron dark:text-dark-border hover:text-ot-manatee dark:hover:text-dark-text-secondary'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      </button>
    ))}
  </div>
);

const ReviewsSection: React.FC = () => {
  const { show: showNotification } = useNotification();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReviews = () => {
    setLoading(true);
    apiFetch<Review[]>('/reviews/my')
      .then(setReviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditText(review.text ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRating(0);
    setEditText('');
  };

  const handleSaveEdit = async (reviewId: number) => {
    setSaving(true);
    try {
      await apiFetch(`/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify({ rating: editRating, text: editText.trim() || null }),
      });
      showNotification('Review updated', 'success');
      cancelEdit();
      fetchReviews();
    } catch (err) {
      if (err instanceof ApiError) showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await apiFetch(`/reviews/${reviewId}`, { method: 'DELETE' });
      showNotification('Review deleted', 'success');
      fetchReviews();
    } catch (err) {
      if (err instanceof ApiError) showNotification(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-ot-charade dark:text-dark-text mb-6">Review Center</h2>

      <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-ot-charade dark:text-dark-text">
              {reviews.length}
            </p>
            <p className="text-xs text-ot-pale-sky dark:text-dark-text-secondary mt-1">Reviews</p>
          </div>
          <div className="h-12 w-px bg-ot-iron dark:bg-dark-border" />
          <div className="text-center">
            <p className="text-4xl font-bold text-ot-charade dark:text-dark-text">
              {avgRating ?? '\u2014'}
            </p>
            <p className="text-xs text-ot-pale-sky dark:text-dark-text-secondary mt-1">
              Avg. Rating
            </p>
          </div>
          <div className="h-12 w-px bg-ot-iron dark:bg-dark-border" />
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-ot-pale-sky dark:text-dark-text-secondary w-3">
                    {star}
                  </span>
                  <div className="flex-1 h-2 bg-ot-athens-gray dark:bg-dark-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ot-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-ot-manatee dark:text-dark-text-secondary w-4">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border text-center py-16 px-6 shadow-sm">
          <svg
            className="w-14 h-14 text-ot-iron dark:text-dark-border mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <h3 className="text-base font-bold text-ot-charade dark:text-dark-text mb-1">
            No reviews yet
          </h3>
          <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-6">
            After dining at a restaurant, you can share your experience here.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 bg-ot-primary hover:bg-ot-primary-dark text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
          >
            Find restaurants to review
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-5 shadow-sm"
            >
              {editingId === review.id ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Link
                      to={`/restaurant/${review.restaurant.slug}`}
                      className="text-sm font-bold text-ot-primary dark:text-dark-primary hover:underline"
                    >
                      {review.restaurant.name}
                    </Link>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-ot-pale-sky dark:text-dark-text-secondary uppercase tracking-wide mb-1.5">
                      Rating
                    </label>
                    <ReviewStarSelector value={editRating} onChange={setEditRating} />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-ot-pale-sky dark:text-dark-text-secondary uppercase tracking-wide mb-1.5">
                      Review
                    </label>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      className="w-full border border-ot-iron dark:border-dark-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ot-primary dark:ring-dark-primary bg-white dark:bg-dark-surface dark:text-dark-text resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSaveEdit(review.id)}
                      disabled={editRating === 0 || saving}
                      className="text-sm font-bold text-white bg-ot-primary hover:bg-ot-primary-dark px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-sm text-ot-pale-sky dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      to={`/restaurant/${review.restaurant.slug}`}
                      className="text-sm font-bold text-ot-primary dark:text-dark-primary hover:underline"
                    >
                      {review.restaurant.name}
                    </Link>
                    <span className="text-xs text-ot-manatee dark:text-dark-text-secondary">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="mb-2">
                    <ReviewStarRating rating={review.rating} />
                  </div>
                  {review.text && (
                    <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary leading-relaxed mb-3">
                      {review.text}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => startEdit(review)}
                      className="text-xs font-bold text-ot-charade dark:text-dark-text hover:text-ot-primary dark:hover:text-dark-primary transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SavedVenuesSection: React.FC = () => {
  const { favorites, toggleFavorite, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-bold text-ot-charade dark:text-dark-text mb-6">Saved Venues</h2>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-primary" />
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-ot-charade dark:text-dark-text mb-6">Saved Venues</h2>
        <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border text-center py-16 px-6 shadow-sm">
          <svg
            className="w-14 h-14 text-ot-iron dark:text-dark-border mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h3 className="text-base font-bold text-ot-charade dark:text-dark-text mb-1">
            No saved venues
          </h3>
          <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-6">
            Save your favorite restaurants so you can easily find them later.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 bg-ot-primary hover:bg-ot-primary-dark text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
          >
            Explore restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-ot-charade dark:text-dark-text mb-6">
        Saved Venues ({favorites.length})
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((fav) => (
          <div
            key={fav.restaurant_id}
            className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border shadow-sm overflow-hidden group"
          >
            <Link to={`/restaurant/${fav.restaurant.slug}`}>
              <div className="relative h-36 overflow-hidden bg-ot-athens-gray dark:bg-dark-bg">
                <img
                  src={resolveImageUrl(fav.restaurant.cover_image)}
                  alt={fav.restaurant.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </Link>

            <div className="p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <Link
                  to={`/restaurant/${fav.restaurant.slug}`}
                  className="font-semibold text-sm text-ot-charade dark:text-dark-text hover:text-ot-primary dark:hover:text-dark-primary line-clamp-1 transition-colors"
                >
                  {fav.restaurant.name}
                </Link>
                <button
                  onClick={() => toggleFavorite(fav.restaurant_id)}
                  className="flex-shrink-0 text-red-500 hover:text-red-600 transition-colors"
                  aria-label="Remove from favorites"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-ot-pale-sky dark:text-dark-text-secondary">
                {fav.restaurant.cuisine}
                <span className="mx-1 text-ot-iron dark:text-dark-border">&middot;</span>
                {PRICE_SYMBOLS[fav.restaurant.price_range]}
                <span className="mx-1 text-ot-iron dark:text-dark-border">&middot;</span>
                {fav.restaurant.city}
              </p>

              {fav.restaurant.rating && (
                <div className="flex items-center gap-1 mt-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-ot-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                  </svg>
                  <span className="text-xs font-semibold text-ot-charade dark:text-dark-text">
                    {fav.restaurant.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-ot-pale-sky dark:text-dark-text-secondary">
                    ({fav.restaurant.review_count})
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PAYMENT_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  [PAYMENT_STATUS_PAID]: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    label: 'Paid',
  },
  [PAYMENT_STATUS_PENDING]: {
    bg: 'bg-amber-100 dark:bg-yellow-900/20',
    text: 'text-amber-700 dark:text-yellow-400',
    label: 'Pending',
  },
  [PAYMENT_STATUS_EXPIRED]: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    label: 'Expired',
  },
  [PAYMENT_STATUS_FAILED]: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    label: 'Failed',
  },
};

const TransactionsSection: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Transaction[]>('/payments/my')
      .then(setTransactions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-ot-charade dark:text-dark-text mb-6">
        Transaction History
      </h2>

      {transactions.length === 0 ? (
        <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border text-center py-16 px-6 shadow-sm">
          <svg
            className="w-14 h-14 text-ot-iron dark:text-dark-border mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <h3 className="text-base font-bold text-ot-charade dark:text-dark-text mb-1">
            No transactions
          </h3>
          <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary">
            Your booking receipts and payment history will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const badge = PAYMENT_BADGE[tx.status] ?? PAYMENT_BADGE[PAYMENT_STATUS_PENDING];
            return (
              <div
                key={tx.id}
                className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-ot-charade dark:text-dark-text">
                    {tx.restaurant_name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ot-pale-sky dark:text-dark-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(tx.reservation_date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {tx.party_size} {tx.party_size === 1 ? 'person' : 'people'}
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-ot-charade dark:text-dark-text">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    {(tx.amount / 100).toFixed(2)} {tx.currency.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-ot-pale-sky dark:text-dark-text-secondary mt-2">
                  {formatDate(tx.created_at)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SettingsSection: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const profileChanged =
    firstName !== (user?.first_name ?? '') ||
    lastName !== (user?.last_name ?? '') ||
    phoneNumber !== (user?.phone_number ?? '');

  const handleProfileSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setProfileMsg({ type: 'error', text: 'First and last name are required.' });
      return;
    }
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const updated = await apiFetch<User>('/authentication/me', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim(),
        }),
      });
      updateUser(updated);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: unknown) {
      setProfileMsg({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Failed to update profile.',
      });
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
      setPasswordMsg({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Failed to change password.',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 text-sm border border-ot-iron dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-ot-primary/20 dark:ring-dark-primary/20 focus:border-ot-primary dark:focus:border-dark-primary transition-colors';

  return (
    <div>
      <h2 className="text-xl font-bold text-ot-charade dark:text-dark-text mb-6">
        Account Settings
      </h2>

      <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border overflow-hidden mb-6 shadow-sm">
        <div className="px-6 py-4 border-b border-ot-iron dark:border-dark-border">
          <h3 className="text-sm font-bold text-ot-charade dark:text-dark-text">
            Personal Details
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ot-pale-sky dark:text-dark-text-secondary mb-1.5">
                First Name
              </label>
              <input
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ot-pale-sky dark:text-dark-text-secondary mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ot-pale-sky mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              defaultValue={user?.user_email}
              disabled
              className="w-full px-3 py-2.5 text-sm border border-ot-iron dark:border-dark-border rounded-lg bg-ot-athens-gray dark:bg-dark-surface text-ot-charade dark:text-dark-text disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ot-pale-sky mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+421 123 456 789"
              className={inputClass}
            />
          </div>

          {profileMsg && (
            <p
              className={`text-xs font-medium ${profileMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
            >
              {profileMsg.text}
            </p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleProfileSave}
              disabled={!profileChanged || profileSaving}
              className="text-sm font-bold text-white bg-ot-primary hover:bg-ot-primary-dark px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40"
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-ot-iron dark:border-dark-border">
          <h3 className="text-sm font-bold text-ot-charade dark:text-dark-text">Security</h3>
        </div>
        <div className="p-6">
          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ot-charade dark:text-dark-text">Password</p>
                <p className="text-xs text-ot-pale-sky dark:text-dark-text-secondary mt-0.5">
                  Change your account password
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPasswordForm(true);
                  setPasswordMsg(null);
                }}
                className="text-xs font-bold text-ot-charade dark:text-dark-text border border-ot-iron dark:border-dark-border px-4 py-2 rounded-lg hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
              >
                Change Password
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ot-pale-sky dark:text-dark-text-secondary mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ot-pale-sky dark:text-dark-text-secondary mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-ot-manatee dark:text-dark-text-secondary mt-1">
                  Min. 8 characters, 1 uppercase, 1 lowercase, 1 number
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-ot-pale-sky dark:text-dark-text-secondary mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              {passwordMsg && (
                <p
                  className={`text-xs font-medium ${passwordMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
                >
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
                  className="text-sm font-medium text-ot-pale-sky dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={
                    passwordSaving ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                  className="text-sm font-bold text-white bg-ot-primary hover:bg-ot-primary-dark px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40"
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

interface ProfileDesktopSidebarProps {
  user?: User;
  activeSection: SidebarSection;
  onNavigate: (section: SidebarSection) => void;
  onLogout: () => void;
  reservationCount: number | null;
}

const ProfileDesktopSidebar: React.FC<ProfileDesktopSidebarProps> = ({
  user,
  activeSection,
  onNavigate,
  onLogout,
  reservationCount,
}) => {
  const [collapsed, setCollapsed] = useState(getInitialProfileCollapsed);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_PROFILE_SIDEBAR_COLLAPSED, String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 border-r border-gray-200 dark:border-dark-border pr-6 mr-6 transition-[width] duration-200 ${
        collapsed ? 'w-[88px]' : 'w-60'
      }`}
    >
      {!collapsed && (
        <div className="mb-6 px-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ot-charade dark:text-dark-text truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-400 dark:text-dark-text-secondary truncate">
                {user?.user_email}
              </p>
            </div>
          </div>
          {reservationCount !== null && (
            <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-dark-text-secondary">
              <span>
                <span className="font-semibold text-ot-charade dark:text-dark-text tabular-nums">
                  {reservationCount}
                </span>{' '}
                reservations
              </span>
            </div>
          )}
        </div>
      )}

      {collapsed && (
        <div className="mb-6 flex justify-center">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.first_name?.[0]}
            {user?.last_name?.[0]}
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-6 flex-1">
        {PROFILE_SIDEBAR_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-text-secondary mb-2 px-3">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(item.key)}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors w-full ${
                      collapsed ? 'justify-center px-3' : 'px-3'
                    } ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-indigo-500" />
                    )}
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200 dark:border-dark-border pt-4 mt-auto space-y-1">
        <button
          onClick={onLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-3 w-full min-h-[44px] rounded-lg text-sm font-medium text-gray-500 dark:text-dark-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
            collapsed ? 'justify-center px-3' : 'px-3'
          }`}
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={toggleCollapsed}
          className={`flex items-center gap-2 w-full min-h-[44px] rounded-lg text-sm text-gray-500 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors ${
            collapsed ? 'justify-center px-3' : 'px-3'
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronLeftIcon className="w-5 h-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

interface ProfileMobileNavProps {
  user?: User;
  activeSection: SidebarSection;
  onNavigate: (section: SidebarSection) => void;
}

const ProfileMobileNav: React.FC<ProfileMobileNavProps> = ({
  user,
  activeSection,
  onNavigate,
}) => (
  <div className="lg:hidden mb-4">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
        {user?.first_name?.[0]}
        {user?.last_name?.[0]}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ot-charade dark:text-dark-text truncate">
          {user?.first_name} {user?.last_name}
        </p>
        <p className="text-xs text-gray-400 dark:text-dark-text-secondary truncate">
          {user?.user_email}
        </p>
      </div>
    </div>
    <nav className="flex gap-1 overflow-x-auto pb-4 border-b border-gray-200 dark:border-dark-border">
      {ALL_SIDEBAR_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = activeSection === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`relative flex items-center gap-2 whitespace-nowrap px-4 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover'
            }`}
          >
            {active && (
              <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-t-full bg-indigo-500" />
            )}
            <Icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  </div>
);

export default ProfilePage;
