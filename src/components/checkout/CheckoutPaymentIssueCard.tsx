import { AlertTriangle, Clock, RefreshCw, XCircle } from 'lucide-react';

type Issue = 'cancel' | 'expired' | 'error' | 'failed';

type Props = {
  issue: Issue;
  message?: string;
  onTryAgain?: () => void;
  onChangePayment?: () => void;
  tryAgainLabel?: string;
};

const COPY: Record<Issue, { title: string; body: string; Icon: typeof XCircle; tone: string }> = {
  cancel: {
    title: 'Payment cancelled',
    body: 'No charge was made. Try QR Ph again or choose another payment method.',
    Icon: XCircle,
    tone: 'border-amber-200 bg-amber-50 text-amber-950',
  },
  expired: {
    title: 'Payment session expired',
    body: 'Your QR Ph link timed out. Start a new payment or switch to GCash or cash.',
    Icon: Clock,
    tone: 'border-orange-200 bg-orange-50 text-orange-950',
  },
  error: {
    title: 'Payment could not be confirmed',
    body: 'We could not verify your payment yet. Retry confirmation or pay again.',
    Icon: AlertTriangle,
    tone: 'border-red-200 bg-red-50 text-red-950',
  },
  failed: {
    title: 'Payment failed',
    body: 'The payment did not go through. You can retry QR Ph securely — you will not be charged twice for a failed attempt.',
    Icon: AlertTriangle,
    tone: 'border-red-200 bg-red-50 text-red-950',
  },
};

export default function CheckoutPaymentIssueCard({
  issue,
  message,
  onTryAgain,
  onChangePayment,
  tryAgainLabel,
}: Props) {
  const { title, body, Icon, tone } = COPY[issue];
  const primaryLabel =
    tryAgainLabel ??
    (issue === 'failed' || issue === 'cancel' || issue === 'expired' ? 'Retry payment' : 'Try again');

  return (
    <div className={`rounded-2xl border px-4 py-4 text-sm space-y-3 ${tone}`} role="alert">
      <div>
        <p className="font-bold flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {title}
        </p>
        <p className="mt-1 text-xs leading-relaxed opacity-90">{message ?? body}</p>
      </div>
      {(onTryAgain || onChangePayment) && (
        <div className="flex flex-col sm:flex-row gap-2">
          {onTryAgain ? (
            <button
              type="button"
              onClick={onTryAgain}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-full bg-kado-red px-4 text-[10px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-dark touch-manipulation cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              {primaryLabel}
            </button>
          ) : null}
          {onChangePayment ? (
            <button
              type="button"
              onClick={onChangePayment}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-current/20 bg-white/80 px-4 text-[10px] font-black uppercase tracking-wider hover:bg-white touch-manipulation cursor-pointer"
            >
              Change payment method
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
