import React from 'react';
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
  Legend,
  ResponsiveContainer,
  PieLabelRenderProps,
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import useFetch from '../../hooks/useFetch';
import { useThemeMode } from '../../context/ThemeContext';
import { AdminPlatformStats, AdminTrendStats } from '../../interfaces/admin';
import { CHART_COLORS, STATUS_CHART_COLORS, STATUS_LABELS } from '../../constants/admin';

const formatChartDate = (dateStr: unknown): string => {
  const d = new Date(String(dateStr) + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const calculateChange = (current: number, previous: number): number | null => {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
};

const RADIAN = Math.PI / 180;

const renderPieLabel = (props: PieLabelRenderProps) => {
  const cx = Number(props.cx ?? 0);
  const cy = Number(props.cy ?? 0);
  const midAngle = Number(props.midAngle ?? 0);
  const innerRadius = Number(props.innerRadius ?? 0);
  const outerRadius = Number(props.outerRadius ?? 0);
  const percent = Number(props.percent ?? 0);
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={13}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const AdminOverviewPage: React.FC = () => {
  const { isDark } = useThemeMode();
  const { data: stats, isLoading: statsLoading } = useFetch<AdminPlatformStats>('/admin/stats');
  const { data: trends, isLoading: trendsLoading } = useFetch<AdminTrendStats>(
    '/admin/stats/trends',
  );
  const loading = statsLoading || trendsLoading;

  const axisColor = isDark ? '#A1A1AA' : '#6B7280';
  const gridColor = isDark ? '#2A2A2E' : '#F3F4F6';
  const tooltipBg = isDark ? '#1C1C1F' : '#FFFFFF';
  const tooltipBorder = isDark ? '#333338' : '#E5E7EB';

  const reservationColor = isDark ? CHART_COLORS.reservation.dark : CHART_COLORS.reservation.light;
  const userColor = isDark ? CHART_COLORS.user.dark : CHART_COLORS.user.light;
  const reviewColor = isDark ? CHART_COLORS.review.dark : CHART_COLORS.review.light;

  const mergedGrowthData =
    trends?.user_trends.map((item, index) => ({
      date: item.date,
      users: item.count,
      reviews: trends.review_trends[index]?.count ?? 0,
    })) ?? [];

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
              <StatCard
                label="Total Users"
                value={stats.total_users}
                accent="indigo"
                change={
                  trends
                    ? calculateChange(trends.current_period_users, trends.previous_period_users)
                    : null
                }
              />
              <StatCard
                label="Restaurants"
                value={stats.total_restaurants}
                accent="emerald"
                subtitle={`${stats.active_restaurants} active`}
              />
              <StatCard
                label="Total Reservations"
                value={stats.total_reservations}
                accent="violet"
                change={
                  trends
                    ? calculateChange(
                        trends.current_period_reservations,
                        trends.previous_period_reservations,
                      )
                    : null
                }
              />
              <StatCard
                label="Today's Reservations"
                value={stats.todays_reservations}
                accent="amber"
              />
              <StatCard
                label="Total Reviews"
                value={stats.total_reviews}
                accent="rose"
                change={
                  trends
                    ? calculateChange(
                        trends.current_period_reviews,
                        trends.previous_period_reviews,
                      )
                    : null
                }
              />
              <div className="bg-white dark:bg-dark-paper rounded-xl p-5 border border-gray-100 dark:border-dark-border shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <p className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">
                    Users by Role
                  </p>
                </div>
                <div className="space-y-2">
                  {Object.entries(stats.users_by_role).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-gray-600 dark:text-dark-text-secondary">{role}</span>
                      <span className="font-semibold text-ot-charade dark:text-dark-text tabular-nums">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {trends && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Reservation Trends (Last 30 Days)" fullWidth>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={trends.reservation_trends}>
                      <defs>
                        <linearGradient id="reservationGradient" x1="0" y1="0" x2="0" y2="1">
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
                      <Tooltip
                        labelFormatter={formatChartDate}
                        contentStyle={{
                          backgroundColor: tooltipBg,
                          border: `1px solid ${tooltipBorder}`,
                          borderRadius: 12,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          color: isDark ? '#E4E4E7' : '#1E293B',
                          fontSize: 13,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Reservations"
                        stroke={reservationColor}
                        strokeWidth={2.5}
                        fill="url(#reservationGradient)"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 2, fill: tooltipBg }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="User & Review Growth">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={mergedGrowthData} barGap={4}>
                      <defs>
                        <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={userColor} stopOpacity={1} />
                          <stop offset="100%" stopColor={userColor} stopOpacity={0.6} />
                        </linearGradient>
                        <linearGradient id="reviewGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={reviewColor} stopOpacity={1} />
                          <stop offset="100%" stopColor={reviewColor} stopOpacity={0.6} />
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
                      <Tooltip
                        labelFormatter={formatChartDate}
                        contentStyle={{
                          backgroundColor: tooltipBg,
                          border: `1px solid ${tooltipBorder}`,
                          borderRadius: 12,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          color: isDark ? '#E4E4E7' : '#1E293B',
                          fontSize: 13,
                        }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
                      />
                      <Bar
                        dataKey="users"
                        name="Users"
                        fill="url(#userGradient)"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="reviews"
                        name="Reviews"
                        fill="url(#reviewGradient)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
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
                          <Tooltip
                            contentStyle={{
                              backgroundColor: tooltipBg,
                              border: `1px solid ${tooltipBorder}`,
                              borderRadius: 12,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              color: isDark ? '#E4E4E7' : '#1E293B',
                              fontSize: 13,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-2">
                        {statusData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2 text-sm">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: entry.fill }}
                            />
                            <span className="text-gray-600 dark:text-dark-text-secondary">
                              {entry.name}
                            </span>
                            <span className="font-semibold text-ot-charade dark:text-dark-text tabular-nums">
                              {entry.value}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-dark-text-secondary">
                              ({statusTotal > 0 ? Math.round((entry.value / statusTotal) * 100) : 0}
                              %)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-sm text-gray-400 dark:text-dark-text-secondary">
                      No reservation data
                    </div>
                  )}
                </ChartCard>
              </div>
            )}

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
          <p className="text-gray-500 dark:text-dark-text-secondary">
            Failed to load admin stats.
          </p>
        )}
      </div>
    </AdminLayout>
  );
};

const ACCENT_DOT_COLORS: Record<string, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
};

interface StatCardProps {
  label: string;
  value: number;
  subtitle?: string;
  change?: number | null;
  accent?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtitle, change, accent = 'indigo' }) => {
  const dotColor = ACCENT_DOT_COLORS[accent] ?? ACCENT_DOT_COLORS.indigo;
  return (
    <div className="bg-white dark:bg-dark-paper rounded-xl p-5 border border-gray-100 dark:border-dark-border shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <p className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">{label}</p>
      </div>
      <p className="text-3xl font-semibold text-ot-charade dark:text-dark-text tabular-nums">
        {value.toLocaleString()}
      </p>
      <div className="flex items-center gap-2 mt-2">
        {change !== undefined && change !== null && (
          <>
            <span
              className={`text-xs font-medium ${
                change >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {change >= 0 ? '+' : ''}
              {change}%
            </span>
            <span className="text-xs text-gray-400 dark:text-dark-text-secondary">
              vs prev 30d
            </span>
          </>
        )}
        {subtitle && (
          <span className="text-xs text-gray-400 dark:text-dark-text-secondary">{subtitle}</span>
        )}
      </div>
    </div>
  );
};

interface ChartCardProps {
  title: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, fullWidth, children }) => (
  <div
    className={`${fullWidth ? 'lg:col-span-2' : ''} bg-white dark:bg-dark-paper rounded-xl p-5 border border-gray-100 dark:border-dark-border shadow-sm`}
  >
    <h2 className="text-sm font-semibold text-ot-charade dark:text-dark-text mb-5">{title}</h2>
    {children}
  </div>
);

export default AdminOverviewPage;
