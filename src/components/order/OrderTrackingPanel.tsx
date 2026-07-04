import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Clock, Coffee, CookingPot, PackageCheck, RotateCcw, Sparkles, XCircle, Wallet } from 'lucide-react';
import type { OrderStatus } from '../../types/domain';
import { useGuestOrderTracking } from '../../hooks/useGuestOrderTracking';
import { canGuestCancelOrder, canGuestSwitchToCash } from '../../lib/orderStatus';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { broadcastGuestOrderUpdate } from '../../lib/supabase/guestOrderTracking';
import GuestOrderPaymentBlock from '../qr/GuestOrderPaymentBlock';
import GcashQrModal from '../GcashQrModal';
import { useSettingsStore } from '../../store/settingsStore';

type Channel = 'dine-in' | 'takeout';

type Props = {
  orderId: string;
  channel: Channel;
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
  contextLabel,
  isLoggedIn,
  onOrderAgain,
}: Props) {
  const gcashQrImage = useSettingsStore((s) => s.settings.gcashQrImage);
  const { tracked, loadFailed, isLive, refresh } = useGuestOrderTracking(orderId);
  const [gcashModalOpen, setGcashModalOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const openCancelConfirm = () => {
    setCancelError('');
    setCancelOpen(true);
  };

  const gcash = tracked?.paymentMethod === 'gcash-qr';
  const flowChannel = (tracked?.channel === 'takeout' ? 'takeout' : channel) as Channel;
  const steps =
    flowChannel === 'takeout'
      ? gcash
        ? GCASH_TAKEOUT_STEPS
        : TAKEOUT_STEPS
      : gcash
        ? GCASH_DINE_IN_STEPS
        : DINE_IN_STEPS;

  const status = tracked?.status ?? 'pending';
  const paymentStatus = tracked?.paymentStatus ?? 'unpaid';
  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';
  const currentRank = ORDER_RANK[status];
  const awaitingGcash = gcash && paymentStatus === 'unpaid';
  const canCancel =
    tracked != null &&
    canGuestCancelOrder({ status: tracked.status, channel: tracked.channel }) &&
    !isCancelled &&
    !isCompleted;
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

  const handleCancel = async () => {
    setCancelBusy(true);
    setCancelError('');
    try {
      await orderingRepo.cancelGuestOrder(orderId);
      void broadcastGuestOrderUpdate(orderId, {
        status: 'cancelled',
        paymentStatus: tracked?.paymentStatus ?? 'unpaid',
        updatedAt: new Date().toISOString(),
        shortCode: tracked?.shortCode,
      });
      await refresh();
      setCancelOpen(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel order. Please ask staff.');
    } finally {
      setCancelBusy(false);
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
    <div className="guest-order-page min-h-[100svh] bg-[#FAF7F2] flex flex-col items-center px-[max(1rem,env(safe-area-inset-left))] py-8 sm:py-14 pb-safe [@media(orientation:landscape)_and_(max-height:30rem)]:py-5">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 260 }}
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 mx-auto ${
            isCancelled ? 'bg-red-100' : awaitingGcash ? 'bg-amber-100' : 'bg-emerald-100'
          }`}
        >
          {isCancelled ? (
            <XCircle className="w-8 h-8 text-red-600" />
          ) : awaitingGcash ? (
            <Wallet className="w-8 h-8 text-amber-700" />
          ) : (
            <Check className="w-8 h-8 text-emerald-600" />
          )}
        </motion.div>

        <h1 className="font-display text-2xl sm:text-3xl font-black text-kado-dark text-center mb-2">
          {headline}
        </h1>
        <p className="text-kado-dark/60 text-sm text-center mb-5 leading-relaxed">{sub}</p>

        {tracked?.shortCode && (
          <div className="flex justify-center mb-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-kado-dark text-kado-cream px-4 py-2 text-sm font-black tracking-wider">
              <Coffee className="w-4 h-4" />
              {tracked.shortCode}
            </span>
          </div>
        )}

        {gcash && tracked && !isCancelled && (
          <GuestOrderPaymentBlock
            orderId={orderId}
            shortCode={tracked.shortCode}
            total={tracked.total}
            channel={flowChannel}
            paymentMethod={tracked.paymentMethod}
            paymentStatus={paymentStatus}
            onViewQr={() => setGcashModalOpen(true)}
            onProofSubmitted={() => void refresh()}
            canSwitchToCash={canSwitchToCash}
            onSwitchToCash={handleSwitchToCash}
            onRequestCancel={canCancel ? openCancelConfirm : undefined}
          />
        )}

        {!isCancelled && (
          <div className="rounded-2xl border border-kado-dark/10 bg-white p-5 sm:p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-kado-dark/45">
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
                            ? 'bg-emerald-500 text-white'
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
                            done ? 'bg-emerald-500/50' : 'bg-kado-dark/10'
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
              <div className="mt-1 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center text-xs font-bold text-emerald-800">
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

        {canCancel && (
          <div className="mb-3">
            {!cancelOpen ? (
              !gcash ? (
                <button
                  type="button"
                  onClick={openCancelConfirm}
                  className="w-full min-h-[44px] rounded-2xl border border-red-200 bg-white text-red-700 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors touch-manipulation"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel order
                </button>
              ) : null
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-900 mb-1">Cancel this order?</p>
                <p className="text-xs text-red-800/80 mb-3 leading-relaxed">
                  You can cancel while your order is still at &ldquo;Order received.&rdquo; This cannot be undone.
                </p>
                {cancelError ? (
                  <p className="text-xs font-semibold text-red-700 mb-3">{cancelError}</p>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={cancelBusy}
                    onClick={() => {
                      setCancelOpen(false);
                      setCancelError('');
                    }}
                    className="min-h-[44px] rounded-xl border border-red-200 bg-white text-red-800 text-[11px] font-bold uppercase tracking-wider touch-manipulation disabled:opacity-60"
                  >
                    Keep order
                  </button>
                  <button
                    type="button"
                    disabled={cancelBusy}
                    onClick={() => void handleCancel()}
                    className="min-h-[44px] rounded-xl bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider touch-manipulation disabled:opacity-60"
                  >
                    {cancelBusy ? 'Cancelling…' : 'Yes, cancel'}
                  </button>
                </div>
              </div>
            )}
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
