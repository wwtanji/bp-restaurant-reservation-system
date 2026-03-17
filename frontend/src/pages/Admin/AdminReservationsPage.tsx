import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminReservation } from '../../interfaces/admin';
import { apiFetch, ApiError } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import useFetch from '../../hooks/useFetch';
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

const AdminReservationsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { show } = useNotification();

  const fetchPath = useMemo(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    return `/admin/reservations?${params}`;
  }, [statusFilter, dateFrom, dateTo]);

  const { data: reservations, isLoading, error, refetch } = useFetch<AdminReservation[]>(fetchPath);

  const handleStatusUpdate = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/admin/reservations/${id}/status`, {
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-ot-charade dark:text-dark-text">Reservations</h1>

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

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-dark-text-secondary">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2 bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text outline-none focus:ring-2 focus:ring-ot-charade/30 dark:focus:ring-dark-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-dark-text-secondary">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2 bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text outline-none focus:ring-2 focus:ring-ot-charade/30 dark:focus:ring-dark-primary/30"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="text-xs text-red-500 font-medium hover:underline"
            >
              Clear dates
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-charade dark:border-dark-primary" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (reservations ?? []).length === 0 ? (
          <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-12 text-center">
            <p className="text-gray-500 dark:text-dark-text-secondary">No reservations found.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ot-iron dark:border-dark-border bg-ot-athens-gray dark:bg-dark-surface">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-secondary">
                      Guest
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-secondary">
                      Restaurant
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-secondary">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-secondary">
                      Time
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-secondary">
                      Party
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-secondary">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-dark-text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(reservations ?? []).map((r) => {
                    const badge =
                      STATUS_BADGE[r.status] ?? STATUS_BADGE[RESERVATION_STATUS_PENDING];
                    const isUpdating = updatingId === r.id;
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-ot-iron/50 dark:border-dark-border last:border-0 hover:bg-ot-athens-gray/50 dark:hover:bg-dark-surface/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-ot-charade dark:text-dark-text">
                            {r.guest_name ?? r.user_name}
                          </p>
                          {r.guest_phone && (
                            <p className="text-xs text-gray-400 dark:text-dark-text-secondary">
                              {r.guest_phone}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-dark-text-secondary">
                          {r.restaurant_name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-dark-text-secondary whitespace-nowrap">
                          {formatDate(r.reservation_date)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-dark-text-secondary whitespace-nowrap">
                          {fromApiTime(r.reservation_time)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-dark-text-secondary">
                          {r.party_size}
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
                            {r.status === RESERVATION_STATUS_PENDING && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(r.id, RESERVATION_STATUS_CONFIRMED)
                                  }
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-ot-btn transition-colors disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(r.id, RESERVATION_STATUS_CANCELLED)
                                  }
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-ot-btn transition-colors disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {r.status === RESERVATION_STATUS_CONFIRMED && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(r.id, RESERVATION_STATUS_COMPLETED)
                                  }
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-ot-btn transition-colors disabled:opacity-50"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(r.id, RESERVATION_STATUS_NO_SHOW)
                                  }
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-ot-btn transition-colors disabled:opacity-50"
                                >
                                  No Show
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(r.id, RESERVATION_STATUS_CANCELLED)
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
      </div>
    </AdminLayout>
  );
};

export default AdminReservationsPage;
