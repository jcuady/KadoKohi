import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Clock,
  Coffee,
  CreditCard,
  Loader2,
  MapPin,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import { orderingRepo, type TrackedOrderStatus } from '../lib/supabase/repositories/ordering';
import { formatPhp } from '../lib/money';
import {
  awaitsGatewayPayment,
  isGcashOrder,
  isPaymongoOrder,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../lib/orderStatus';
import PaymongoPaymentPanel from '../components/PaymongoPaymentPanel';
import GuestOrderPaymentBlock from '../components/qr/GuestOrderPaymentBlock';
import GcashQrModal from '../components/GcashQrModal';
import CheckoutPushPrompt from '../components/CheckoutPushPrompt';
import CheckoutOrderActions from '../components/checkout/CheckoutOrderActions';
import CheckoutPaymentIssueCard from '../components/checkout/CheckoutPaymentIssueCard';
import { clearPendingPayment, getPendingPayment, rememberPendingPayment } from '../lib/pendingPayments';
import { usePaymongoReturnSync } from '../hooks/usePaymongoReturnSync';
import { verifyPaymongoCheckout } from '../lib/supabase/repositories/paymongo';
import type { GuestOrderAction } from '../lib/guestOrderActions';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { useSettingsStore } from '../store/settingsStore';
import { useBranchStore } from '../store/branchStore';
import type { Order } from '../types/domain';
import { formatOrderError } from '../lib/validation';
import { subscribeGuestOrderTracking } from '../lib/supabase/guestOrderTracking';
import {
  consolidateOrderItemsForDisplay,
  type ConsolidatedOrderLine,
} from '../lib/orderLineDisplay';

function OrderLinesList({ lines }: { lines: ConsolidatedOrderLine[] }) {
  return (
    <ul className="divide-y divide-kado-dark/8">
      {lines.map((it) => (
        <li key={it.key} className="flex justify-between gap-3 py-2.5 text-sm">
          <span className="min-w-0">
            <span className="block truncate font-medium text-kado-dark">
              {it.qty}× {it.name}
            </span>
            {it.detail ? (
              <span className="mt-0.5 block truncate text-[11px] text-kado-dark/45">{it.detail}</span>
            ) : null}
          </span>
          <span className="shrink-0 font-semibold text-kado-dark/65">{formatPhp(it.lineTotal)}</span>
        </li>
      ))}
    </ul>
  );
}
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

function CheckoutSteps({
  active,
}: {
  active: 'pay' | 'confirming' | 'done';
}) {
  const steps = [
    { id: 'placed', label: 'Order placed' },
    { id: 'pay', label: 'Pay' },
    { id: 'done', label: 'Confirmed' },
  ] as const;
  // pay → step 2; confirming/done → step 3 (confirming keeps Confirmed as current)
  const activeIdx = active === 'pay' ? 1 : 2;
  const allDone = active === 'done';

  return (
    <ol className="mt-5 flex items-center gap-1 sm:gap-2" aria-label="Checkout progress">
      {steps.map((step, i) => {
        const done = allDone || i < activeIdx;
        const current = !allDone && i === activeIdx;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-1 sm:gap-2 min-w-0">
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <span
                className={[
                  'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-[10px] font-black transition-colors',
                  done || current
                    ? 'bg-kado-red text-kado-cream'
                    : 'bg-kado-dark/10 text-kado-dark/40',
                  current && active === 'confirming' ? 'ring-2 ring-kado-red/25 ring-offset-2 ring-offset-white' : '',
                ].join(' ')}
              >
                {done && !current ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
              <span
                className={[
                  'text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center leading-tight',
                  done || current ? 'text-kado-dark' : 'text-kado-dark/35',
                ].join(' ')}
              >
                {active === 'confirming' && i === 2 ? 'Confirming…' : step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mb-5 h-0.5 w-full max-w-[2.5rem] sm:max-w-[3.5rem] shrink rounded-full ${
                  i < activeIdx || allDone ? 'bg-kado-red' : 'bg-kado-dark/10'
                }`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function Checkout() {
  const { orderId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo =
    typeof (location.state as { from?: unknown } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : null;
  const user = useAuthStore((s) => s.user);
  const hydrateForCustomer = useOrderStore((s) => s.hydrateForCustomer);
  const storeOrders = useOrderStore((s) => s.orders);
  const gcashQrImage = useSettingsStore((s) => s.settings.gcashQrImage ?? '');
  const branches = useBranchStore((s) => s.branches);

  const [tracked, setTracked] = useState<TrackedOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [openMethodPicker, setOpenMethodPicker] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState<number | null>(null);
  const orderActionsRef = useRef<HTMLDivElement>(null);
  const payPanelRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const paymongoFlag = searchParams.get('paymongo');
  const pendingLocal = orderId ? getPendingPayment(orderId) : null;

  const branchLabel = useMemo(() => {
    const branchId = tracked?.branchId ?? storeOrders.find((o) => o.id === orderId)?.branchId;
    if (!branchId) return '';
    return branches.find((b) => b.id === branchId)?.name ?? '';
  }, [branches, storeOrders, orderId, tracked?.branchId]);

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
    } else if (next && (next.paymentStatus === 'paid' || next.status === 'cancelled')) {
      clearPendingPayment(next.id);
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
    const handle = subscribeGuestOrderTracking(orderId, (next) => {
      setTracked(next);
      if (next.paymentStatus === 'paid' || next.status === 'cancelled') clearPendingPayment(orderId);
    });
    return () => handle.stop();
  }, [orderId]);

  useEffect(() => {
    const prev = document.title;
    const code = tracked?.shortCode ?? pendingLocal?.shortCode;
    document.title = code
      ? `Checkout ${code} · Kado Kohi`
      : 'Checkout · Kado Kohi';
    return () => {
      document.title = prev;
    };
  }, [tracked?.shortCode, pendingLocal?.shortCode]);

  useEffect(() => {
    if (paymongoFlag === 'success') return;
    if (!orderId || !tracked || !isPaymongoOrder(tracked) || tracked.paymentStatus !== 'unpaid') return;
    let cancelled = false;
    (async () => {
      try {
        const result = await verifyPaymongoCheckout({ orderId, shortCode: tracked.shortCode });
        if (!cancelled && result.sessionStatus === 'expired') setSessionExpired(true);
      } catch {
        // best-effort probe
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, tracked?.paymentMethod, tracked?.paymentStatus, tracked?.shortCode, paymongoFlag]);

  useEffect(() => {
    if (!paymongoFlag) return;
    // Keep success flag until sync finishes so confirmation UI can bind to it;
    // clear cancel quickly; clear success after paid or after a longer window.
    if (paymongoFlag === 'cancel') {
      const t = window.setTimeout(() => {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete('paymongo');
            return next;
          },
          { replace: true },
        );
      }, 12000);
      return () => window.clearTimeout(t);
    }
  }, [paymongoFlag, setSearchParams]);

  const order = useMemo(
    () => (tracked ? trackedToOrder(tracked, tracked.branchId ?? '') : null),
    [tracked],
  );
  const displayLines = useMemo(
    () => (tracked ? consolidateOrderItemsForDisplay(tracked.items) : []),
    [tracked],
  );
  const isCancelled = tracked?.status === 'cancelled';
  const unpaidGateway =
    tracked != null &&
    !isCancelled &&
    awaitsGatewayPayment(tracked) &&
    tracked.paymentStatus === 'unpaid';
  const proofPending =
    tracked != null &&
    !isCancelled &&
    isGcashOrder(tracked) &&
    tracked.paymentStatus === 'proof_submitted';
  const canPay =
    tracked != null &&
    !isCancelled &&
    awaitsGatewayPayment(tracked) &&
    (tracked.paymentStatus === 'unpaid' || tracked.paymentStatus === 'proof_submitted');
  const shortCode = tracked?.shortCode ?? pendingLocal?.shortCode ?? '';
  const syncReady = Boolean(tracked?.shortCode) || Boolean(user?.id);

  const checkoutReturn = `${window.location.origin}/checkout/${encodeURIComponent(orderId)}`;

  const onPaidSync = useCallback(async () => {
    await refresh();
    if (user?.id) await hydrateForCustomer(user.id);
    setSessionExpired(false);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('paymongo');
        return next;
      },
      { replace: true },
    );
  }, [refresh, user?.id, hydrateForCustomer, setSearchParams]);

  const { syncState, syncError, retrySync } = usePaymongoReturnSync(
    orderId,
    shortCode || undefined,
    paymongoFlag,
    onPaidSync,
    { ready: syncReady },
  );

  const paymentConfirmed = tracked?.paymentStatus === 'paid' || syncState === 'paid';
  const confirming =
    !paymentConfirmed &&
    (syncState === 'syncing' || (paymongoFlag === 'success' && syncState !== 'error'));

  const stepActive: 'pay' | 'confirming' | 'done' = paymentConfirmed
    ? 'done'
    : confirming
      ? 'confirming'
      : 'pay';

  const showStickyPay = Boolean(
    order && isPaymongoOrder(order) && canPay && !paymentConfirmed && unpaidGateway && !confirming,
  );

  useEffect(() => {
    if (!confirming && !paymentConfirmed && paymongoFlag !== 'cancel') return;
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [confirming, paymentConfirmed, paymongoFlag]);

  useEffect(() => {
    if (!paymentConfirmed || user?.role !== 'customer') {
      setRedirectSeconds(null);
      return;
    }
    let left = 3;
    setRedirectSeconds(left);
    const tick = window.setInterval(() => {
      left -= 1;
      setRedirectSeconds(left);
      if (left <= 0) {
        window.clearInterval(tick);
        navigate(`/account/orders?placed=${encodeURIComponent(orderId)}`, { replace: true });
      }
    }, 1000);
    return () => window.clearInterval(tick);
  }, [paymentConfirmed, user?.role, navigate, orderId]);

  const guestHome =
    returnTo ||
    (tracked?.channel === 'takeout'
      ? '/order/takeout'
      : tracked?.channel === 'dine-in'
        ? '/menu'
        : '/menu');

  const handleOrderCancelled = useCallback(
    async (action: GuestOrderAction) => {
      await refresh();
      clearPendingPayment(orderId);
      if (action !== 'change_order') return;
      navigate(returnTo || (tracked?.channel === 'takeout' ? '/order/takeout' : '/menu'));
    },
    [orderId, refresh, navigate, tracked?.channel, returnTo],
  );

  const scrollToOrderActions = useCallback(() => {
    setOpenMethodPicker(true);
    window.setTimeout(() => {
      orderActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }, []);

  const scrollToPayPanel = useCallback(() => {
    setSessionExpired(false);
    window.setTimeout(() => {
      payPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }, []);

  const retryPayment = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('paymongo');
        return next;
      },
      { replace: true },
    );
    setSessionExpired(false);
    scrollToPayPanel();
  }, [setSearchParams, scrollToPayPanel]);

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-white flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-kado-dark/10 border-t-kado-red" />
          <p className="text-xs font-bold uppercase tracking-wider text-kado-dark/45">Loading checkout…</p>
        </div>
      </div>
    );
  }

  if (error || !tracked || !order) {
    return (
      <div className="min-h-[60vh] bg-white px-4 py-16">
        <div className="mx-auto max-w-lg text-center rounded-2xl border border-kado-dark/10 bg-kado-offwhite p-8">
          <XCircle className="mx-auto h-10 w-10 text-kado-red/70 mb-3" aria-hidden />
          <h1 className="font-display text-2xl font-bold text-kado-dark">Checkout unavailable</h1>
          <p className="mt-2 text-sm text-kado-dark/55 leading-relaxed">
            {error || 'We could not find that order. Check your link or open it from notifications.'}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            {error ? (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setLoading(true);
                  void refresh()
                    .catch((err) => setError(formatOrderError(err)))
                    .finally(() => setLoading(false));
                }}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-kado-red px-6 text-[11px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-dark"
              >
                Try again
              </button>
            ) : null}
            <Link
              to="/menu"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-kado-dark/15 bg-white px-6 text-[11px] font-black uppercase tracking-wider text-kado-dark hover:border-kado-red/40"
            >
              Back to menu
            </Link>
            {user?.role === 'customer' && (
              <Link
                to="/account/orders"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-kado-dark/15 bg-white px-6 text-[11px] font-black uppercase tracking-wider text-kado-dark"
              >
                My orders
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={topRef}
      className={[
        'min-h-[calc(100dvh-var(--public-nav-height,3.5rem))] bg-kado-offwhite',
        showStickyPay ? 'pb-[max(9.5rem,calc(8.5rem+env(safe-area-inset-bottom)))]' : 'pb-safe',
      ].join(' ')}
    >
      <div className="mx-auto max-w-lg px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-5 sm:py-10">
        <button
          type="button"
          onClick={() => {
            if (returnTo) navigate(returnTo);
            else if (window.history.length > 1) navigate(-1);
            else navigate(guestHome);
          }}
          className="mb-4 inline-flex min-h-[44px] items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-kado-dark/55 hover:text-kado-dark touch-manipulation cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back
        </button>

        {/* ── Confirmation state ── */}
        {paymentConfirmed ? (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-5"
            aria-live="polite"
          >
            <div className="rounded-2xl border border-kado-dark/8 bg-kado-dark px-5 py-8 sm:px-8 sm:py-10 text-center relative overflow-hidden">
              <span
                className="pointer-events-none absolute -right-2 top-2 font-display text-[5.5rem] leading-none text-kado-cream/[0.06] select-none"
                aria-hidden
              >
                角
              </span>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-kado-cream text-kado-red">
                <CheckCircle2 className="h-8 w-8" aria-hidden />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-cream/55">Payment confirmed</p>
              <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-kado-cream tracking-tight">
                Salamat — order received
              </h1>
              <p className="mt-2 text-sm text-kado-cream/70 leading-relaxed max-w-sm mx-auto">
                Order <span className="font-mono font-bold text-kado-cream">{tracked.shortCode}</span> is paid and
                queued. We’ll brew it next.
              </p>
              {redirectSeconds != null && redirectSeconds > 0 ? (
                <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-kado-cream/50">
                  Opening your orders in {redirectSeconds}…
                </p>
              ) : null}
            </div>

            <CheckoutSteps active="done" />

            <div className="rounded-2xl border border-kado-dark/10 bg-white p-4 sm:p-5 space-y-3">
              <div className="flex justify-between items-baseline gap-3">
                <span className="text-sm text-kado-dark/55">Amount paid</span>
                <span className="font-display font-bold text-xl text-kado-red">{formatPhp(tracked.total)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-800">
                  <CheckCircle2 className="h-3 w-3" aria-hidden /> Paid
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-kado-offwhite border border-kado-dark/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-kado-dark/60">
                  <Coffee className="h-3 w-3" aria-hidden /> {ORDER_STATUS_LABELS[tracked.status] ?? tracked.status}
                </span>
                {branchLabel ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-kado-offwhite border border-kado-dark/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-kado-dark/60">
                    <MapPin className="h-3 w-3" aria-hidden /> {branchLabel}
                  </span>
                ) : null}
              </div>
              <OrderLinesList lines={displayLines} />
            </div>

            <div className="rounded-2xl border border-kado-dark/10 bg-kado-offwhite p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/50 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-kado-red" aria-hidden />
                What happens next
              </p>
              <ul className="space-y-2 text-sm text-kado-dark/65 leading-relaxed">
                <li>1. Baristas prepare your order in queue order.</li>
                <li>2. You’ll get updates when it’s brewing and ready for pickup.</li>
                <li>3. Stamps unlock when the order is marked complete.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              {user?.role === 'customer' ? (
                <Link
                  to={`/account/orders?placed=${encodeURIComponent(orderId)}`}
                  replace
                  className="flex-1 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-kado-red px-5 text-[11px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-dark transition-colors"
                >
                  Track my order
                </Link>
              ) : (
                <p className="flex-1 rounded-2xl border border-kado-dark/10 bg-white px-4 py-3 text-center text-xs text-kado-dark/60 leading-relaxed">
                  Keep this page open or save order{' '}
                  <span className="font-mono font-bold text-kado-dark">{tracked.shortCode}</span> — status updates
                  live here.
                </p>
              )}
              <Link
                to={returnTo || '/menu'}
                className="flex-1 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border-2 border-kado-dark/15 bg-white px-5 text-[11px] font-black uppercase tracking-wider text-kado-dark hover:border-kado-red/40 transition-colors"
              >
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                {returnTo?.includes('/order/') ? 'Back to ordering' : 'Continue shopping'}
              </Link>
            </div>
          </motion.section>
        ) : (
          /* ── Pay / sync / cancel states ── */
          <section className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-kado-red">Checkout</p>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-kado-dark tracking-tight">
                {isCancelled
                  ? 'Order cancelled'
                  : proofPending
                    ? 'Proof under review'
                    : confirming
                      ? 'Confirming payment'
                      : 'Complete your payment'}
              </h1>
              <p className="mt-1.5 text-sm text-kado-dark/55 leading-relaxed">
                Order <span className="font-mono font-bold text-kado-dark">{tracked.shortCode}</span>
                {' · '}
                {PAYMENT_STATUS_LABELS[tracked.paymentStatus] ?? tracked.paymentStatus}
                {branchLabel ? ` · ${branchLabel}` : ''}
              </p>
            </div>

            {!isCancelled && <CheckoutSteps active={stepActive} />}

            {confirming && (
              <div
                className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950 space-y-2"
                role="status"
                aria-live="polite"
              >
                <p className="font-bold flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                  {syncState === 'syncing' || syncState === 'idle'
                    ? 'Confirming your QR Ph payment…'
                    : 'Almost there — still syncing'}
                </p>
                <p className="text-xs leading-relaxed text-sky-900/80">
                  PayMongo reported success. We’re updating your order — this usually takes a few seconds.
                </p>
                {(syncState === 'pending' || syncState === 'error') && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void retrySync()}
                      className="min-h-[48px] rounded-full bg-sky-800 px-4 text-[10px] font-black uppercase tracking-wider text-white touch-manipulation cursor-pointer"
                    >
                      {syncState === 'error' ? 'Retry confirmation' : 'Check payment status'}
                    </button>
                    {unpaidGateway ? (
                      <button
                        type="button"
                        onClick={retryPayment}
                        className="min-h-[48px] rounded-full border border-sky-300 bg-white px-4 text-[10px] font-black uppercase tracking-wider text-sky-950 touch-manipulation cursor-pointer"
                      >
                        Retry payment
                      </button>
                    ) : null}
                  </div>
                )}
                {syncError ? <p className="text-xs font-semibold text-red-700">{syncError}</p> : null}
              </div>
            )}

            {syncState === 'error' && !paymentConfirmed && !confirming && (
              <CheckoutPaymentIssueCard
                issue="error"
                message={syncError || undefined}
                onTryAgain={() => void retrySync()}
                onChangePayment={scrollToOrderActions}
                tryAgainLabel="Retry confirmation"
              />
            )}

            {paymongoFlag === 'cancel' && !paymentConfirmed && !confirming && (
              <CheckoutPaymentIssueCard
                issue="failed"
                onTryAgain={isPaymongoOrder(tracked) ? retryPayment : scrollToOrderActions}
                onChangePayment={scrollToOrderActions}
                tryAgainLabel="Retry payment"
              />
            )}

            {sessionExpired && !paymentConfirmed && !confirming && paymongoFlag !== 'cancel' && (
              <CheckoutPaymentIssueCard
                issue="expired"
                onTryAgain={retryPayment}
                onChangePayment={scrollToOrderActions}
              />
            )}

            {isCancelled && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-950">
                <p className="font-bold flex items-center gap-2">
                  <XCircle className="h-4 w-4" aria-hidden /> This order was cancelled
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  Payment is closed for this order. Place a new order from the menu if you still want your drinks.
                </p>
              </div>
            )}

            {proofPending && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4 text-sm text-violet-950">
                <p className="font-bold">GCash proof received</p>
                <p className="mt-1 text-xs leading-relaxed">
                  Staff are verifying your payment. You’ll see status updates once it’s approved — no need to pay
                  again.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-kado-dark/10 bg-white p-4 sm:p-5 space-y-3">
              <div className="flex justify-between text-sm items-baseline">
                <span className="text-kado-dark/55">Total due</span>
                <span className="font-display font-bold text-xl text-kado-red">{formatPhp(tracked.total)}</span>
              </div>
              <OrderLinesList lines={displayLines} />
            </div>

            {isPaymongoOrder(tracked) && unpaidGateway && !confirming && (
              <div className="rounded-xl border border-kado-red/15 bg-kado-red/[0.06] px-4 py-3 text-xs text-kado-dark/70 flex gap-2.5">
                <CreditCard className="h-4 w-4 shrink-0 text-kado-red mt-0.5" aria-hidden />
                <p className="leading-relaxed">
                  Pay with any QR Ph bank or e-wallet. After you pay, you’ll return here for confirmation — keep this
                  tab handy.
                </p>
              </div>
            )}

            {isPaymongoOrder(order) && canPay && !paymentConfirmed && !confirming && (
              <div ref={payPanelRef}>
                <PaymongoPaymentPanel
                  order={order}
                  shortCode={shortCode}
                  successUrl={`${checkoutReturn}?paymongo=success`}
                  cancelUrl={`${checkoutReturn}?paymongo=cancel`}
                  stickyMobile
                />
              </div>
            )}

            {isGcashOrder(tracked) && canPay && (
              <GuestOrderPaymentBlock
                orderId={tracked.id}
                shortCode={tracked.shortCode}
                total={tracked.total}
                channel={tracked.channel}
                branchId={tracked.branchId}
                paymentMethod={tracked.paymentMethod}
                paymentStatus={tracked.paymentStatus}
                onViewQr={() => setQrOpen(true)}
                onProofSubmitted={() => {
                  void refresh();
                }}
              />
            )}

            {unpaidGateway && !paymentConfirmed && !confirming && !isCancelled && (
              <div ref={orderActionsRef}>
                <CheckoutOrderActions
                  orderId={tracked.id}
                  shortCode={tracked.shortCode}
                  channel={tracked.channel}
                  paymentMethod={tracked.paymentMethod}
                  paymentStatus={tracked.paymentStatus}
                  hasPaymentProof={tracked.hasPaymentProof}
                  isCustomer={user?.role === 'customer'}
                  onUpdated={() => {
                    setSessionExpired(false);
                    return refresh();
                  }}
                  onCancelled={handleOrderCancelled}
                  openMethodPicker={openMethodPicker}
                  onMethodPickerOpened={() => setOpenMethodPicker(false)}
                />
              </div>
            )}

            {unpaidGateway && !paymentConfirmed && !confirming && user?.role === 'customer' && (
              <div className="rounded-2xl border border-kado-dark/10 bg-white p-4 sm:p-5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/50 flex items-center gap-1.5">
                  <BellRing className="h-3.5 w-3.5 text-kado-red" aria-hidden />
                  Payment reminders
                </p>
                <p className="text-xs text-kado-dark/55 leading-relaxed">
                  Turn on alerts so we can nudge you back here if payment is still pending.
                </p>
                <CheckoutPushPrompt />
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Link
                to="/menu"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-kado-dark/15 bg-white px-5 text-[11px] font-black uppercase tracking-wider text-kado-dark hover:border-kado-red/40 transition-colors"
              >
                Continue shopping
              </Link>
              {user?.role === 'customer' && (
                <Link
                  to="/account/orders"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-kado-dark px-5 text-[11px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-red transition-colors"
                >
                  My orders
                </Link>
              )}
            </div>
          </section>
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
