import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Clock, Coffee, CookingPot, PackageCheck, Pencil, RotateCcw, Sparkles, Wallet, XCircle } from 'lucide-react';
import type { OrderStatus } from '../../types/domain';
import { useGuestOrderTracking } from '../../hooks/useGuestOrderTracking';
import {
  awaitsGatewayPayment,
  canGuestModifyOrder,
  canGuestSwitchToCash,
  guestModifyBlockedMessage,
  isGcashOrder,
  isPaymongoOrder,
} from '../../lib/orderStatus';
import type { GuestOrderAction, GuestOrderActionReason } from '../../lib/guestOrderActions';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { broadcastGuestOrderUpdate } from '../../lib/supabase/guestOrderTracking';
import { getTrackedOrder } from '../../lib/guestOrders';
import GuestOrderPaymentBlock from '../qr/GuestOrderPaymentBlock';
import GcashQrModal from '../GcashQrModal';
import OrderTrackingSummary from './OrderTrackingSummary';
import GuestOrderActionSheet from './GuestOrderActionSheet';
import { formatOrderError } from '../../lib/validation';
import { useSettingsStore } from '../../store/settingsStore';
import BrandHybridMark from '../BrandHybridMark';
import { checkoutPath, clearPendingPayment } from '../../lib/pendingPayments';

type Channel = 'dine-in' | 'takeout';

type Props = {
  orderId: string;
  channel: Channel;
  /** Session key for local order snapshot (table QR or takeout branch). */
  sessionKey: string;
  /** Table label (dine-in) or pickup name (takeout). */
  contextLabel: string;
  /** Hide the sign-in CTA when the customer is already logged in. */
  isLoggedIn: boolean;
  onOrderAgain: () => void;
};

type Step = { status: OrderStatus; label: string; Icon: typeof Clock };

const DINE_IN_STEPS: Step[] = [
  { status: 'pending', label: 'Order received', Icon: Clock },
  { status: 'accepted', label: 'Accepted', Icon: Check },
  { status: 'preparing', label: 'Preparing', Icon: CookingPot },
  { status: 'ready', label: 'Ready', Icon: Coffee },
  { status: 'served', label: 'Served', Icon: PackageCheck },
];

const TAKEOUT_STEPS: Step[] = [
  { status: 'pending', label: 'Order received', Icon: Clock },
  { status: 'accepted', label: 'Accepted', Icon: Check },
  { status: 'preparing', label: 'Preparing', Icon: CookingPot },
  { status: 'ready', label: 'Ready for pickup', Icon: PackageCheck },
];

const GCASH_DINE_IN_STEPS: Step[] = [
  { status: 'pending', label: 'Order received', Icon: Clock },
  { status: 'accepted', label: 'Payment verified', Icon: Wallet },
  { status: 'preparing', label: 'Preparing', Icon: CookingPot },
  { status: 'ready', label: 'Ready', Icon: Coffee },
  { status: 'served', label: 'Served', Icon: PackageCheck },
];

const GCASH_TAKEOUT_STEPS: Step[] = [
  { status: 'pending', label: 'Order received', Icon: Clock },
  { status: 'accepted', label: 'Payment verified', Icon: Wallet },
  { status: 'preparing', label: 'Preparing', Icon: CookingPot },
  { status: 'ready', label: 'Ready for pickup', Icon: PackageCheck },
];

const ORDER_RANK: Record<OrderStatus, number> = {
  pending: 0,
  accepted: 1,
  preparing: 2,
  ready: 3,
  served: 4,
  completed: 5,
  cancelled: -1,
};

export default function OrderTrackingPanel({
  orderId,
  channel,
  sessionKey,
  contextLabel,
  isLoggedIn,
  onOrderAgain,
}: Props) {
  const taxRate = useSettingsStore((s) => s.settings.taxRate);
  const gcashQrImage = useSettingsStore((s) => s.settings.gcashQrImage);
  const localSnapshot = useMemo(
    () => getTrackedOrder(sessionKey)?.snapshot ?? null,
    [sessionKey, orderId],
  );
  const { tracked, loadFailed, isLive, refresh } = useGuestOrderTracking(orderId);
  const [gcashModalOpen, setGcashModalOpen] = useState(false);
  const [actionPanel, setActionPanel] = useState<GuestOrderAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const openAction = (action: GuestOrderAction) => {
    setActionError('');
    setActionPanel(action);
  };

  const closeAction = () => {
    if (actionBusy) return;
    setActionPanel(null);
    setActionError('');
  };

  const gcash = tracked ? isGcashOrder(tracked) : false;
  const paymongo = tracked ? isPaymongoOrder(tracked) : false;
  const gateway = tracked ? awaitsGatewayPayment(tracked) : false;
  const flowChannel = (tracked?.channel === 'takeout' ? 'takeout' : channel) as Channel;
  const steps =
    flowChannel === 'takeout'
      ? gateway
        ? GCASH_TAKEOUT_STEPS
        : TAKEOUT_STEPS
      : gateway
        ? GCASH_DINE_IN_STEPS
        : DINE_IN_STEPS;

  const status = tracked?.status ?? 'pending';
  const paymentStatus = tracked?.paymentStatus ?? 'unpaid';
  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';
  const currentRank = ORDER_RANK[status];
  const awaitingGcash = gateway && paymentStatus === 'unpaid';
  const modifyCtx =
    tracked != null
      ? {
          status: tracked.status,
          channel: tracked.channel,
          paymentMethod: tracked.paymentMethod,
          paymentStatus,
          hasPaymentProof: tracked.hasPaymentProof,
        }
      : null;
  const canModify =
    modifyCtx != null && canGuestModifyOrder(modifyCtx) && !isCancelled && !isCompleted;
  const modifyBlocked = modifyCtx ? guestModifyBlockedMessage(modifyCtx) : null;
  const canSwitchToCash =
    tracked != null &&
    canGuestSwitchToCash({
      status: tracked.status,
      channel: tracked.channel,
      paymentMethod: tracked.paymentMethod,
      paymentStatus,
    }) &&
    !isCancelled &&
    !isCompleted;

  const handleSwitchToCash = async () => {
    await orderingRepo.switchGuestOrderToCash(orderId);
    void broadcastGuestOrderUpdate(orderId, {
      status: tracked?.status ?? 'pending',
      paymentStatus: 'paid',
      updatedAt: new Date().toISOString(),
      shortCode: tracked?.shortCode,
    });
    await refresh();
  };

  const handleGuestAction = async (
    action: GuestOrderAction,
    reason: GuestOrderActionReason,
    note?: string,
  ) => {
    setActionBusy(true);
    setActionError('');
    try {
      await orderingRepo.cancelGuestOrder(orderId, { action, reason, note });
      clearPendingPayment(orderId);
      void broadcastGuestOrderUpdate(orderId, {
        status: 'cancelled',
        paymentStatus: tracked?.paymentStatus ?? 'unpaid',
        updatedAt: new Date().toISOString(),
        shortCode: tracked?.shortCode,
      });
      if (action === 'change_order') {
        setActionPanel(null);
        onOrderAgain();
        return;
      }
      await refresh();
      setActionPanel(null);
    } catch (err) {
      setActionError(formatOrderError(err));
    } finally {
      setActionBusy(false);
    }
  };

  const headline = isCancelled
    ? 'Order cancelled'
    : isCompleted
      ? 'Order complete'
      : awaitingGcash
        ? 'Complete GCash payment'
        : flowChannel === 'takeout'
          ? 'Takeout order placed!'
          : 'Order sent!';

  const sub = isCancelled
    ? 'This order was cancelled. Please ask our staff if you need help.'
    : awaitingGcash
      ? 'Scan the GCash QR, pay the total, then upload your receipt below.'
      : flowChannel === 'takeout'
        ? <>We&apos;ll call out <strong>{contextLabel}</strong> when it&apos;s ready for pickup.</>
        : <>Your dine-in order for <strong>{contextLabel}</strong> is with the barista.</>;

  return (
    <div className="qr-root customer-surface guest-order-page min-h-[100svh] bg-[var(--qr-bg)] text-[var(--qr-text)] flex flex-col items-center px-[max(1rem,env(safe-area-inset-left))] py-6 sm:py-10 pb-safe [@media(orientation:landscape)_and_(max-height:30rem)]:py-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <BrandHybridMark size="md" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-kado-red">
            {flowChannel === 'takeout' ? 'Takeout' : 'Dine-in'} · Order tracking
          </p>
        </div>

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 260 }}
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto ${
            isCancelled ? 'bg-red-100' : awaitingGcash ? 'bg-kado-cream' : 'bg-kado-red/10'
          }`}
        >
          {isCancelled ? (
            <XCircle className="w-7 h-7 text-red-600" />
          ) : awaitingGcash ? (
            <Wallet className="w-7 h-7 text-kado-red" />
          ) : (
            <Check className="w-7 h-7 text-kado-red stroke-[3]" />
          )}
        </motion.div>

        <h1 className="font-display text-2xl sm:text-[1.65rem] font-black qr-text text-center mb-2 leading-tight">
          {headline}
        </h1>
        <p className="text-[var(--qr-text-muted)] text-sm text-center mb-4 leading-relaxed">{sub}</p>

        {tracked?.shortCode && (
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-kado-dark text-kado-cream px-4 py-2 text-sm font-black tracking-wider">
              <Coffee className="w-4 h-4 text-kado-cream/90" />
              {tracked.shortCode}
            </span>
          </div>
        )}

        <OrderTrackingSummary tracked={tracked} snapshot={localSnapshot} taxRate={taxRate} />

        {gcash && tracked && !isCancelled && (
          <>
            <GuestOrderPaymentBlock
              orderId={orderId}
              shortCode={tracked.shortCode}
              total={tracked.total}
              channel={flowChannel}
              branchId={tracked.branchId}
              paymentMethod={tracked.paymentMethod}
              paymentStatus={paymentStatus}
              onViewQr={() => setGcashModalOpen(true)}
              onProofSubmitted={() => void refresh()}
              canSwitchToCash={canSwitchToCash}
              onSwitchToCash={handleSwitchToCash}
              onRequestChange={canModify && !actionPanel ? () => openAction('change_order') : undefined}
              onRequestCancel={canModify && !actionPanel ? () => openAction('cancel') : undefined}
            />
            {actionPanel && canModify ? (
              <GuestOrderActionSheet
                action={actionPanel}
                busy={actionBusy}
                error={actionError}
                onClose={closeAction}
                onConfirm={(reason, note) => void handleGuestAction(actionPanel, reason, note)}
              />
            ) : null}
          </>
        )}

        {paymongo && tracked && !isCancelled && paymentStatus === 'unpaid' && (
          <div className="mb-4 rounded-2xl border border-kado-red/20 bg-white p-4 space-y-3">
            <p className="text-sm font-bold text-kado-dark">QR Ph payment pending</p>
            <p className="text-xs text-kado-dark/55 leading-relaxed">
              Complete payment on our secure checkout page. You can also change payment method or cancel there
              while unpaid.
            </p>
            <Link
              to={checkoutPath(orderId)}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-kado-red px-4 text-[11px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-dark"
            >
              Continue to checkout
            </Link>
            {(canSwitchToCash || canModify) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {canSwitchToCash ? (
                  <button
                    type="button"
                    onClick={() => void handleSwitchToCash()}
                    className="qr-field min-h-[44px] rounded-xl px-4 text-[10px] font-bold uppercase tracking-wider"
                  >
                    Switch to cash
                  </button>
                ) : null}
                {canModify && !actionPanel ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openAction('change_order')}
                      className="qr-field min-h-[44px] rounded-xl px-4 text-[10px] font-bold uppercase tracking-wider"
                    >
                      Change order
                    </button>
                    <button
                      type="button"
                      onClick={() => openAction('cancel')}
                      className="qr-field min-h-[44px] rounded-xl px-4 text-[10px] font-bold uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  </>
                ) : null}
              </div>
            )}
            {actionPanel && canModify ? (
              <GuestOrderActionSheet
                action={actionPanel}
                busy={actionBusy}
                error={actionError}
                onClose={closeAction}
                onConfirm={(reason, note) => void handleGuestAction(actionPanel, reason, note)}
              />
            ) : null}
          </div>
        )}

        {!isCancelled && (
          <div className="qr-surface-card rounded-2xl p-5 sm:p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="qr-text-subtle text-[10px] font-black uppercase tracking-widest">
                Order status
              </p>
              {!isCompleted && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-kado-red">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLive ? 'bg-kado-red' : 'bg-kado-dark/30'}`} />
                  {isLive ? 'Live' : 'Updating…'}
                </span>
              )}
            </div>

            <ol className="space-y-0">
              {steps.map((step, i) => {
                const rank = ORDER_RANK[step.status];
                const done = isCompleted || currentRank > rank;
                const active = !isCompleted && currentRank === rank;
                const last = i === steps.length - 1;
                return (
                  <li key={step.status} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          done
                            ? 'bg-kado-dark text-kado-cream'
                            : active
                              ? 'bg-kado-red text-white shadow-[0_0_0_4px_rgba(158,24,29,0.12)]'
                              : 'bg-kado-dark/8 text-kado-dark/35'
                        }`}
                      >
                        {done ? (
                          <Check className="w-4 h-4 shrink-0 stroke-[3]" aria-hidden />
                        ) : (
                          <step.Icon className="w-4 h-4 shrink-0" aria-hidden />
                        )}
                      </div>
                      {!last && (
                        <div
                          className={`w-0.5 flex-1 min-h-[1.25rem] my-0.5 ${
                            done ? 'bg-kado-dark/35' : 'bg-kado-dark/10'
                          }`}
                        />
                      )}
                    </div>
                    <div className={`min-w-0 ${last ? 'pb-0' : 'pb-4'} pt-1.5`}>
                      <p
                        className={`text-sm font-bold leading-snug ${
                          active ? 'text-kado-red' : done ? 'text-kado-dark' : 'text-kado-dark/40'
                        }`}
                      >
                        {step.label}
                      </p>
                      {active && (
                        <p className="text-[11px] text-kado-dark/45 mt-0.5 leading-relaxed">
                          {awaitingGcash && step.status === 'pending'
                            ? 'Awaiting GCash payment…'
                            : 'In progress…'}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {isCompleted && (
              <div className="mt-1 rounded-xl bg-kado-cream/60 border border-kado-red/15 px-4 py-3 text-center text-xs font-bold text-kado-dark">
                Enjoy your coffee!
              </div>
            )}
            {loadFailed && !tracked && (
              <p className="text-center text-[11px] text-kado-dark/45 mt-2">
                Status updates will appear here shortly…
              </p>
            )}
          </div>
        )}

        {!isLoggedIn && (
          <div className="rounded-2xl border border-kado-red/15 bg-kado-red/[0.04] p-5 mb-4">
            <div className="flex items-start gap-2.5 mb-3">
              <Sparkles className="w-4 h-4 text-kado-red shrink-0 mt-0.5" />
              <p className="text-xs text-kado-dark/70 leading-relaxed">
                <strong className="text-kado-dark">Stay connected &amp; earn stamps.</strong> Create an
                account or log in to track your orders and collect loyalty rewards — totally optional.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/auth/signup"
                className="min-h-[44px] rounded-xl bg-kado-red text-kado-cream flex items-center justify-center text-[11px] font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors"
              >
                Create account
              </Link>
              <Link
                to="/auth/login"
                className="min-h-[44px] rounded-xl border border-kado-dark/15 bg-white text-kado-dark flex items-center justify-center text-[11px] font-bold uppercase tracking-wider hover:border-kado-red/40 transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>
        )}

        {(canModify || modifyBlocked) && !isCancelled && !isCompleted && !gateway && (
          <div className="mb-3">
            {actionPanel ? (
              <GuestOrderActionSheet
                action={actionPanel}
                busy={actionBusy}
                error={actionError}
                onClose={closeAction}
                onConfirm={(reason, note) => void handleGuestAction(actionPanel, reason, note)}
              />
            ) : canModify ? (
              <div className="rounded-2xl border border-kado-dark/10 bg-white p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-kado-dark/45">
                  Need to change something?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openAction('change_order')}
                    className="min-h-[44px] rounded-xl border border-kado-dark/12 bg-kado-offwhite text-kado-dark flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:border-kado-red/30 touch-manipulation"
                  >
                    <Pencil className="w-4 h-4 text-kado-red shrink-0" />
                    Change order
                  </button>
                  <button
                    type="button"
                    onClick={() => openAction('cancel')}
                    className="min-h-[44px] rounded-xl border border-red-200 bg-white text-red-700 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 touch-manipulation"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    Cancel order
                  </button>
                </div>
                <p className="text-[10px] text-kado-dark/40 leading-relaxed">
                  Available only before payment is submitted. GCash orders cannot be changed after you
                  upload proof.
                </p>
              </div>
            ) : modifyBlocked ? (
              <p className="text-[11px] text-kado-dark/50 text-center leading-relaxed px-2">
                {modifyBlocked}
              </p>
            ) : null}
          </div>
        )}

        <button
          type="button"
          onClick={onOrderAgain}
          className="w-full min-h-[48px] rounded-2xl bg-kado-dark text-kado-cream flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors touch-manipulation"
        >
          <RotateCcw className="w-4 h-4" />
          Order again
        </button>
      </div>

      <GcashQrModal
        open={gcashModalOpen}
        onClose={() => setGcashModalOpen(false)}
        shortCode={tracked?.shortCode ?? '—'}
        total={tracked?.total ?? 0}
        qrImageUrl={gcashQrImage}
        actionLabel="Done"
      />
    </div>
  );
}
