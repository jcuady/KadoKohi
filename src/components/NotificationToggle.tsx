import { Bell, BellOff, BellRing, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';
import { usePushToggle, type PushFeedback } from '../hooks/usePushToggle';

type Variant = 'sidebar' | 'card' | 'profile';

type Props = {
  variant?: Variant;
  /** customer = order updates; staff = new orders & payment proofs */
  audience?: 'customer' | 'staff';
  label?: string;
  description?: string;
};

function FeedbackBanner({ feedback }: { feedback: PushFeedback }) {
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800',
  } as const;
  const Icon = feedback.type === 'success' ? CheckCircle2 : feedback.type === 'error' ? AlertCircle : Info;

  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-medium leading-snug ${styles[feedback.type]}`}>
      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{feedback.message}</span>
    </div>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  busy,
  onToggle,
  id,
}: {
  checked: boolean;
  disabled: boolean;
  busy: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-busy={busy}
      disabled={disabled || busy}
      onClick={onToggle}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40 focus-visible:ring-offset-2',
        disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer',
        checked ? 'bg-emerald-500' : 'bg-kado-dark/20',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[1.35rem]' : 'translate-x-0.5',
        ].join(' ')}
      >
        {busy ? (
          <Loader2 className="w-3 h-3 animate-spin text-kado-dark/50" />
        ) : checked ? (
          <BellRing className="w-3 h-3 text-emerald-600" />
        ) : (
          <Bell className="w-3 h-3 text-kado-dark/35" />
        )}
      </span>
    </button>
  );
}

export default function NotificationToggle({
  variant = 'card',
  audience = 'customer',
  label,
  description,
}: Props) {
  const { enabled, status, busy, feedback, toggle } = usePushToggle(audience);

  const title =
    label ??
    (audience === 'staff' ? 'Order alerts' : 'Push notifications');

  const subtitle =
    description ??
    (audience === 'staff'
      ? 'New orders, payment proofs, and status changes — delivered to this device.'
      : 'Get notified when your order is confirmed, brewing, and ready for pickup.');

  const switchDisabled = status === 'unsupported' || status === 'loading' || status === 'denied';
  const switchId = `kado-notif-toggle-${variant}`;

  if (status === 'unsupported' && variant === 'sidebar') {
    return (
      <div className="px-3 py-2 text-[11px] text-[var(--color-dash-text-muted)] flex items-center gap-2 opacity-60">
        <BellOff className="w-4 h-4 shrink-0" />
        <span>Alerts unavailable</span>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className="space-y-2 px-1">
        <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-[var(--color-dash-hover)] transition-colors">
          <label htmlFor={switchId} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                enabled ? 'bg-emerald-500/15 text-emerald-600' : 'bg-[var(--color-dash-hover)] text-[var(--color-dash-text-muted)]'
              }`}
            >
              {enabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-[var(--color-dash-text)]">{title}</span>
              <span className="block text-[10px] leading-snug text-[var(--color-dash-text-muted)]">
                {enabled ? 'On for this device' : 'Tap to enable'}
              </span>
            </span>
          </label>
          <ToggleSwitch
            id={switchId}
            checked={enabled}
            disabled={switchDisabled}
            busy={busy}
            onToggle={() => void toggle()}
          />
        </div>
        {status === 'denied' && (
          <p className="px-2 text-[10px] leading-snug text-amber-600">
            Blocked in browser settings — allow notifications for this site, then reload.
          </p>
        )}
        {feedback && <div className="px-1"><FeedbackBanner feedback={feedback} /></div>}
      </div>
    );
  }

  if (status === 'unsupported') {
    return (
      <div className="rounded-2xl border border-kado-dark/10 bg-[#FAF7F2] p-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kado-dark/5 text-kado-dark/40">
          <BellOff className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm text-kado-dark">{title}</p>
          <p className="text-xs text-kado-dark/55 mt-1 leading-relaxed">
            Push notifications aren't supported on this browser. Try Chrome or Edge on mobile for the best experience.
          </p>
        </div>
      </div>
    );
  }

  const isProfile = variant === 'profile';

  return (
    <div className={`rounded-2xl border overflow-hidden ${isProfile ? 'border-kado-dark/8 bg-white' : 'border-kado-dark/10 bg-white'}`}>
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-kado-red/10 text-kado-red'
            }`}
          >
            {enabled ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-base text-kado-dark">{title}</p>
            <p className="text-xs text-kado-dark/55 mt-1 leading-relaxed max-w-md">{subtitle}</p>
            {enabled && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active on this device
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
          <ToggleSwitch
            id={switchId}
            checked={enabled}
            disabled={switchDisabled}
            busy={busy}
            onToggle={() => void toggle()}
          />
          <span className="text-[9px] font-bold uppercase tracking-widest text-kado-dark/35">
            {enabled ? 'On' : 'Off'}
          </span>
        </div>
      </div>

      {status === 'denied' && (
        <div className="px-5 sm:px-6 pb-4">
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-[11px] font-medium text-amber-900">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Notifications are blocked. Open your browser's site settings for Kado Kohi, allow notifications, then toggle on again.
            </span>
          </div>
        </div>
      )}

      {feedback && (
        <div className="px-5 sm:px-6 pb-5">
          <FeedbackBanner feedback={feedback} />
        </div>
      )}

      {isProfile && (
        <div className="border-t border-kado-dark/5 bg-[#FAF7F2] px-5 sm:px-6 py-3">
          <p className="text-[10px] text-kado-dark/45 leading-relaxed">
            You'll receive professional updates for each step — received, confirmed, brewing, ready, and complete.
            Stamps are included when your order finishes.
          </p>
        </div>
      )}
    </div>
  );
}
