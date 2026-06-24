export const EVENT_PROPOSAL_PACKAGE_ID = 'event_proposal';
export const EVENT_PROPOSAL_PACKAGE_NAME = 'Event Proposal';

export type EventCalendarMonth = {
  year: number;
  month: number;
  blockouts: string[];
  booked: string[];
};

export function dateKeyFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function minEventDateKey(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export function monthMatrix(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month - 1, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export type EventDayStatus = 'past' | 'available' | 'blocked' | 'booked';

export function dayStatus(
  key: string,
  calendar: Pick<EventCalendarMonth, 'blockouts' | 'booked'>,
  minDate = minEventDateKey(),
): EventDayStatus {
  if (key < minDate) return 'past';
  if (calendar.blockouts.includes(key)) return 'blocked';
  if (calendar.booked.includes(key)) return 'booked';
  return 'available';
}

export function isDateSelectable(
  key: string,
  calendar: Pick<EventCalendarMonth, 'blockouts' | 'booked'>,
  minDate = minEventDateKey(),
): boolean {
  if (key < minDate) return false;
  if (calendar.blockouts.includes(key)) return false;
  return true;
}

export const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
