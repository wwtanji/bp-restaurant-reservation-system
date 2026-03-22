import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import useFetch from '../../hooks/useFetch';
import { useThemeMode } from '../../context/ThemeContext';
import {
  OwnerDashboardStats,
  OwnerTrendStats,
  OwnerRestaurant,
} from '../../interfaces/restaurant';
import { STATUS_CHART_COLORS, STATUS_LABELS } from '../../constants/admin';
import {
  OWNER_CHART_COLORS,
  LOYALTY_COLORS,
  formatEuroCents,
  formatHourLabel,
} from '../../constants/dashboard';
import {
  formatChartDate,
  calculateChange,
  renderPieLabel,
  StatCard,
  ChartCard,
  DonutLegend,
  useChartTheme,
} from '../../components/common/ChartComponents';

const DashboardOverviewPage: React.FC = () => {
  const { isDark } = useThemeMode();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);

  const { data: restaurants } = useFetch<OwnerRestaurant[]>('/owners/restaurants');

  const statsPath = selectedRestaurantId
    ? `/owners/restaurants/stats?restaurant_id=${selectedRestaurantId}`
    : '/owners/restaurants/stats';
  const trendsPath = selectedRestaurantId
    ? `/owners/restaurants/stats/trends?restaurant_id=${selectedRestaurantId}`
    : '/owners/restaurants/stats/trends';

  const { data: stats, isLoading: statsLoading } = useFetch<OwnerDashboardStats>(statsPath);
  const { data: trends, isLoading: trendsLoading } = useFetch<OwnerTrendStats>(trendsPath);
  const loading = statsLoading || trendsLoading;

  const { axisColor, gridColor, tooltipBg, tooltipStyle } = useChartTheme(isDark);

  const reservationColor = isDark
    ? OWNER_CHART_COLORS.reservation.dark
    : OWNER_CHART_COLORS.reservation.light;
  const revenueColor = isDark
    ? OWNER_CHART_COLORS.revenue.dark
    : OWNER_CHART_COLORS.revenue.light;

  const statusData = trends
    ? Object.entries(trends.reservation_status_breakdown)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => ({
          name: STATUS_LABELS[key] ?? key,
          value,
          fill: STATUS_CHART_COLORS[key] ?? '#6B7280',
        }))
    : [];
  const statusTotal = statusData.reduce((sum, d) => sum + d.value, 0);

  const loyaltyData = trends
    ? [
        {
          name: 'New Guests',
          value: trends.customer_loyalty.new_customers,
          fill: isDark ? LOYALTY_COLORS.new.dark : LOYALTY_COLORS.new.light,
        },
        {
          name: 'Repeat Guests',
          value: trends.customer_loyalty.repeat_customers,
          fill: isDark ? LOYALTY_COLORS.repeat.dark : LOYALTY_COLORS.repeat.light,
        },
      ].filter((d) => d.value > 0)
    : [];
  const loyaltyTotal = loyaltyData.reduce((sum, d) => sum + d.value, 0);

  const revenueChange =
    stats && stats.previous_period_revenue_cents > 0
      ? calculateChange(stats.current_period_revenue_cents, stats.previous_period_revenue_cents)
      : stats && stats.current_period_revenue_cents > 0
        ? 100
        : null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-ot-charade dark:text-dark-text">Dashboard</h1>
          {restaurants && restaurants.length > 1 && (
            <select
              value={selectedRestaurantId ?? ''}
              onChange={(e) =>
                setSelectedRestaurantId(e.target.value ? Number(e.target.value) : null)
              }
              className="rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-paper text-sm text-ot-charade dark:text-dark-text px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">All Restaurants</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-charade dark:border-dark-primary" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard
                label="Total Reservations"
                value={stats.total_reservations}
                accent="violet"
                change={
                  calculateChange(
                    stats.current_period_reservations,
                    stats.previous_period_reservations,
                  )
                }
              />
              <StatCard
                label="Revenue"
                value={stats.total_revenue_cents}
                displayValue={formatEuroCents(stats.total_revenue_cents)}
                accent="emerald"
                change={revenueChange}
              />
              <StatCard
                label="Average Rating"
                value={stats.average_rating ?? 0}
                displayValue={stats.average_rating ? `${stats.average_rating.toFixed(1)} / 5` : '—'}
                accent="amber"
              />
              <StatCard
                label="Today's Reservations"
                value={stats.todays_reservations}
                accent="indigo"
              />
              <StatCard
                label="Total Reviews"
                value={stats.total_reviews}
                accent="rose"
              />
            </div>

            {trends && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Reservation Trends (Last 30 Days)" fullWidth>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={trends.reservation_trends}>
                      <defs>
                        <linearGradient id="ownerResGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={reservationColor} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={reservationColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatChartDate}
                        tick={{ fill: axisColor, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: axisColor, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip labelFormatter={formatChartDate} contentStyle={tooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Reservations"
                        stroke={reservationColor}
                        strokeWidth={2.5}
                        fill="url(#ownerResGradient)"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 2, fill: tooltipBg }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Revenue Trends (Last 30 Days)">
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={trends.revenue_trends}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={revenueColor} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={revenueColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatChartDate}
                        tick={{ fill: axisColor, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tickFormatter={(v: number) => `${(v / 100).toFixed(0)} €`}
                        tick={{ fill: axisColor, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        labelFormatter={formatChartDate}
                        formatter={(value) => [formatEuroCents(Number(value)), 'Revenue']}
                        contentStyle={tooltipStyle}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        name="Revenue"
                        stroke={revenueColor}
                        strokeWidth={2.5}
                        fill="url(#revenueGradient)"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 2, fill: tooltipBg }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Reservation Status">
                  {statusData.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={110}
                            paddingAngle={3}
                            strokeWidth={0}
                            labelLine={false}
                            label={renderPieLabel}
                          >
                            {statusData.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                      <DonutLegend data={statusData} total={statusTotal} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-sm text-gray-400 dark:text-dark-text-secondary">
                      No reservation data
                    </div>
                  )}
                </ChartCard>

                <ChartCard title="Peak Hours">
                  {trends.peak_hours.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={trends.peak_hours}>
                        <defs>
                          <linearGradient id="peakHoursGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={reservationColor} stopOpacity={1} />
                            <stop offset="100%" stopColor={reservationColor} stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis
                          dataKey="hour"
                          tickFormatter={formatHourLabel}
                          tick={{ fill: axisColor, fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fill: axisColor, fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          labelFormatter={(h) => formatHourLabel(Number(h))}
                          contentStyle={tooltipStyle}
                        />
                        <Bar
                          dataKey="count"
                          name="Reservations"
                          fill="url(#peakHoursGradient)"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[320px] text-sm text-gray-400 dark:text-dark-text-secondary">
                      No data
                    </div>
                  )}
                </ChartCard>

                <ChartCard title="Party Size Distribution">
                  {trends.party_size_distribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={trends.party_size_distribution}>
                        <defs>
                          <linearGradient id="partySizeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={revenueColor} stopOpacity={1} />
                            <stop offset="100%" stopColor={revenueColor} stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis
                          dataKey="party_size"
                          tick={{ fill: axisColor, fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fill: axisColor, fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar
                          dataKey="count"
                          name="Reservations"
                          fill="url(#partySizeGradient)"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[320px] text-sm text-gray-400 dark:text-dark-text-secondary">
                      No data
                    </div>
                  )}
                </ChartCard>

                <ChartCard title="Customer Loyalty">
                  {loyaltyData.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={loyaltyData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={110}
                            paddingAngle={3}
                            strokeWidth={0}
                            labelLine={false}
                            label={renderPieLabel}
                          >
                            {loyaltyData.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                      <DonutLegend data={loyaltyData} total={loyaltyTotal} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-sm text-gray-400 dark:text-dark-text-secondary">
                      No guest data
                    </div>
                  )}
                </ChartCard>
              </div>
            )}

            <div className="flex gap-4">
              <Link
                to="/dashboard/restaurants/new"
                className="bg-ot-charade dark:bg-dark-primary text-white px-5 py-2.5 rounded-ot-btn text-sm font-bold hover:bg-ot-primary-dark transition-colors"
              >
                Add Restaurant
              </Link>
              <Link
                to="/dashboard/restaurants"
                className="border border-ot-iron dark:border-dark-border text-ot-charade dark:text-dark-text px-5 py-2.5 rounded-ot-btn text-sm font-medium hover:bg-white dark:hover:bg-dark-surface transition-colors"
              >
                View Restaurants
              </Link>
            </div>
          </>
        ) : (
          <p className="text-gray-500 dark:text-dark-text-secondary">
            Failed to load dashboard stats.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardOverviewPage;
