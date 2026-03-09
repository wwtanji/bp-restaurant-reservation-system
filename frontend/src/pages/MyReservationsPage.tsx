import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch, ApiError } from '../utils/api';
import { Reservation } from '../interfaces/reservation';
import useFetch from '../hooks/useFetch';
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

type Tab = 'upcoming' | 'past';

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  [RESERVATION_STATUS_PENDING]:   { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Pending' },
  [RESERVATION_STATUS_CONFIRMED]: { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Confirmed' },
  [RESERVATION_STATUS_CANCELLED]: { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Cancelled' },
  [RESERVATION_STATUS_COMPLETED]: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Completed' },
  [RESERVATION_STATUS_NO_SHOW]:   { bg: 'bg-red-100',    text: 'text-red-600',    label: 'No Show' },
};

const MyReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data: fetchedReservations, isLoading, error: fetchError, refetch } = useFetch<Reservation[]>('/reservations/my');
  const reservations = fetchedReservations ?? [];
  const error = fetchError || cancelError;

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    setCancelError(null);
    try {
      await apiFetch(`/reservations/${id}`, { method: 'DELETE' });
      refetch();
    } catch (err: unknown) {
      setCancelError(err instanceof ApiError ? err.message : 'Failed to cancel reservation');
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
    r.reservation_date < today ||
    r.status === RESERVATION_STATUS_CANCELLED ||
    r.status === RESERVATION_STATUS_COMPLETED ||
    r.status === RESERVATION_STATUS_NO_SHOW
  );
  const displayed = tab === 'upcoming' ? upcoming : past;

  const canCancel = (status: string) =>
    status === RESERVATION_STATUS_PENDING || status === RESERVATION_STATUS_CONFIRMED;

  return (
    <div className="min-h-screen bg-ot-athens-gray">

      <div className="bg-white border-b border-ot-iron px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-ot-manatee hover:text-ot-charade transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-extrabold text-ot-charade">My Reservations</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">

        <div className="flex gap-1 bg-white rounded-ot-btn p-1 mb-6 border border-ot-iron">
          {(['upcoming', 'past'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-ot-btn transition-all ${
                tab === t
                  ? 'bg-ot-primary text-white'
                  : 'text-ot-pale-sky hover:text-ot-charade'
              }`}
            >
              {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
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
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-ot-primary" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-ot-iron mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-base font-bold text-ot-charade mb-1">
              {tab === 'upcoming' ? 'No upcoming reservations' : 'No past reservations'}
            </h3>
            <p className="text-sm text-ot-pale-sky mb-6">
              {tab === 'upcoming'
                ? 'Find a restaurant and book a table to get started.'
                : 'Your completed reservations will appear here.'}
            </p>
            {tab === 'upcoming' && (
              <Link
                to="/search"
                className="inline-flex items-center gap-2 bg-ot-primary hover:bg-ot-primary-dark text-white font-bold px-6 py-3 rounded-ot-btn transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
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
                          className="text-base font-bold text-ot-charade hover:text-ot-primary transition-colors"
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

                    <div className="flex items-center gap-4 text-sm text-ot-pale-sky mb-4">
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

                  {canCancel(reservation.status) && (
                    <div className="border-t border-ot-iron px-5 py-3 flex justify-between items-center">
                      <Link
                        to={`/restaurant/${reservation.restaurant.slug}/book`}
                        state={{ editReservation: reservation }}
                        className="text-sm font-bold text-ot-primary hover:text-ot-primary-dark hover:bg-indigo-50 px-4 py-2 rounded-ot-btn transition-colors"
                      >
                        Edit reservation
                      </Link>
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        disabled={isCancelling}
                        className="text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-ot-btn transition-colors disabled:opacity-50"
                      >
                        {isCancelling ? 'Cancelling...' : 'Cancel reservation'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservationsPage;
