import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BellRing, CheckCircle2, CreditCard, QrCode } from 'lucide-react';
import { orderingRepo, type TrackedOrderStatus } from '../lib/supabase/repositories/ordering';
import { formatPhp } from '../lib/money';
import {
  awaitsGatewayPayment,
  isGcashOrder,
  isPaymongoOrder,
  PAYMENT_STATUS_LABELS,
} from '../lib/orderStatus';
import PaymongoPaymentPanel from '../components/PaymongoPaymentPanel';
import GuestOrderPaymentBlock from '../components/qr/GuestOrderPaymentBlock';
import GcashQrModal from '../components/GcashQrModal';
import NotificationToggle from '../components/NotificationToggle';
import { clearPendingPayment, getPendingPayment, rememberPendingPayment } from '../lib/pendingPayments';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import type { Order } from '../types/domain';
import { formatOrderError } from '../lib/validation';
import { subscribeGuestOrderTracking } from '../lib/supabase/guestOrderTracking';

function trackedToOrder(tracked: TrackedOrderStatus, branchId = ''): Order {
  return {
    id: tracked.id,
    shortCode: tracked.shortCode,
    channel: tracked.channel,
    branchId,
    guestName: tracked.guestName,
    paymentMethod: tracked.paymentMethod,
    paymentStatus: tracked.paymentStatus,
    status: tracked.status,
    items: tracked.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productNameSnapshot: it.productNameSnapshot,
      milkLabelSnapshot: it.milkLabelSnapshot,
      sizeLabelSnapshot: it.sizeLabelSnapshot,
      temperature: it.temperature as Order['items'][number]['temperature'],
      unitPrice: it.unitPrice,
      qty: it.qty,
      lineTotal: it.lineTotal,
    })),
    subtotal: tracked.subtotal,
    modifiersTotal: tracked.modifiersTotal,
    tax: tracked.tax,
    total: tracked.total,
    createdAt: tracked.createdAt,
    updatedAt: tracked.updatedAt,
  };
}

export default function Checkout() {
  const { orderId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const gcashQrImage = useSettingsStore((s) => s.settings.gcashQrImage ?? '');

  const [tracked, setTracked] = useState<TrackedOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrOpen, setQrOpen] = useState(false);

  const paymongoFlag = searchParams.get('paymongo');
  const pendingLocal = orderId ? getPendingPayment(orderId) : null;

  const refresh = useCallback(async () => {
    if (!orderId) return;
    const next = await orderingRepo.trackOrder(orderId);
    setTracked(next);
    if (next && awaitsGatewayPayment(next) && next.paymentStatus === 'unpaid') {
      rememberPendingPayment({
        orderId: next.id,
        shortCode: next.shortCode,
        paymentMethod: next.paymentMethod,
        total: next.total,
        channel: next.channel,
        placedAt: next.createdAt,
      });
    } else if (next && (next.paymentStatus === 'paid' || next.paymentStatus === 'proof_submitted')) {
      if (next.paymentStatus === 'paid') clearPendingPayment(next.id);
    }
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!orderId) {
        setError('Missing order.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) setError(formatOrderError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, refresh]);

  useEffect(() => {
    if (!orderId) return;
    return subscribeGuestOrderTracking(orderId, (next) => {
      setTracked(next);
      if (next.paymentStatus === 'paid') clearPendingPayment(orderId);
    });
  }, [orderId]);

  useEffect(() => {
    if (!paymongoFlag) return;
    const t = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('paymongo');
          return next;
        },
        { replace: true },
      );
    }, 8000);
    return () => window.clearTimeout(t);
  }, [paymongoFlag, setSearchParams]);

  const order = useMemo(() => (tracked ? trackedToOrder(tracked) : null), [tracked]);
  const unpaidGateway =
    tracked != null &&
    tracked.status !== 'cancelled' &&
    awaitsGatewayPayment(tracked) &&
    tracked.paymentStatus === 'unpaid';
  const canPay =
    tracked != null &&
    tracked.status !== 'cancelled' &&
    awaitsGatewayPayment(tracked) &&
    (tracked.paymentStatus === 'unpaid' || tracked.paymentStatus === 'proof_submitted');
  const shortCode = tracked?.shortCode ?? pendingLocal?.shortCode ?? '';

  const checkoutReturn = `${window.location.origin}/checkout/${encodeURIComponent(orderId)}`;

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kado-dark/10 border-t-kado-red" />
      </div>
    );
  }

  if (error || !tracked || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-kado-dark">Checkout unavailable</h1>
        <p className="mt-2 text-sm text-kado-dark/55">
          {error || 'We could not find that order. Check your link or open it from notifications.'}
        </p>
        <Link to="/menu" className="mt-6 inline-flex text-sm font-bold text-kado-red hover:underline">
          Back to menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex min-h-[44px] items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-kado-dark/55 hover:text-kado-dark"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-kado-red">Checkout</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-kado-dark sm:text-3xl">
        {unpaidGateway ? 'Complete your payment' : 'Order status'}
      </h1>
      <p className="mt-1 text-sm text-kado-dark/55">
        Order <span className="font-mono font-bold text-kado-dark">{tracked.shortCode}</span>
        {' · '}
        {PAYMENT_STATUS_LABELS[tracked.paymentStatus] ?? tracked.paymentStatus}
      </p>

      {paymongoFlag === 'success' && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Payment submitted
          </p>
          <p className="mt-1 text-xs leading-relaxed">
            If QR Ph succeeded, this page updates when PayMongo confirms. Keep this tab open or check notifications.
          </p>
        </div>
      )}
      {paymongoFlag === 'cancel' && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-bold">Payment cancelled</p>
          <p className="mt-1 text-xs leading-relaxed">No charge was made. You can retry QR Ph below anytime.</p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-kado-dark/10 bg-white p-4 shadow-sm space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-kado-dark/55">Total due</span>
          <span className="font-display font-bold text-kado-red">{formatPhp(tracked.total)}</span>
        </div>
        <ul className="divide-y divide-kado-dark/8">
          {tracked.items.map((it) => (
            <li key={it.id} className="flex justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 truncate text-kado-dark">
                {it.qty}× {it.productNameSnapshot}
              </span>
              <span className="shrink-0 font-semibold text-kado-dark/70">{formatPhp(it.lineTotal)}</span>
            </li>
          ))}
        </ul>
      </div>

      {isPaymongoOrder(tracked) && unpaidGateway && (
        <div className="mt-4 rounded-xl border border-kado-red/15 bg-kado-red/5 px-4 py-3 text-xs text-kado-dark/70 flex gap-2">
          <CreditCard className="h-4 w-4 shrink-0 text-kado-red mt-0.5" />
          <p className="leading-relaxed">
            Pay with any QR Ph bank or e-wallet. Fees are on us — tap below to open the secure PayMongo screen,
            then you&apos;ll return here.
          </p>
        </div>
      )}

      {isPaymongoOrder(order) && canPay && (
        <PaymongoPaymentPanel
          order={order}
          shortCode={shortCode}
          successUrl={`${checkoutReturn}?paymongo=success`}
          cancelUrl={`${checkoutReturn}?paymongo=cancel`}
        />
      )}

      {isGcashOrder(tracked) && canPay && (
        <GuestOrderPaymentBlock
          orderId={tracked.id}
          shortCode={tracked.shortCode}
          total={tracked.total}
          channel={tracked.channel}
          paymentMethod={tracked.paymentMethod}
          paymentStatus={tracked.paymentStatus}
          onViewQr={() => setQrOpen(true)}
          onProofSubmitted={() => {
            void refresh();
          }}
        />
      )}

      {unpaidGateway && (
        <div className="mt-6 rounded-2xl border border-kado-dark/10 bg-kado-offwhite p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 flex items-center gap-1.5">
            <BellRing className="h-3.5 w-3.5 text-kado-red" />
            Payment reminders
          </p>
          <p className="text-xs text-kado-dark/60 leading-relaxed">
            Enable push notifications so we can remind you if payment is still pending — and guide you back here.
          </p>
          <NotificationToggle variant="profile" audience="customer" />
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Link
          to="/menu"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-kado-dark/15 px-5 text-xs font-bold uppercase tracking-wider text-kado-dark hover:border-kado-red/40"
        >
          Continue shopping
        </Link>
        {user?.role === 'customer' && (
          <Link
            to="/account/orders"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-kado-dark px-5 text-xs font-bold uppercase tracking-wider text-kado-cream hover:bg-kado-red"
          >
            <QrCode className="h-3.5 w-3.5" />
            My orders
          </Link>
        )}
      </div>

      <GcashQrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        shortCode={tracked.shortCode}
        total={tracked.total}
        qrImageUrl={gcashQrImage}
      />
    </div>
  );
}
