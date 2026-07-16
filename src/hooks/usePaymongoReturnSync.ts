import { useCallback, useEffect, useRef, useState } from 'react';
import { verifyPaymongoCheckout } from '../lib/supabase/repositories/paymongo';
import { clearPendingPayment } from '../lib/pendingPayments';

type SyncState = 'idle' | 'syncing' | 'paid' | 'pending' | 'error';

type Options = {
  /** Guest verify needs shortCode; wait until tracked order loads. */
  ready?: boolean;
};

/**
 * After PayMongo redirects back with ?paymongo=success, poll verify until paid.
 * Longer window on mobile where webhooks / Safari resume can lag.
 */
export function usePaymongoReturnSync(
  orderId: string,
  shortCode: string | undefined,
  paymongoFlag: string | null,
  onPaid?: () => void | Promise<void>,
  options?: Options,
) {
  const ready = options?.ready ?? true;
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncError, setSyncError] = useState('');
  const ranForKeyRef = useRef<string | null>(null);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  const runSync = useCallback(async () => {
    if (!orderId) return false;
    setSyncState('syncing');
    setSyncError('');
    try {
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
    if (paymongoFlag !== 'success' || !orderId || !ready) return;
    // Include shortCode so guest verify re-runs once tracked order loads.
    const runKey = `${orderId}:success:${shortCode ?? ''}`;
    if (ranForKeyRef.current === runKey) return;
    ranForKeyRef.current = runKey;
    void runSync();
  }, [paymongoFlag, orderId, shortCode, ready, runSync]);

  const retrySync = useCallback(async () => {
    ranForKeyRef.current = null;
    return runSync();
  }, [runSync]);

  return { syncState, syncError, retrySync };
}
