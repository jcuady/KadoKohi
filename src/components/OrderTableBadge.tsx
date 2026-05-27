import type { Order } from '../types/domain';
import { useTableStore } from '../store/tableStore';
import { getOrderTableLabel } from '../lib/orderTable';

type Props = {
  order: Pick<Order, 'tableId' | 'channel'>;
  className?: string;
  variant?: 'default' | 'kiosk' | 'dash';
};

const VARIANT_CLASS: Record<NonNullable<Props['variant']>, string> = {
  default: 'bg-violet-100 text-violet-900 border-violet-200',
  dash: 'dash-card-alt text-violet-800 border-violet-300/60',
  kiosk: 'bg-violet-500/20 text-violet-100 border-violet-400/35',
};

/** Shows table label for dine-in QR orders. */
export default function OrderTableBadge({ order, className = '', variant = 'default' }: Props) {
  const tables = useTableStore((s) => s.tables);
  const label = getOrderTableLabel(order, tables);

  if (order.channel !== 'dine-in' || !label) return null;

  return (
    <span
      className={`inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${VARIANT_CLASS[variant]} ${className}`}
    >
      {label}
    </span>
  );
}
