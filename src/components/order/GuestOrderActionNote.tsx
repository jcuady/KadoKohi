import type { Order } from '../../types/domain';
import { formatGuestOrderActionSummary } from '../../lib/guestOrderActions';

type Props = {
  order: Pick<Order, 'guestAction' | 'guestActionReason' | 'guestActionNote'>;
  variant?: 'dash' | 'modal';
};

export default function GuestOrderActionNote({ order, variant = 'dash' }: Props) {
  const text = formatGuestOrderActionSummary(order);
  if (!text) return null;

  if (variant === 'modal') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800/70 mb-1">Guest feedback</p>
        <p>{text}</p>
      </div>
    );
  }

  return (
    <p className="mt-1 text-[10px] font-semibold leading-snug text-amber-800" title={text}>
      {text}
    </p>
  );
}
