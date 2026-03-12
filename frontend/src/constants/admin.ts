export const ADMIN_ROLE = 2;

export const ADMIN_SIDEBAR_ITEMS = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Restaurants', href: '/admin/restaurants' },
  { label: 'Reservations', href: '/admin/reservations' },
  { label: 'Reviews', href: '/admin/reviews' },
] as const;

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
