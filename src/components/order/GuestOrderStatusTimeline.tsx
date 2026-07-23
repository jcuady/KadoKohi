import { Check, Clock, Coffee, CookingPot, PackageCheck, Wallet } from 'lucide-react';
import type { OrderChannel, OrderStatus, PaymentMethod } from '../../types/domain';
import { awaitsGatewayPayment } from '../../lib/orderStatus';

type Step = { status: OrderStatus; label: string; Icon: typeof Clock };

const ONLINE_STEPS: Step[] = [
  { status: 'pending', label: 'Order received', Icon: Clock },
  { status: 'accepted', label: 'Queued', Icon: Check },
  { status: 'preparing', label: 'Preparing', Icon: CookingPot },
  { status: 'ready', label: 'Ready for pickup', Icon: PackageCheck },
];

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

const GATEWAY_ONLINE_STEPS: Step[] = [
  { status: 'pending', label: 'Order received', Icon: Clock },
  { status: 'accepted', label: 'Payment verified', Icon: Wallet },
  { status: 'preparing', label: 'Preparing', Icon: CookingPot },
  { status: 'ready', label: 'Ready for pickup', Icon: PackageCheck },
];

const GATEWAY_DINE_IN_STEPS: Step[] = [
  { status: 'pending', label: 'Order received', Icon: Clock },
  { status: 'accepted', label: 'Payment verified', Icon: Wallet },
  { status: 'preparing', label: 'Preparing', Icon: CookingPot },
  { status: 'ready', label: 'Ready', Icon: Coffee },
  { status: 'served', label: 'Served', Icon: PackageCheck },
];

const GATEWAY_TAKEOUT_STEPS: Step[] = [
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

export function fulfillmentStepsFor(
  channel: OrderChannel,
  paymentMethod?: PaymentMethod | null,
): Step[] {
  const gateway = awaitsGatewayPayment({ paymentMethod: paymentMethod ?? undefined });
  if (channel === 'takeout') return gateway ? GATEWAY_TAKEOUT_STEPS : TAKEOUT_STEPS;
  if (channel === 'dine-in') return gateway ? GATEWAY_DINE_IN_STEPS : DINE_IN_STEPS;
  // online / merch / pos — pickup-style flow (no "served")
  return gateway ? GATEWAY_ONLINE_STEPS : ONLINE_STEPS;
}

export function fulfillmentHeadline(status: OrderStatus): {
  title: string;
  lead: string;
  trail: string;
} {
  switch (status) {
    case 'preparing':
      return {
        title: 'Brewing your order',
        lead: 'Order ',
        trail: ' is on the bar now. Hang tight.',
      };
    case 'ready':
      return {
        title: 'Ready for pickup',
        lead: 'Order ',
        trail: ' is ready — show this code at the counter.',
      };
    case 'served':
    case 'completed':
      return {
        title: 'Enjoy your coffee',
        lead: 'Order ',
        trail: ' is complete. Salamat!',
      };
    case 'cancelled':
      return {
        title: 'Order cancelled',
        lead: 'Order ',
        trail: ' was cancelled. Ask staff if you need help.',
      };
    default:
      return {
        title: 'Salamat — order received',
        lead: 'Order ',
        trail: ' is paid and queued. We’ll brew it next.',
      };
  }
}

type Props = {
  status: OrderStatus;
  channel: OrderChannel;
  paymentMethod?: PaymentMethod | null;
  isLive?: boolean;
  className?: string;
};

/**
 * Live fulfillment timeline for guest checkout / QR tracking.
 * Uses kk_track_order + broadcast updates from the parent — no extra fetch.
 */
export default function GuestOrderStatusTimeline({
  status,
  channel,
  paymentMethod,
  isLive = false,
  className,
}: Props) {
  const steps = fulfillmentStepsFor(channel, paymentMethod);
  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';
  const currentRank = ORDER_RANK[status];

  if (isCancelled) {
    return (
      <div
        className={['rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5', className].filter(Boolean).join(' ')}
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-bold text-red-800">This order was cancelled.</p>
        <p className="mt-1 text-xs text-red-700/80 leading-relaxed">Ask our staff if you need help placing a new one.</p>
      </div>
    );
  }

  return (
    <div
      className={['rounded-2xl border border-kado-dark/10 bg-white p-4 sm:p-5', className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      aria-label="Order fulfillment status"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/50">Order status</p>
        {!isCompleted ? (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-kado-red">
            <span
              className={`h-1.5 w-1.5 rounded-full ${isLive ? 'animate-pulse bg-kado-red' : 'bg-kado-dark/30'}`}
              aria-hidden
            />
            {isLive ? 'Live' : 'Updating…'}
          </span>
        ) : null}
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
                  className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
                    done
                      ? 'bg-kado-dark text-kado-cream'
                      : active
                        ? 'bg-kado-red text-white shadow-[0_0_0_4px_rgba(158,24,29,0.12)]'
                        : 'bg-kado-dark/8 text-kado-dark/35',
                  ].join(' ')}
                >
                  {done ? (
                    <Check className="h-4 w-4 shrink-0 stroke-[3]" aria-hidden />
                  ) : (
                    <step.Icon className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                </div>
                {!last ? (
                  <div
                    className={`my-0.5 min-h-[1.25rem] w-0.5 flex-1 ${done ? 'bg-kado-dark/35' : 'bg-kado-dark/10'}`}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className={`min-w-0 pt-1.5 ${last ? 'pb-0' : 'pb-4'}`}>
                <p
                  className={[
                    'text-sm font-bold leading-snug',
                    active ? 'text-kado-red' : done ? 'text-kado-dark' : 'text-kado-dark/40',
                  ].join(' ')}
                >
                  {step.label}
                </p>
                {active ? (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-kado-dark/50">In progress…</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {isCompleted ? (
        <div className="mt-2 rounded-xl border border-kado-red/15 bg-kado-cream/60 px-4 py-3 text-center text-xs font-bold text-kado-dark">
          Enjoy your coffee!
        </div>
      ) : null}
    </div>
  );
}
