import { useEffect, useState } from 'react';

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number };

const ZERO: CountdownParts = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function useCountdown(isoDate: string | undefined): CountdownParts {
  const [timeLeft, setTimeLeft] = useState<CountdownParts>(ZERO);

  useEffect(() => {
    if (!isoDate) {
      setTimeLeft(ZERO);
      return;
    }
    const target = new Date(isoDate).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft(ZERO);
        return false;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
      return true;
    };

    if (!tick()) return;

    const id = window.setInterval(() => {
      if (!tick()) window.clearInterval(id);
    }, 1000);

    return () => window.clearInterval(id);
  }, [isoDate]);

  return timeLeft;
}

export function formatCountdown(parts: CountdownParts): string {
  if (parts.days > 0) return `${parts.days}d ${parts.hours}h ${parts.minutes}m`;
  if (parts.hours > 0) return `${parts.hours}h ${parts.minutes}m ${parts.seconds}s`;
  return `${parts.minutes}m ${parts.seconds}s`;
}
