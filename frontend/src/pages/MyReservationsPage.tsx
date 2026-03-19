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
  STATUS_BADGE,
  PAYMENT_STATUS_PAID,
} from '../constants/reservation';
import usePayment from '../hooks/usePayment';

type Tab = 'upcoming' | 'past';

const MyReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const { initiatePayment, isLoading: isPaymentLoading, error: paymentError } = usePayment();

  const {
    data: fetchedReservations,
    isLoading,
    error: fetchError,
    refetch,
  } = useFetch<Reservation[]>('/reservations/my');
  const reservations = fetchedReservations ?? [];
  const error = fetchError || cancelError || paymentError;

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
  const upcoming = reservations.filter(
    (r) =>
      r.reservation_date >= today &&
      (r.status === RESERVATION_STATUS_PENDING || r.status === RESERVATION_STATUS_CONFIRMED),
  );
  const past = reservations.filter(
    (r) =>
      r.reservation_date < today ||
      r.status === RESERVATION_STATUS_CANCELLED ||
      r.status === RESERVATION_STATUS_COMPLETED ||
      r.status === RESERVATION_STATUS_NO_SHOW,
  );
  const displayed = tab === 'upcoming' ? upcoming : past;

  const canCancel = (status: string) =>
    status === RESERVATION_STATUS_PENDING || status === RESERVATION_STATUS_CONFIRMED;

  return (
    <div className="min-h-screen bg-ot-athens-gray dark:bg-dark-bg">
      <div className="bg-white dark:bg-dark-paper border-b border-ot-iron dark:border-dark-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-ot-manatee dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-extrabold text-ot-charade dark:text-dark-text">
            My Reservations
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex gap-1 bg-white dark:bg-dark-paper rounded-ot-btn p-1 mb-6 border border-ot-iron dark:border-dark-border">
          {(['upcoming', 'past'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-ot-btn transition-all ${
                tab === t
                  ? 'bg-ot-primary text-white'
                  : 'text-ot-pale-sky dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text'
              }`}
            >
              {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-ot-btn p-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-ot-primary" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 text-ot-iron mx-auto mb-4"
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
              {tab === 'upcoming' ? 'No upcoming reservations' : 'No past reservations'}
            </h3>
            <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-6">
              {tab === 'upcoming'
                ? 'Find a restaurant and book a table to get started.'
                : 'Your completed reservations will appear here.'}
            </p>
            {tab === 'upcoming' && (
              <Link
                to="/search"
                className="inline-flex items-center gap-2 bg-ot-primary hover:bg-ot-primary-dark text-white font-bold px-6 py-3 rounded-ot-btn transition-colors text-sm"
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
                  className="bg-white dark:bg-dark-paper rounded-ot-card border border-ot-iron dark:border-dark-border overflow-hidden hover:shadow-md transition-shadow"
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

                    <div className="flex items-center gap-4 text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-4">
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
                      {reservation.table && (
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
                              d="M4 6h16M4 12h16M4 18h7"
                            />
                          </svg>
                          <span className="font-medium">
                            Table {reservation.table.table_number}
                          </span>
                        </div>
                      )}
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

                  {canCancel(reservation.status) && (
                    <div className="border-t border-ot-iron dark:border-dark-border px-5 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/restaurant/${reservation.restaurant.slug}/book`}
                          state={{ editReservation: reservation }}
                          className="text-sm font-bold text-ot-primary dark:text-dark-primary hover:text-ot-primary-dark hover:bg-indigo-50 dark:hover:bg-dark-surface px-4 py-2 rounded-ot-btn transition-colors"
                        >
                          Edit
                        </Link>
                        {reservation.status === RESERVATION_STATUS_PENDING &&
                          reservation.payment?.status !== PAYMENT_STATUS_PAID && (
                            <button
                              onClick={() => initiatePayment(reservation.id)}
                              disabled={isPaymentLoading}
                              className="text-sm font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-ot-btn transition-colors disabled:opacity-50"
                            >
                              {isPaymentLoading ? 'Processing...' : 'Pay Now'}
                            </button>
                          )}
                      </div>
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        disabled={isCancelling}
                        className="text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-ot-btn transition-colors disabled:opacity-50"
                      >
                        {isCancelling ? 'Cancelling...' : 'Cancel'}
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
