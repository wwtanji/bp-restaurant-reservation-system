export const TIME_OPTIONS = [
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '1:00 PM',  '1:30 PM',  '2:00 PM',  '2:30 PM',
  '5:00 PM',  '5:30 PM',  '6:00 PM',  '6:30 PM',
  '7:00 PM',  '7:30 PM',  '8:00 PM',  '8:30 PM', '9:00 PM',
];

export const QUICK_TIME_SLOTS = ['6:30 PM', '6:45 PM', '7:00 PM', '7:15 PM', '7:30 PM'];

export const MAX_PARTY_SIZE = 10;

export const PARTY_SIZES = Array.from({ length: MAX_PARTY_SIZE }, (_, i) =>
  i === 0 ? '1 person' : `${i + 1} people`
);

export const RESERVATION_STATUS_PENDING = 'pending';
export const RESERVATION_STATUS_CONFIRMED = 'confirmed';
export const RESERVATION_STATUS_CANCELLED = 'cancelled';
export const RESERVATION_STATUS_COMPLETED = 'completed';
export const RESERVATION_STATUS_NO_SHOW = 'no_show';

export function toApiTime(display: string): string {
  const [timePart, period] = display.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

export function fromApiTime(apiTime: string): string {
  const [hStr, mStr] = apiTime.split(':');
  let hours = parseInt(hStr, 10);
  const minutes = mStr;
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
}

export function toApiPartySize(display: string): number {
  return parseInt(display, 10);
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatTime(apiTime: string): string {
  return fromApiTime(apiTime);
}

export const PRICE_SYMBOLS: Record<number, string> = {
  1: '$', 2: '$$', 3: '$$$', 4: '$$$$',
};
