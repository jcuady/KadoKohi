import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  MONTH_LABELS,
  WEEKDAY_LABELS,
  dateKeyFromParts,
  dayStatus,
  isDateSelectable,
  type EventCalendarMonth,
} from '../../lib/eventCalendar';
import { useEventCalendarStore } from '../../store/eventCalendarStore';

type Props = {
  selectedDate?: string;
  onSelectDate?: (dateKey: string) => void;
  adminMode?: boolean;
  className?: string;
};

export default function EventAvailabilityCalendar({
  selectedDate,
  onSelectDate,
  adminMode = false,
  className = '',
}: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [monthData, setMonthData] = useState<EventCalendarMonth | null>(null);
  const loadMonth = useEventCalendarStore((s) => s.loadMonth);
  const toggleBlockout = useEventCalendarStore((s) => s.toggleBlockout);
  const loading = useEventCalendarStore((s) => s.loading);

  useEffect(() => {
    let active = true;
    void loadMonth(year, month).then((data) => {
      if (active) setMonthData(data);
    });
    return () => {
      active = false;
    };
  }, [year, month, loadMonth]);

  const matrix = useMemo(() => {
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
  }, [year, month]);

  const calendar = monthData ?? { year, month, blockouts: [], booked: [] };

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const handleDayClick = async (day: number) => {
    const key = dateKeyFromParts(year, month, day);
    if (adminMode) {
      if (dayStatus(key, calendar) === 'past') return;
      if (dayStatus(key, calendar) === 'booked') return;
      await toggleBlockout(key);
      const refreshed = await loadMonth(year, month);
      setMonthData(refreshed);
      return;
    }
    if (!isDateSelectable(key, calendar) || !onSelectDate) return;
    onSelectDate(key);
  };

  return (
    <div className={`rounded-2xl border border-kado-dark/10 bg-white p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="w-9 h-9 rounded-full border border-kado-dark/10 flex items-center justify-center text-kado-dark/70 hover:border-kado-red/40 hover:text-kado-red"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="font-display font-bold text-kado-dark text-sm sm:text-base">
          {MONTH_LABELS[month - 1]} {year}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="w-9 h-9 rounded-full border border-kado-dark/10 flex items-center justify-center text-kado-dark/70 hover:border-kado-red/40 hover:text-kado-red"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[9px] font-black uppercase tracking-wider text-kado-dark/40 py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" aria-busy={loading}>
        {matrix.flat().map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
          const key = dateKeyFromParts(year, month, day);
          const status = dayStatus(key, calendar);
          const selected = selectedDate === key;
          const selectable = adminMode
            ? status !== 'past' && status !== 'booked'
            : isDateSelectable(key, calendar);

          let cellClass =
            'aspect-square rounded-xl text-xs font-bold flex items-center justify-center transition-colors ';
          if (status === 'past') cellClass += 'text-kado-dark/25 cursor-default';
          else if (status === 'blocked') cellClass += 'bg-red-50 text-red-700 border border-red-200';
          else if (status === 'booked') cellClass += 'bg-kado-dark/8 text-kado-dark/35 cursor-not-allowed';
          else if (selected) cellClass += 'bg-kado-red text-white shadow-md';
          else if (selectable) cellClass += 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer';
          else cellClass += 'text-kado-dark/40';

          return (
            <button
              key={key}
              type="button"
              disabled={!selectable && !adminMode}
              onClick={() => void handleDayClick(day)}
              className={cellClass}
              aria-label={`${key} ${status}`}
              aria-pressed={selected}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-[10px] font-semibold uppercase tracking-wider text-kado-dark/55">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-50 border border-red-200" /> Unavailable
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-kado-dark/10" /> Booked
        </span>
      </div>

      {adminMode && (
        <p className="text-xs text-kado-dark/55 mt-3 leading-relaxed">
          Tap an open day to block it for events. Tap a blocked day to reopen it. Confirmed bookings cannot be changed here.
        </p>
      )}
    </div>
  );
}
