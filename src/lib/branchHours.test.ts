import { describe, expect, it } from 'vitest';
import {
  KADO_DEFAULT_BRANCH_HOURS,
  branchHoursFromWindows,
  formatBranchHoursSummary,
  normalizeBranchHours,
  windowsFromBranchHours,
} from './branchHours';

describe('branchHours', () => {
  it('formats default Mon-Thu / Fri-Sun schedule for display', () => {
    expect(formatBranchHoursSummary(KADO_DEFAULT_BRANCH_HOURS)).toBe(
      'Mon-Thu 10 AM - 9 PM · Fri-Sun 10 AM - 10 PM',
    );
  });

  it('normalizes legacy Mon-Fri compact rows', () => {
    const n = normalizeBranchHours([
      { day: 'Mon-Fri', open: '07:00', close: '21:00' },
      { day: 'Sat-Sun', open: '08:00', close: '21:00' },
    ]);
    expect(n).toHaveLength(7);
    expect(n[0]).toEqual({ day: 'mon', open: '07:00', close: '21:00' });
    expect(n[5]).toEqual({ day: 'sat', open: '08:00', close: '21:00' });
  });

  it('round-trips weekday/weekend windows', () => {
    const hours = branchHoursFromWindows({
      weekdayOpen: '10:00',
      weekdayClose: '21:00',
      weekendOpen: '10:00',
      weekendClose: '22:00',
    });
    expect(windowsFromBranchHours(hours)).toEqual({
      weekdayOpen: '10:00',
      weekdayClose: '21:00',
      weekendOpen: '10:00',
      weekendClose: '22:00',
    });
  });
});
