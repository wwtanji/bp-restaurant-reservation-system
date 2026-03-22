import React from 'react';
import { PieLabelRenderProps } from 'recharts';

export const formatChartDate = (dateStr: unknown): string => {
  const d = new Date(String(dateStr) + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const calculateChange = (current: number, previous: number): number | null => {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
};

const RADIAN = Math.PI / 180;

export const renderPieLabel = (props: PieLabelRenderProps) => {
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
  displayValue?: string;
  subtitle?: string;
  change?: number | null;
  accent?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  displayValue,
  subtitle,
  change,
  accent = 'indigo',
}) => {
  const dotColor = ACCENT_DOT_COLORS[accent] ?? ACCENT_DOT_COLORS.indigo;
  return (
    <div className="bg-white dark:bg-dark-paper rounded-xl p-5 border border-gray-100 dark:border-dark-border shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <p className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">{label}</p>
      </div>
      <p className="text-3xl font-semibold text-ot-charade dark:text-dark-text tabular-nums">
        {displayValue ?? value.toLocaleString()}
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

export const ChartCard: React.FC<ChartCardProps> = ({ title, fullWidth, children }) => (
  <div
    className={`${fullWidth ? 'lg:col-span-2' : ''} bg-white dark:bg-dark-paper rounded-xl p-5 border border-gray-100 dark:border-dark-border shadow-sm`}
  >
    <h2 className="text-sm font-semibold text-ot-charade dark:text-dark-text mb-5">{title}</h2>
    {children}
  </div>
);

export interface DonutLegendEntry {
  name: string;
  value: number;
  fill: string;
}

interface DonutLegendProps {
  data: DonutLegendEntry[];
  total: number;
}

export const DonutLegend: React.FC<DonutLegendProps> = ({ data, total }) => (
  <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-2">
    {data.map((entry) => (
      <div key={entry.name} className="flex items-center gap-2 text-sm">
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: entry.fill }}
        />
        <span className="text-gray-600 dark:text-dark-text-secondary">{entry.name}</span>
        <span className="font-semibold text-ot-charade dark:text-dark-text tabular-nums">
          {entry.value}
        </span>
        <span className="text-xs text-gray-400 dark:text-dark-text-secondary">
          ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
        </span>
      </div>
    ))}
  </div>
);

export const useChartTheme = (isDark: boolean) => ({
  axisColor: isDark ? '#A1A1AA' : '#6B7280',
  gridColor: isDark ? '#2A2A2E' : '#F3F4F6',
  tooltipBg: isDark ? '#1C1C1F' : '#FFFFFF',
  tooltipBorder: isDark ? '#333338' : '#E5E7EB',
  tooltipTextColor: isDark ? '#E4E4E7' : '#1E293B',
  tooltipStyle: {
    backgroundColor: isDark ? '#1C1C1F' : '#FFFFFF',
    border: `1px solid ${isDark ? '#333338' : '#E5E7EB'}`,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    color: isDark ? '#E4E4E7' : '#1E293B',
    fontSize: 13,
  },
});
