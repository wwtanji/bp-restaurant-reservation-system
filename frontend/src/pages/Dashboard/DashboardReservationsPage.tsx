import React, { useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { apiFetch, ApiError } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import useFetch from '../../hooks/useFetch';
import { OwnerRestaurant } from '../../interfaces/restaurant';
import { Reservation } from '../../interfaces/reservation';
import {
  formatDate,
  fromApiTime,
  RESERVATION_STATUS_PENDING,
  RESERVATION_STATUS_CONFIRMED,
  RESERVATION_STATUS_CANCELLED,
  RESERVATION_STATUS_COMPLETED,
  RESERVATION_STATUS_NO_SHOW,
  STATUS_BADGE,
} from '../../constants/reservation';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: RESERVATION_STATUS_PENDING, label: 'Pending' },
  { key: RESERVATION_STATUS_CONFIRMED, label: 'Confirmed' },
  { key: RESERVATION_STATUS_COMPLETED, label: 'Completed' },
  { key: RESERVATION_STATUS_CANCELLED, label: 'Cancelled' },
  { key: RESERVATION_STATUS_NO_SHOW, label: 'No Show' },
] as const;

const DashboardReservationsPage: React.FC = () => {
  const { show } = useNotification();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data: restaurants, isLoading: restaurantsLoading } =
    useFetch<OwnerRestaurant[]>('/owners/restaurants');

  const activeSlug = selectedSlug ?? restaurants?.[0]?.slug ?? null;
  const reservationPath = activeSlug ? `/reservations/restaurant/${activeSlug}` : null;

  const {
    data: fetchedReservations,
    isLoading: reservationsLoading,
    error: reservationsError,
    refetch,
  } = useFetch<Reservation[]>(reservationPath);

  const reservations = fetchedReservations ?? [];
  const filtered =
    statusFilter === 'all' ? reservations : reservations.filter((r) => r.status === statusFilter);

  const handleStatusUpdate = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/reservations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      show(`Reservation ${status} successfully`, 'success');
      refetch();
    } catch (err: unknown) {
      show(err instanceof ApiError ? err.message : 'Failed to update reservation', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const isLoading = restaurantsLoading || reservationsLoading;
  const hasNoRestaurants = !restaurantsLoading && (!restaurants || restaurants.length === 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-ot-charade dark:text-dark-text">
            Reservations
          </h1>

          {restaurants && restaurants.length > 1 && (
            <select
              value={activeSlug ?? ''}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="px-3 py-2 rounded-ot-btn border border-ot-iron dark:border-dark-border bg-white dark:bg-dark-paper text-sm text-ot-charade dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-ot-primary"
            >
              {restaurants.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {hasNoRestaurants ? (
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="text-base font-bold text-ot-charade dark:text-dark-text mb-1">
              No restaurants yet
            </h3>
            <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary">
              Add a restaurant first to manage reservations.
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-1 overflow-x-auto bg-white dark:bg-dark-paper rounded-ot-btn p-1 border border-ot-iron dark:border-dark-border">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-ot-btn transition-all ${
                    statusFilter === t.key
                      ? 'bg-ot-primary text-white'
                      : 'text-ot-pale-sky dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {reservationsError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-ot-btn p-3 text-sm text-red-700">
                {reservationsError}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-ot-primary" />
              </div>
            ) : filtered.length === 0 ? (
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
                  No reservations found
                </h3>
                <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary">
                  {statusFilter === 'all'
                    ? 'No reservations have been made yet.'
                    : `No ${statusFilter} reservations.`}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-paper rounded-ot-card border border-ot-iron dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ot-iron dark:border-dark-border bg-ot-athens-gray dark:bg-dark-surface">
                        <th className="text-left px-4 py-3 font-bold text-ot-charade dark:text-dark-text">
                          Guest
                        </th>
                        <th className="text-left px-4 py-3 font-bold text-ot-charade dark:text-dark-text">
                          Phone
                        </th>
                        <th className="text-left px-4 py-3 font-bold text-ot-charade dark:text-dark-text">
                          Date
                        </th>
                        <th className="text-left px-4 py-3 font-bold text-ot-charade dark:text-dark-text">
                          Time
                        </th>
                        <th className="text-left px-4 py-3 font-bold text-ot-charade dark:text-dark-text">
                          Party
                        </th>
                        <th className="text-left px-4 py-3 font-bold text-ot-charade dark:text-dark-text">
                          Status
                        </th>
                        <th className="text-right px-4 py-3 font-bold text-ot-charade dark:text-dark-text">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ot-iron dark:divide-dark-border">
                      {filtered.map((reservation) => {
                        const badge =
                          STATUS_BADGE[reservation.status] ??
                          STATUS_BADGE[RESERVATION_STATUS_PENDING];
                        const isUpdating = updatingId === reservation.id;

                        return (
                          <tr
                            key={reservation.id}
                            className="hover:bg-ot-athens-gray/50 dark:hover:bg-dark-surface/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-ot-charade dark:text-dark-text font-medium">
                              {reservation.guest_name ?? 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-ot-pale-sky dark:text-dark-text-secondary">
                              {reservation.guest_phone ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-ot-pale-sky dark:text-dark-text-secondary whitespace-nowrap">
                              {formatDate(reservation.reservation_date)}
                            </td>
                            <td className="px-4 py-3 text-ot-pale-sky dark:text-dark-text-secondary whitespace-nowrap">
                              {fromApiTime(reservation.reservation_time)}
                            </td>
                            <td className="px-4 py-3 text-ot-pale-sky dark:text-dark-text-secondary">
                              {reservation.party_size}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}
                              >
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {reservation.status === RESERVATION_STATUS_PENDING && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          reservation.id,
                                          RESERVATION_STATUS_CONFIRMED,
                                        )
                                      }
                                      disabled={isUpdating}
                                      className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-ot-btn transition-colors disabled:opacity-50"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          reservation.id,
                                          RESERVATION_STATUS_CANCELLED,
                                        )
                                      }
                                      disabled={isUpdating}
                                      className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-ot-btn transition-colors disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                {reservation.status === RESERVATION_STATUS_CONFIRMED && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          reservation.id,
                                          RESERVATION_STATUS_COMPLETED,
                                        )
                                      }
                                      disabled={isUpdating}
                                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-ot-btn transition-colors disabled:opacity-50"
                                    >
                                      Complete
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          reservation.id,
                                          RESERVATION_STATUS_NO_SHOW,
                                        )
                                      }
                                      disabled={isUpdating}
                                      className="px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-ot-btn transition-colors disabled:opacity-50"
                                    >
                                      No Show
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          reservation.id,
                                          RESERVATION_STATUS_CANCELLED,
                                        )
                                      }
                                      disabled={isUpdating}
                                      className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-ot-btn transition-colors disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardReservationsPage;
