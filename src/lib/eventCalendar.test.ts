import { describe, expect, it } from 'vitest';
import { isDateSelectable, dayStatus } from './eventCalendar';

describe('eventCalendar date policy', () => {
  const calendar = {
    blockouts: ['2026-06-27'],
    booked: ['2026-06-25', '2026-06-28'],
  };

  it('blocks only admin blockouts and past dates', () => {
    expect(isDateSelectable('2026-06-27', calendar, '2026-06-01')).toBe(false);
    expect(isDateSelectable('2026-06-25', calendar, '2026-06-01')).toBe(true);
    expect(isDateSelectable('2026-06-28', calendar, '2026-06-01')).toBe(true);
    expect(isDateSelectable('2026-05-30', calendar, '2026-06-01')).toBe(false);
  });

  it('still reports booked days for calendar display', () => {
    expect(dayStatus('2026-06-28', calendar, '2026-06-01')).toBe('booked');
    expect(dayStatus('2026-06-29', calendar, '2026-06-01')).toBe('available');
  });
});
