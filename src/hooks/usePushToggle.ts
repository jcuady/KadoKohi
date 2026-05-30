import { useCallback, useEffect, useState } from 'react';
import { getPushStatus, subscribeToPush, unsubscribeFromPush } from '../lib/push';

export type PushUiStatus = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'idle';

export type PushFeedback = {
  type: 'success' | 'error' | 'info';
  message: string;
};

const REASON_MESSAGES: Record<string, string> = {
  unsupported: 'Push notifications are not supported on this browser.',
  'missing-vapid': 'Push is not configured on the server. Contact your administrator.',
  'not-signed-in': 'Sign in to enable notifications on this device.',
  denied: 'Notifications are blocked. Allow them in your browser site settings, then try again.',
  'no-sw': 'The app is still loading. Refresh the page and try again.',
  'bad-subscription': 'Could not register this device. Please try again.',
};


const SUCCESS_OFF = 'Notifications turned off for this device.';
const BARISTA_SUCCESS_ON = "Order alerts enabled — we'll notify you for new orders and payment proofs.";
const CUSTOMER_SUCCESS_ON = "You're all set — we'll notify you when your order status changes.";

export function usePushToggle(audience: 'customer' | 'staff' = 'customer') {
  const [status, setStatus] = useState<PushUiStatus>('loading');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<PushFeedback | null>(null);

  const refresh = useCallback(async () => {
    const next = await getPushStatus();
    setStatus(next);
    return next;
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  const enable = useCallback(async () => {
    setBusy(true);
    setFeedback(null);
    const res = await subscribeToPush();
    if (res.ok) {
      setStatus('subscribed');
      setFeedback({
        type: 'success',
        message:
          audience === 'staff'
            ? BARISTA_SUCCESS_ON
            : CUSTOMER_SUCCESS_ON,
      });
    } else {
      if (res.reason === 'denied') setStatus('denied');
      setFeedback({
        type: 'error',
        message: REASON_MESSAGES[res.reason ?? ''] ?? 'Could not enable notifications.',
      });
    }
    setBusy(false);
  }, [audience]);

  const disable = useCallback(async () => {
    setBusy(true);
    setFeedback(null);
    await unsubscribeFromPush();
    setStatus('idle');
    setFeedback({ type: 'info', message: SUCCESS_OFF });
    setBusy(false);
  }, []);

  const toggle = useCallback(async () => {
    if (status === 'subscribed') await disable();
    else await enable();
  }, [disable, enable, status]);

  return {
    enabled: status === 'subscribed',
    status,
    busy,
    feedback,
    toggle,
    enable,
    disable,
    refresh,
    clearFeedback: () => setFeedback(null),
  };
}
