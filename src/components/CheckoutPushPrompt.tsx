import { BellRing, CheckCircle2, Loader2 } from 'lucide-react';
import { usePushToggle } from '../hooks/usePushToggle';

/** One-tap browser permission prompt for checkout payment reminders. */
export default function CheckoutPushPrompt() {
  const { enabled, status, busy, feedback, enable } = usePushToggle('customer');

  if (status === 'unsupported' || status === 'loading') return null;

  if (enabled) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[11px] font-medium text-emerald-800 leading-snug">
        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
        <span>Alerts are on for this device — we’ll notify you about payment and order updates.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy || status === 'denied'}
        onClick={() => void enable()}
        className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border-2 border-kado-red/25 bg-white px-4 text-[11px] font-black uppercase tracking-wider text-kado-red hover:bg-kado-red/5 disabled:opacity-50 transition-colors touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40 focus-visible:ring-offset-2"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <BellRing className="h-4 w-4" aria-hidden />
        )}
        {status === 'denied' ? 'Notifications blocked in browser' : 'Enable payment alerts'}
      </button>
      {feedback ? (
        <p
          className={`text-[11px] font-medium leading-snug ${
            feedback.type === 'error' ? 'text-red-600' : 'text-emerald-700'
          }`}
          role="status"
        >
          {feedback.message}
        </p>
      ) : status === 'denied' ? (
        <p className="text-[11px] text-amber-800/80 leading-snug">
          Allow notifications in your browser site settings for this page, then tap again.
        </p>
      ) : (
        <p className="text-[11px] text-kado-dark/50 leading-snug">
          Tap to open your browser&apos;s permission popup — we&apos;ll remind you if payment is still pending.
        </p>
      )}
    </div>
  );
}
