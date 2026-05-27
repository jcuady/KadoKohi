/** Minutes before close when online checkout stops (admin default hours). */
export const ONLINE_ORDER_CUTOFF_MINUTES = 10;

export type OnlineOrderClosedReason = 'open' | 'before_open' | 'after_last_order' | 'invalid_hours';

export interface OnlineOrderHoursStatus {
  isOpen: boolean;
  reason: OnlineOrderClosedReason;
  openMinutes: number;
  closeMinutes: number;
  lastOrderMinutes: number;
  openLabel: string;
  closeLabel: string;
  lastOrderLabel: string;
  message: string;
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export function formatMinutesTo12h(minutes: number): string {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

export function getOnlineOrderHoursStatus(
  openTime: string,
  closeTime: string,
  now: Date = new Date(),
  cutoffMinutes: number = ONLINE_ORDER_CUTOFF_MINUTES,
): OnlineOrderHoursStatus {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = parseTimeToMinutes(openTime);
  const closeMinutes = parseTimeToMinutes(closeTime);
  const lastOrderMinutes = closeMinutes - cutoffMinutes;

  const openLabel = formatMinutesTo12h(openMinutes);
  const closeLabel = formatMinutesTo12h(closeMinutes);
  const lastOrderLabel = formatMinutesTo12h(lastOrderMinutes);

  const base = {
    openMinutes,
    closeMinutes,
    lastOrderMinutes,
    openLabel,
    closeLabel,
    lastOrderLabel,
  };

  if (openMinutes >= closeMinutes || lastOrderMinutes < openMinutes) {
    return {
      ...base,
      isOpen: false,
      reason: 'invalid_hours',
      message: 'Online ordering is temporarily unavailable. Please visit us in-store.',
    };
  }

  if (nowMinutes < openMinutes) {
    return {
      ...base,
      isOpen: false,
      reason: 'before_open',
      message: `Online orders open at ${openLabel}. We are not taking pickup orders yet.`,
    };
  }

  if (nowMinutes > lastOrderMinutes) {
    return {
      ...base,
      isOpen: false,
      reason: 'after_last_order',
      message: `Online ordering is closed. Last order time is ${lastOrderLabel} (${cutoffMinutes} minutes before we close at ${closeLabel}).`,
    };
  }

  return {
    ...base,
    isOpen: true,
    reason: 'open',
    message: `Order by ${lastOrderLabel} for same-day pickup (${openLabel} – ${closeLabel}).`,
  };
}
