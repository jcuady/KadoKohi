import type { BranchHours, BranchHoursDay } from '../types/domain';

const DAY_ORDER: BranchHoursDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABEL: Record<BranchHoursDay, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

/** Shared café schedule: Mon–Thu 10–21, Fri–Sun 10–22. */
export const KADO_DEFAULT_BRANCH_HOURS: BranchHours[] = [
  { day: 'mon', open: '10:00', close: '21:00' },
  { day: 'tue', open: '10:00', close: '21:00' },
  { day: 'wed', open: '10:00', close: '21:00' },
  { day: 'thu', open: '10:00', close: '21:00' },
  { day: 'fri', open: '10:00', close: '22:00' },
  { day: 'sat', open: '10:00', close: '22:00' },
  { day: 'sun', open: '10:00', close: '22:00' },
];

function isBranchHoursDay(value: string): value is BranchHoursDay {
  return (DAY_ORDER as readonly string[]).includes(value);
}

/** Normalize admin / legacy rows into mon–sun entries. */
export function normalizeBranchHours(hours: ReadonlyArray<{ day: string; open: string; close: string }>): BranchHours[] {
  const byDay = new Map<BranchHoursDay, BranchHours>();

  for (const row of hours) {
    const open = String(row.open ?? '').trim();
    const close = String(row.close ?? '').trim();
    if (!open || !close) continue;

    const raw = String(row.day ?? '').trim().toLowerCase();
    if (isBranchHoursDay(raw)) {
      byDay.set(raw, { day: raw, open, close });
      continue;
    }

    // Legacy compact keys e.g. "Mon-Fri", "Sat-Sun"
    const compact = raw.replace(/\s+/g, '');
    const range = compact.match(/^(mon|tue|wed|thu|fri|sat|sun)-(mon|tue|wed|thu|fri|sat|sun)$/);
    if (range && isBranchHoursDay(range[1]) && isBranchHoursDay(range[2])) {
      const start = DAY_ORDER.indexOf(range[1]);
      const end = DAY_ORDER.indexOf(range[2]);
      if (start >= 0 && end >= start) {
        for (let i = start; i <= end; i++) {
          const day = DAY_ORDER[i]!;
          byDay.set(day, { day, open, close });
        }
      }
    }
  }

  return DAY_ORDER.map((day) => byDay.get(day)).filter((h): h is BranchHours => Boolean(h));
}

function formatClock(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return hhmm;
  let h = Number(m[1]);
  const min = m[2];
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return min === '00' ? `${h} ${suffix}` : `${h}:${min} ${suffix}`;
}

/** Human schedule line(s), e.g. "Mon-Thu 10 AM - 9 PM · Fri-Sun 10 AM - 10 PM". */
export function formatBranchHoursSummary(
  hours: ReadonlyArray<{ day: string; open: string; close: string }>,
): string {
  const normalized = normalizeBranchHours(hours);
  if (normalized.length === 0) return '';

  const groups: Array<{ start: BranchHoursDay; end: BranchHoursDay; open: string; close: string }> = [];
  for (const row of normalized) {
    const last = groups[groups.length - 1];
    if (last && last.open === row.open && last.close === row.close) {
      const expected = DAY_ORDER[DAY_ORDER.indexOf(last.end) + 1];
      if (expected === row.day) {
        last.end = row.day;
        continue;
      }
    }
    groups.push({ start: row.day, end: row.day, open: row.open, close: row.close });
  }

  return groups
    .map((g) => {
      const days = g.start === g.end ? DAY_LABEL[g.start] : `${DAY_LABEL[g.start]}-${DAY_LABEL[g.end]}`;
      return `${days} ${formatClock(g.open)} - ${formatClock(g.close)}`;
    })
    .join(' · ');
}

/** Build 7-day hours from weekday + weekend windows (admin form). */
export function branchHoursFromWindows(input: {
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
}): BranchHours[] {
  const weekdays: BranchHoursDay[] = ['mon', 'tue', 'wed', 'thu'];
  const weekend: BranchHoursDay[] = ['fri', 'sat', 'sun'];
  return [
    ...weekdays.map((day) => ({
      day,
      open: input.weekdayOpen.trim() || '10:00',
      close: input.weekdayClose.trim() || '21:00',
    })),
    ...weekend.map((day) => ({
      day,
      open: input.weekendOpen.trim() || '10:00',
      close: input.weekendClose.trim() || '22:00',
    })),
  ];
}

export function windowsFromBranchHours(hours: ReadonlyArray<{ day: string; open: string; close: string }>): {
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
} {
  const n = normalizeBranchHours(hours);
  const mon = n.find((h) => h.day === 'mon');
  const fri = n.find((h) => h.day === 'fri');
  return {
    weekdayOpen: mon?.open ?? '10:00',
    weekdayClose: mon?.close ?? '21:00',
    weekendOpen: fri?.open ?? '10:00',
    weekendClose: fri?.close ?? '22:00',
  };
}
