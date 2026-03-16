import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { apiFetch } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { Table } from '../../interfaces/table';

const DashboardTablesPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);
  const { show } = useNotification();

  const fetchTables = () => {
    setLoading(true);
    apiFetch<Table[]>(`/owners/restaurants/${restaurantId}/tables`)
      .then(setTables)
      .catch(() => show('Failed to load tables', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTables();
  }, [restaurantId]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/owners/restaurants/${restaurantId}/tables/${deleteTarget.id}`, { method: 'DELETE' });
      show('Table deleted successfully', 'success');
      setDeleteTarget(null);
      fetchTables();
    } catch {
      show('Failed to delete table. It may have active reservations.', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/restaurants"
              className="text-ot-manatee dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-ot-charade dark:text-dark-text">Tables</h1>
          </div>
          <Link
            to={`/dashboard/restaurants/${restaurantId}/tables/new`}
            className="bg-ot-charade dark:bg-dark-primary text-white px-5 py-2.5 rounded-ot-btn text-sm font-bold hover:bg-ot-primary-dark transition-colors"
          >
            Add Table
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-charade dark:border-dark-primary"></div>
          </div>
        ) : tables.length === 0 ? (
          <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-12 text-center">
            <p className="text-gray-500 dark:text-dark-text-secondary mb-4">No tables configured yet.</p>
            <Link
              to={`/dashboard/restaurants/${restaurantId}/tables/new`}
              className="bg-ot-charade dark:bg-dark-primary text-white px-5 py-2.5 rounded-ot-btn text-sm font-bold hover:bg-ot-primary-dark transition-colors"
            >
              Add Your First Table
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tables.map((table) => (
              <div
                key={table.id}
                className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-ot-charade dark:text-dark-text">
                      Table {table.table_number}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-0.5">
                      {table.capacity} {table.capacity === 1 ? 'seat' : 'seats'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    table.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {table.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/dashboard/restaurants/${restaurantId}/tables/${table.id}/edit`}
                    className="flex-1 text-center border border-ot-iron dark:border-dark-border text-ot-charade dark:text-dark-text px-4 py-2 rounded-ot-btn text-sm font-medium hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(table)}
                    className="flex-1 text-center border border-red-200 dark:border-red-800 text-red-600 px-4 py-2 rounded-ot-btn text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
              Delete Table
            </DialogTitle>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-2">
              Are you sure you want to delete <strong>Table {deleteTarget?.table_number}</strong>? This action cannot be undone.
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

export default DashboardTablesPage;
