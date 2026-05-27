import { useEffect, useMemo, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { getOnlineOrderHoursStatus } from '../lib/onlineOrderHours';

/** Live online-order window from admin default hours (re-checks every 30s). */
export function useOnlineOrderHours() {
  const openTime = useSettingsStore((s) => s.settings.defaultOpenTime);
  const closeTime = useSettingsStore((s) => s.settings.defaultCloseTime);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(
    () => getOnlineOrderHoursStatus(openTime, closeTime, now),
    [openTime, closeTime, now],
  );
}
