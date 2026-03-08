import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { apiFetch } from '../../utils/api';
import { DashboardStats } from '../../interfaces/restaurant';

const DashboardOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DashboardStats>('/owners/restaurants/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-ot-charade">Dashboard</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-charade"></div>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 border border-ot-iron">
                <p className="text-sm text-gray-500">Total Restaurants</p>
                <p className="text-3xl font-bold text-ot-charade mt-1">{stats.total_restaurants}</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-ot-iron">
                <p className="text-sm text-gray-500">Total Reservations</p>
                <p className="text-3xl font-bold text-ot-charade mt-1">{stats.total_reservations}</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-ot-iron">
                <p className="text-sm text-gray-500">Today's Reservations</p>
                <p className="text-3xl font-bold text-ot-charade mt-1">{stats.todays_reservations}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                to="/dashboard/restaurants/new"
                className="bg-ot-charade text-white px-5 py-2.5 rounded-ot-btn text-sm font-bold hover:bg-ot-primary-dark transition-colors"
              >
                Add Restaurant
              </Link>
              <Link
                to="/dashboard/restaurants"
                className="border border-ot-iron text-ot-charade px-5 py-2.5 rounded-ot-btn text-sm font-medium hover:bg-white transition-colors"
              >
                View Restaurants
              </Link>
            </div>
          </>
        ) : (
          <p className="text-gray-500">Failed to load dashboard stats.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardOverviewPage;
