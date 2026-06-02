import { useMemo } from 'react';
import { useBranchStore } from '../../store/branchStore';
import type { ScheduleCopy } from '../../store/landingContentStore';
import { useSettingsStore } from '../../store/settingsStore';

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function toDisplayTime(raw: string) {
  const [h, m] = raw.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return raw;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

interface Props {
  copy?: ScheduleCopy;
}

export default function CafeScheduleSection({ copy }: Props) {
  const branches = useBranchStore((s) => s.branches);
  const settings = useSettingsStore((s) => s.settings);

  const activeBranch = useMemo(
    () => branches.find((branch) => branch.status === 'active') ?? branches[0],
    [branches],
  );

  const scheduleRows = useMemo(() => {
    if (!activeBranch) return [];
    const byDay = new Map<string, { open: string; close: string }>(
      activeBranch.hours.map((item) => [item.day, { open: item.open, close: item.close }]),
    );
    const defaultHours = `${toDisplayTime(settings.defaultOpenTime)} - ${toDisplayTime(settings.defaultCloseTime)}`;
    return DAY_ORDER.map((day) => {
      const row = byDay.get(day);
      return {
        dayLabel: DAY_LABELS[day],
        hours:
          row && row.open && row.close
            ? `${toDisplayTime(row.open)} - ${toDisplayTime(row.close)}`
            : defaultHours,
      };
    });
  }, [activeBranch, settings.defaultOpenTime, settings.defaultCloseTime]);

  if (!activeBranch) return null;

  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-12 lg:px-24 w-full bg-[#F7F2E9] border-y border-kado-dark/10">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-kado-red">
              {copy?.badge ?? 'Kado Kohi'}
            </p>
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[0.95] text-kado-dark">
              {copy?.title ?? 'Cafe Hours'}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-kado-dark/70 sm:text-base">
              {copy?.description ??
                'Your daily coffee routine, now clearly scheduled. Check our opening hours before dropping by for coffee, matcha, and community nights.'}
            </p>
          </div>

          <div className="rounded-[2rem] border border-kado-dark/10 bg-white p-4 sm:p-6 shadow-xl shadow-black/5">
            <div className="rounded-[1.5rem] bg-kado-red px-4 py-5 sm:px-6 sm:py-6 text-kado-cream">
              {scheduleRows.map((row) => (
                <div key={row.dayLabel} className="flex items-center justify-between gap-4 border-b border-kado-cream/20 py-2.5 last:border-b-0">
                  <span className="text-sm font-semibold uppercase tracking-[0.14em] sm:text-base">{row.dayLabel}</span>
                  <span className="text-sm font-bold sm:text-base">{row.hours}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs font-medium text-kado-dark/65 sm:text-sm">
              {activeBranch.address}, {activeBranch.city}
            </p>
            <p className="mt-1 text-center text-xs font-medium text-kado-dark/65 sm:text-sm">
              {copy?.phone ?? '+63 920 948 2934'}
            </p>
          </div>
        </div>

        <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-kado-dark/55">
          {copy?.creditLine ?? 'Featured local photos credited to InsideMarikina.'}
        </p>
      </div>
    </section>
  );
}
