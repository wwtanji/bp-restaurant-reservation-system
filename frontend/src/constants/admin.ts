import { ComponentType } from 'react';
import {
  ChartBarSquareIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

export const ADMIN_ROLE = 2;

export const ADMIN_SIDEBAR_ITEMS = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Restaurants', href: '/admin/restaurants' },
  { label: 'Reservations', href: '/admin/reservations' },
  { label: 'Reviews', href: '/admin/reviews' },
] as const;

export interface AdminSidebarItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export interface AdminSidebarSection {
  label: string;
  items: AdminSidebarItem[];
}

export const ADMIN_SIDEBAR_SECTIONS: AdminSidebarSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin', icon: ChartBarSquareIcon }],
  },
  {
    label: 'Management',
    items: [
      { label: 'Users', href: '/admin/users', icon: UsersIcon },
      { label: 'Restaurants', href: '/admin/restaurants', icon: BuildingStorefrontIcon },
      { label: 'Reservations', href: '/admin/reservations', icon: CalendarDaysIcon },
      { label: 'Reviews', href: '/admin/reviews', icon: StarIcon },
    ],
  },
];

export const STORAGE_KEY_ADMIN_SIDEBAR_COLLAPSED = 'admin_sidebar_collapsed';

export const ROLE_LABELS: Record<number, string> = {
  0: 'Customer',
  1: 'Owner',
  2: 'Admin',
};

export const ROLE_BADGE: Record<number, { bg: string; text: string }> = {
  0: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' },
  1: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' },
  2: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400' },
};

export const ROLE_OPTIONS = [
  { value: 0, label: 'Customer' },
  { value: 1, label: 'Owner' },
  { value: 2, label: 'Admin' },
] as const;

export const CHART_COLORS = {
  reservation: { light: '#6366F1', dark: '#818CF8' },
  user: { light: '#10B981', dark: '#34D399' },
  review: { light: '#F59E0B', dark: '#FBBF24' },
} as const;

export const STATUS_CHART_COLORS: Record<string, string> = {
  pending: '#EAB308',
  confirmed: '#3B82F6',
  completed: '#22C55E',
  cancelled: '#EF4444',
  no_show: '#8B5CF6',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};
