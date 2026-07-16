import { useState } from 'react';
import { CreditCard, ExternalLink, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import type { Order } from '../types/domain';
import { formatPhp } from '../lib/money';
import { isPaymongoOrder } from '../lib/orderStatus';
import { createPaymongoCheckout } from '../lib/supabase/repositories/paymongo';
import { formatOrderError } from '../lib/validation';

type Props = {
  order: Order;
  /** When set (guest QR), required to create checkout. */
  shortCode?: string;
  successUrl?: string;
  cancelUrl?: string;
  /** Show sticky mobile pay bar (checkout page). */
  stickyMobile?: boolean;
};

export default function PaymongoPaymentPanel({
  order,
  shortCode,
  successUrl,
  cancelUrl,
  stickyMobile = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isPaymongoOrder(order)) return null;
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
    return (
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50 p-4 sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800">QR Ph paid</p>
        <p className="mt-1.5 text-sm text-emerald-900/80 leading-relaxed">
          Payment confirmed via PayMongo QR Ph.
        </p>
      </div>
    );
  }

  const pay = async () => {
    setLoading(true);
    setError(null);
    try {
      const { checkoutUrl } = await createPaymongoCheckout({
        orderId: order.id,
        shortCode: shortCode ?? order.shortCode,
        successUrl,
        cancelUrl,
      });
      // Same-tab assign keeps mobile return URL reliable (no popup blockers).
      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(formatOrderError(err));
      setLoading(false);
    }
  };

  const payButton = (
    <button
      type="button"
      disabled={loading}
      onClick={() => void pay()}
      aria-busy={loading}
      className="w-full min-h-[52px] flex items-center justify-center gap-2 rounded-xl bg-kado-red text-kado-cream py-3.5 px-4 text-[11px] font-black uppercase tracking-wider hover:bg-kado-dark disabled:opacity-50 transition-colors touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40 focus-visible:ring-offset-2"
    >
      {loading ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <CreditCard className="w-4 h-4 shrink-0" />}
      {loading ? 'Opening secure checkout…' : `Pay ${formatPhp(order.total)} with QR Ph`}
    </button>
  );

  return (
    <>
      <div className="rounded-2xl border border-kado-red/20 bg-white p-4 sm:p-5 space-y-4 shadow-[0_8px_24px_rgba(158,24,29,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-kado-red">QR Ph payment</p>
            <p className="mt-1.5 text-sm text-kado-dark/60 leading-relaxed">
              Pay {formatPhp(order.total)} with any bank or e-wallet that supports QR Ph. Fees are covered by
              Kado Kohi — you only pay the order total.
            </p>
          </div>
          <ShieldCheck className="h-5 w-5 shrink-0 text-kado-red/50" aria-hidden />
        </div>

        <ol className="space-y-2.5 rounded-xl bg-kado-offwhite/90 border border-kado-dark/8 px-3.5 py-3.5">
          {[
            'Tap Pay to open the secure PayMongo screen.',
            'Scan the QR Ph code with your bank or e-wallet app.',
            'You’ll return here automatically — we’ll confirm payment.',
          ].map((step, i) => (
            <li key={step} className="flex gap-3 text-xs text-kado-dark/70 leading-snug">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-kado-red text-[10px] font-black text-kado-cream">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className={stickyMobile ? 'hidden sm:block' : undefined}>{payButton}</div>

        <p className="flex items-center gap-1.5 text-[11px] text-kado-dark/45 leading-snug">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
          You’ll leave briefly for PayMongo, then come back to this page.
        </p>

        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 space-y-2.5"
            role="alert"
          >
            <p className="text-sm font-semibold text-red-800 leading-snug">{error}</p>
            <button
              type="button"
              disabled={loading}
              onClick={() => void pay()}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full bg-kado-red px-4 text-[10px] font-black uppercase tracking-wider text-kado-cream touch-manipulation disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Retry payment
            </button>
          </div>
        ) : null}
      </div>

      {stickyMobile && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-kado-dark/10 bg-white/95 backdrop-blur-md sm:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] shadow-[0_-8px_24px_rgba(25,25,25,0.08)]">
          <div className="mx-auto max-w-lg flex items-center justify-between gap-3 mb-2">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-kado-dark/45">Total due</p>
              <p className="font-display font-bold text-lg text-kado-red leading-tight">{formatPhp(order.total)}</p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-kado-dark/40 shrink-0">
              {order.shortCode}
            </p>
          </div>
          {payButton}
          {error ? (
            <p className="mt-2 text-xs font-semibold text-red-600 text-center" role="alert">
              {error} — tap above to retry.
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}
