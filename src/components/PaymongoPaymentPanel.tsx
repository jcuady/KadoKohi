import { useState } from 'react';
import { CreditCard } from 'lucide-react';
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
};

export default function PaymongoPaymentPanel({ order, shortCode, successUrl, cancelUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isPaymongoOrder(order)) return null;
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
    return (
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 sm:p-4">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-800">QR Ph paid</p>
        <p className="mt-1 text-xs text-emerald-900/80">Payment confirmed via PayMongo QR Ph.</p>
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
      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(formatOrderError(err));
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-kado-red/15 bg-kado-offwhite p-3.5 sm:p-4 space-y-3">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-kado-red">QR Ph payment</p>
      <p className="text-xs sm:text-sm text-kado-dark/55 leading-relaxed">
        Pay {formatPhp(order.total)} with any bank or e-wallet app that supports QR Ph. Transaction fees are
        covered by Kado Kohi — you pay the order total only.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={() => void pay()}
        className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-kado-red text-kado-cream py-3.5 px-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-50 transition-colors touch-manipulation"
      >
        <CreditCard className="w-4 h-4 shrink-0" />
        {loading ? 'Opening PayMongo…' : 'Pay with QR Ph'}
      </button>
      {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
