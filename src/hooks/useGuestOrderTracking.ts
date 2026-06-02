import { useEffect, useState } from 'react';
import { subscribeGuestOrderTracking } from '../lib/supabase/guestOrderTracking';
import { orderingRepo, type TrackedOrderStatus } from '../lib/supabase/repositories/ordering';

export function useGuestOrderTracking(orderId: string) {
  const [tracked, setTracked] = useState<TrackedOrderStatus | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const refreshNow = async () => {
    try {
      const next = await orderingRepo.trackOrder(orderId);
      if (next) {
        setTracked(next);
        setLoadFailed(false);
      }
    } catch {
      setLoadFailed(true);
    }
  };

  useEffect(() => {
    setTracked(null);
    setLoadFailed(false);
    setIsLive(false);

    const handle = subscribeGuestOrderTracking(
      orderId,
      (next) => {
        setTracked(next);
        setLoadFailed(false);
      },
      () => {
        setLoadFailed(true);
      },
    );

    const liveTimer = setInterval(() => setIsLive(handle.isLive()), 1000);

    return () => {
      clearInterval(liveTimer);
      handle.stop();
    };
  }, [orderId]);

  return { tracked, loadFailed, isLive, refresh: refreshNow };
}
