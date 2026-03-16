import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { apiFetch, resolveImageUrl } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { OwnerRestaurant } from '../../interfaces/restaurant';
import { PRICE_SYMBOLS } from '../../constants/reservation';

const DashboardRestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<OwnerRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<OwnerRestaurant | null>(null);
  const { show } = useNotification();

  const fetchRestaurants = () => {
    setLoading(true);
    apiFetch<OwnerRestaurant[]>('/owners/restaurants')
      .then(setRestaurants)
      .catch(() => show('Failed to load restaurants', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/owners/restaurants/${deleteTarget.id}`, { method: 'DELETE' });
      show('Restaurant deleted successfully', 'success');
      setDeleteTarget(null);
      fetchRestaurants();
    } catch {
      show('Failed to delete restaurant', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ot-charade dark:text-dark-text">My Restaurants</h1>
          <Link
            to="/dashboard/restaurants/new"
            className="bg-ot-charade dark:bg-dark-primary text-white px-5 py-2.5 rounded-ot-btn text-sm font-bold hover:bg-ot-primary-dark transition-colors"
          >
            Add Restaurant
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-charade dark:border-dark-primary"></div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-12 text-center">
            <p className="text-gray-500 dark:text-dark-text-secondary mb-4">You don't have any restaurants yet.</p>
            <Link
              to="/dashboard/restaurants/new"
              className="bg-ot-charade dark:bg-dark-primary text-white px-5 py-2.5 rounded-ot-btn text-sm font-bold hover:bg-ot-primary-dark transition-colors"
            >
              Create Your First Restaurant
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-4 flex items-center gap-4"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-bg shrink-0">
                  {restaurant.cover_image ? (
                    <img
                      src={resolveImageUrl(restaurant.cover_image)}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ot-charade dark:text-dark-text truncate">{restaurant.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-dark-text-secondary truncate">{restaurant.address}, {restaurant.city}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 dark:text-dark-text-secondary">{restaurant.cuisine}</span>
                    <span className="text-xs text-gray-500 dark:text-dark-text-secondary">{PRICE_SYMBOLS[restaurant.price_range] || ''}</span>
                    <span className="text-xs text-gray-500 dark:text-dark-text-secondary">Capacity: {restaurant.max_capacity}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/dashboard/restaurants/${restaurant.id}/tables`}
                    className="border border-ot-iron dark:border-dark-border text-ot-charade dark:text-dark-text px-4 py-2 rounded-ot-btn text-sm font-medium hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
                  >
                    Tables
                  </Link>
                  <Link
                    to={`/dashboard/restaurants/${restaurant.id}/edit`}
                    className="border border-ot-iron dark:border-dark-border text-ot-charade dark:text-dark-text px-4 py-2 rounded-ot-btn text-sm font-medium hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(restaurant)}
                    className="border border-red-200 dark:border-red-800 text-red-600 px-4 py-2 rounded-ot-btn text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white dark:bg-dark-paper rounded-xl p-6 max-w-sm w-full shadow-xl">
            <DialogTitle className="text-lg font-bold text-ot-charade dark:text-dark-text">
              Delete Restaurant
            </DialogTitle>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-2">
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="border border-ot-iron dark:border-dark-border text-ot-charade dark:text-dark-text px-4 py-2 rounded-ot-btn text-sm font-medium hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-ot-btn text-sm font-bold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardRestaurantsPage;
