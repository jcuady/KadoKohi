import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { getPushStatus, subscribeToPush, unsubscribeFromPush } from '../lib/push';

type Status = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'idle';

interface Props {
  /** Compact pill style (for toolbars) vs full card. */
  variant?: 'card' | 'pill';
  label?: string;
}

export default function NotificationOptIn({ variant = 'card', label = 'Order notifications' }: Props) {
  const [status, setStatus] = useState<Status>('loading');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void getPushStatus().then((s) => mounted && setStatus(s));
    return () => {
      mounted = false;
    };
  }, []);

  const enable = async () => {
    setBusy(true);
    setMessage(null);
    const res = await subscribeToPush();
    if (res.ok) {
      setStatus('subscribed');
      setMessage('Notifications enabled on this device.');
    } else {
      const reasons: Record<string, string> = {
        unsupported: 'This device/browser does not support push notifications.',
        'missing-vapid': 'Push is not configured. Contact support.',
        'not-signed-in': 'Please sign in first.',
        denied: 'Notifications were blocked. Enable them in your browser settings.',
        'no-sw': 'Service worker not ready. Reload and try again.',
        'bad-subscription': 'Could not create a subscription. Try again.',
      };
      setStatus(res.reason === 'denied' ? 'denied' : status);
      setMessage(reasons[res.reason ?? ''] ?? 'Could not enable notifications.');
    }
    setBusy(false);
  };

  const disable = async () => {
    setBusy(true);
    setMessage(null);
    await unsubscribeFromPush();
    setStatus('idle');
    setMessage('Notifications turned off on this device.');
    setBusy(false);
  };

  if (status === 'unsupported') {
    if (variant === 'pill') return null;
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500 flex items-center gap-2">
        <BellOff className="w-4 h-4" /> Push notifications aren't supported on this browser.
      </div>
    );
  }

  if (variant === 'pill') {
    const on = status === 'subscribed';
    return (
      <button
        type="button"
        onClick={on ? disable : enable}
        disabled={busy || status === 'loading'}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition-colors disabled:opacity-60 ${
          on
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
        }`}
        title={on ? 'Notifications on' : 'Enable notifications'}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : on ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
        {on ? 'Alerts on' : 'Alerts'}
      </button>
    );
  }

  const on = status === 'subscribed';
  return (
    <div className="rounded-2xl border border-kado-dark/10 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${on ? 'bg-green-100 text-green-700' : 'bg-kado-red/10 text-kado-red'}`}>
            {on ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </div>
          <div>
            <p className="font-bold text-sm text-kado-dark">{label}</p>
            <p className="text-xs text-kado-dark/60 mt-0.5 max-w-sm">
              Get a push notification on this device for every update — confirmed, brewing, and ready for pickup.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={on ? disable : enable}
          disabled={busy || status === 'loading' || status === 'denied'}
          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-60 ${
            on ? 'border border-kado-dark/15 text-kado-dark hover:bg-kado-cream' : 'bg-kado-red text-white hover:bg-kado-dark'
          }`}
        >
          {busy ? 'Working…' : on ? 'Turn off' : 'Enable'}
        </button>
      </div>
      {status === 'denied' && (
        <p className="mt-3 text-[11px] text-amber-700">
          Notifications are blocked in your browser. Allow them in site settings, then reload.
        </p>
      )}
      {message && <p className="mt-3 text-[11px] text-kado-dark/60">{message}</p>}
    </div>
  );
}
