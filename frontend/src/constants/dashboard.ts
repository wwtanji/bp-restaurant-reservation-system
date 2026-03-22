import { OpeningHours, OpeningHourDay } from '../interfaces/restaurant';

export const OWNER_ROLE = 1;

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const DEFAULT_DAY: OpeningHourDay = {
  open: '09:00',
  close: '22:00',
  is_closed: false,
};

export function createDefaultOpeningHours(): OpeningHours {
  return Object.fromEntries(DAYS_OF_WEEK.map((day) => [day, { ...DEFAULT_DAY }])) as OpeningHours;
}

export const OWNER_CHART_COLORS = {
  reservation: { light: '#6366F1', dark: '#818CF8' },
  revenue: { light: '#10B981', dark: '#34D399' },
} as const;

export const LOYALTY_COLORS = {
  new: { light: '#3B82F6', dark: '#60A5FA' },
  repeat: { light: '#10B981', dark: '#34D399' },
} as const;

export const formatEuroCents = (cents: number): string =>
  `${(cents / 100).toFixed(2)} €`;

export const formatHourLabel = (hour: number): string =>
  `${hour.toString().padStart(2, '0')}:00`;
