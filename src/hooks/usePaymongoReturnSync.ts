import { useCallback, useEffect, useRef, useState } from 'react';
import { verifyPaymongoCheckout } from '../lib/supabase/repositories/paymongo';
import { clearPendingPayment } from '../lib/pendingPayments';

type SyncState = 'idle' | 'syncing' | 'paid' | 'pending' | 'error';

/**
 * After PayMongo redirects back with ?paymongo=success, poll verify until paid.
 * Longer window on mobile where webhooks / Safari resume can lag.
 */
export function usePaymongoReturnSync(
  orderId: string,
  shortCode: string | undefined,
  paymongoFlag: string | null,
  onPaid?: () => void | Promise<void>,
) {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncError, setSyncError] = useState('');
  const ranForFlagRef = useRef<string | null>(null);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  const runSync = useCallback(async () => {
    if (!orderId) return false;
    setSyncState('syncing');
    setSyncError('');
    try {
      // ~20s total — covers mobile app-switch + webhook lag
      for (let attempt = 0; attempt < 12; attempt++) {
        const result = await verifyPaymongoCheckout({ orderId, shortCode });
        if (result.paid) {
          clearPendingPayment(orderId);
          setSyncState('paid');
          await onPaidRef.current?.();
          return true;
        }
        if (attempt < 11) {
          await new Promise((r) => window.setTimeout(r, 1600));
        }
      }
      setSyncState('pending');
      return false;
    } catch (err) {
      setSyncState('error');
      setSyncError(err instanceof Error ? err.message : 'Could not confirm payment.');
      return false;
    }
  }, [orderId, shortCode]);

  useEffect(() => {
    if (paymongoFlag !== 'success' || !orderId) return;
    const runKey = `${orderId}:success`;
    if (ranForFlagRef.current === runKey) return;
    ranForFlagRef.current = runKey;
    void runSync();
  }, [paymongoFlag, orderId, runSync]);

  const retrySync = useCallback(async () => {
    ranForFlagRef.current = null;
    return runSync();
  }, [runSync]);

  return { syncState, syncError, retrySync };
}
