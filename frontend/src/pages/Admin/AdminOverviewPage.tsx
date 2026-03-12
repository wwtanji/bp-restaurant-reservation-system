import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { apiFetch } from '../../utils/api';
import { AdminPlatformStats } from '../../interfaces/admin';

const AdminOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminPlatformStats>('/admin/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-ot-charade dark:text-dark-text">Admin Panel</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-charade dark:border-dark-primary" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total Users" value={stats.total_users} />
              <StatCard
                label="Restaurants"
                value={stats.total_restaurants}
                subtitle={`${stats.active_restaurants} active`}
              />
              <StatCard label="Total Reservations" value={stats.total_reservations} />
              <StatCard label="Today's Reservations" value={stats.todays_reservations} />
              <StatCard label="Total Reviews" value={stats.total_reviews} />
              <div className="bg-white dark:bg-dark-paper rounded-xl p-6 border border-ot-iron dark:border-dark-border">
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Users by Role</p>
                <div className="mt-2 space-y-1">
                  {Object.entries(stats.users_by_role).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-ot-charade dark:text-dark-text">{role}</span>
                      <span className="font-semibold text-ot-charade dark:text-dark-text">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                to="/admin/users"
                className="bg-ot-charade dark:bg-dark-primary text-white px-5 py-2.5 rounded-ot-btn text-sm font-bold hover:bg-ot-primary-dark transition-colors"
              >
                Manage Users
              </Link>
              <Link
                to="/admin/restaurants"
                className="border border-ot-iron dark:border-dark-border text-ot-charade dark:text-dark-text px-5 py-2.5 rounded-ot-btn text-sm font-medium hover:bg-white dark:hover:bg-dark-surface transition-colors"
              >
                Manage Restaurants
              </Link>
            </div>
          </>
        ) : (
          <p className="text-gray-500 dark:text-dark-text-secondary">Failed to load admin stats.</p>
        )}
      </div>
    </AdminLayout>
  );
};

const StatCard: React.FC<{ label: string; value: number; subtitle?: string }> = ({ label, value, subtitle }) => (
  <div className="bg-white dark:bg-dark-paper rounded-xl p-6 border border-ot-iron dark:border-dark-border">
    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">{label}</p>
    <p className="text-3xl font-bold text-ot-charade dark:text-dark-text mt-1">{value}</p>
    {subtitle && (
      <p className="text-xs text-gray-400 dark:text-dark-text-secondary mt-0.5">{subtitle}</p>
    )}
  </div>
);

export default AdminOverviewPage;
