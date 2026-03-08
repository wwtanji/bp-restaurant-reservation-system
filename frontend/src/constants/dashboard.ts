import { OpeningHours, OpeningHourDay } from '../interfaces/restaurant';

export const OWNER_ROLE = 1;

export const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
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
  return Object.fromEntries(
    DAYS_OF_WEEK.map((day) => [day, { ...DEFAULT_DAY }])
  ) as OpeningHours;
}
