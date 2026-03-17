import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminReview } from '../../interfaces/admin';
import { apiFetch, ApiError } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { formatDate } from '../../constants/reservation';

const RATING_FILTERS = [
  { key: 0, label: 'All Ratings' },
  { key: 1, label: '1 Star' },
  { key: 2, label: '2 Stars' },
  { key: 3, label: '3 Stars' },
  { key: 4, label: '4 Stars' },
  { key: 5, label: '5 Stars' },
] as const;

const AdminReviewsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const { show } = useNotification();
  const debouncedQuery = useDebounce(searchQuery, 300);

  const fetchPath = useMemo(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (ratingFilter > 0) params.set('rating', String(ratingFilter));
    return `/admin/reviews?${params}`;
  }, [debouncedQuery, ratingFilter]);

  const { data: reviews, isLoading, error, refetch } = useFetch<AdminReview[]>(fetchPath);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await apiFetch(`/admin/reviews/${id}`, { method: 'DELETE' });
      show('Review deleted successfully', 'success');
      setConfirmDeleteId(null);
      refetch();
    } catch (err: unknown) {
      show(err instanceof ApiError ? err.message : 'Failed to delete review', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-ot-charade dark:text-dark-text">Reviews</h1>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search by author, restaurant, or review text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[240px] text-sm border border-ot-iron dark:border-dark-border rounded-ot-btn px-4 py-2.5 bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-ot-charade/30 dark:focus:ring-dark-primary/30"
          />
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(Number(e.target.value))}
            className="text-sm border border-ot-iron dark:border-dark-border rounded-ot-btn px-4 py-2.5 bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text outline-none focus:ring-2 focus:ring-ot-charade/30 dark:focus:ring-dark-primary/30"
          >
            {RATING_FILTERS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
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
        ) : (reviews ?? []).length === 0 ? (
          <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-12 text-center">
            <p className="text-gray-500 dark:text-dark-text-secondary">No reviews found.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-ot-iron dark:border-dark-border bg-ot-athens-gray dark:bg-dark-surface">
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-dark-text-secondary w-[16%]">
                    Author
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-dark-text-secondary w-[14%]">
                    Restaurant
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-dark-text-secondary w-[12%]">
                    Rating
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-dark-text-secondary w-[32%]">
                    Review
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-dark-text-secondary w-[10%]">
                    Date
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-dark-text-secondary w-[16%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(reviews ?? []).map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-ot-iron/50 dark:border-dark-border last:border-0 hover:bg-ot-athens-gray/50 dark:hover:bg-dark-surface/50 transition-colors"
                  >
                    <td
                      className="px-3 py-2.5 font-medium text-ot-charade dark:text-dark-text truncate"
                      title={r.author_name}
                    >
                      {r.author_name}
                    </td>
                    <td className="px-3 py-2.5 truncate">
                      <a
                        href={`/restaurant/${r.restaurant_slug}`}
                        className="text-ot-primary dark:text-dark-primary hover:underline"
                        title={r.restaurant_name}
                      >
                        {r.restaurant_name}
                      </a>
                    </td>
                    <td className="px-3 py-2.5">{renderStars(r.rating)}</td>
                    <td
                      className="px-3 py-2.5 text-gray-500 dark:text-dark-text-secondary truncate"
                      title={r.text || undefined}
                    >
                      {r.text || <span className="italic text-gray-400">No text</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 dark:text-dark-text-secondary text-xs whitespace-nowrap">
                      {formatDate(r.created_at.split('T')[0])}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {confirmDeleteId === r.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-ot-btn transition-colors disabled:opacity-50"
                          >
                            {deletingId === r.id ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-ot-btn transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(r.id)}
                          className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-ot-btn transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReviewsPage;
