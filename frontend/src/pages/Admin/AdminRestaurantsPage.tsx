import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminRestaurant } from '../../interfaces/admin';
import { PRICE_SYMBOLS } from '../../constants/reservation';
import { apiFetch } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
] as const;

const AdminRestaurantsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const { show } = useNotification();

  const debouncedQuery = useDebounce(searchQuery, 400);

  const { data: cities } = useFetch<string[]>('/restaurants/cities');

  const fetchPath = useMemo(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (statusFilter !== '') params.set('is_active', statusFilter);
    if (cityFilter) params.set('city', cityFilter);
    return `/admin/restaurants?${params}`;
  }, [debouncedQuery, statusFilter, cityFilter]);

  const { data: restaurants, isLoading, error, refetch } = useFetch<AdminRestaurant[]>(fetchPath);

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await apiFetch(`/admin/restaurants/${id}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      });
      show(isActive ? 'Restaurant activated' : 'Restaurant deactivated', 'success');
      refetch();
    } catch {
      show('Failed to update restaurant status', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-ot-charade dark:text-dark-text">Restaurants</h1>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurants..."
              className="w-full text-sm border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2 bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text outline-none focus:ring-2 focus:ring-ot-charade/30 dark:focus:ring-dark-primary/30 placeholder-gray-400 dark:placeholder-dark-text-secondary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2 bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text outline-none focus:ring-2 focus:ring-ot-charade/30 dark:focus:ring-dark-primary/30"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="text-sm border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2 bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text outline-none focus:ring-2 focus:ring-ot-charade/30 dark:focus:ring-dark-primary/30"
          >
            <option value="">All Cities</option>
            {(cities ?? []).map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-charade dark:border-dark-primary" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (restaurants ?? []).length === 0 ? (
          <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-12 text-center">
            <p className="text-gray-500 dark:text-dark-text-secondary">No restaurants found.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ot-iron dark:border-dark-border bg-ot-athens-gray dark:bg-dark-surface">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-secondary">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-secondary">
                      Owner
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-secondary">
                      City
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-secondary">
                      Cuisine
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-secondary">
                      Rating
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
                  {(restaurants ?? []).map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-ot-iron/50 dark:border-dark-border last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-ot-charade dark:text-dark-text">
                            {r.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-dark-text-secondary">
                            {PRICE_SYMBOLS[r.price_range] ?? ''} · Cap: {r.max_capacity}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-dark-text-secondary whitespace-nowrap">
                        {r.owner_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-dark-text-secondary">
                        {r.city}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-dark-text-secondary">
                        {r.cuisine}
                      </td>
                      <td className="px-4 py-3">
                        {r.rating !== null ? (
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5 text-amber-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                            </svg>
                            <span className="text-ot-charade dark:text-dark-text font-medium">
                              {r.rating.toFixed(1)}
                            </span>
                            <span className="text-gray-400 dark:text-dark-text-secondary">
                              ({r.review_count})
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-dark-text-secondary">
                            No ratings
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.is_active ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(r.id, !r.is_active)}
                            className={`text-xs px-3 py-1 rounded-lg font-medium border transition-colors ${
                              r.is_active
                                ? 'border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'border-green-200 dark:border-green-800 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                          >
                            {r.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <Link
                            to={`/restaurant/${r.slug}`}
                            className="text-xs px-3 py-1 rounded-lg font-medium border border-ot-iron dark:border-dark-border text-ot-charade dark:text-dark-text hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRestaurantsPage;
