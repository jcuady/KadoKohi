import { useMemo } from 'react';
import MenuProductImage from '../catalog/MenuProductImage';
import { formatPhp } from '../../lib/money';
import type { TrackedOrderLine, TrackedOrderSnapshot } from '../../lib/guestOrderSnapshot';
import type { TrackedOrderStatus } from '../../lib/supabase/repositories/ordering';

type Props = {
  tracked: TrackedOrderStatus | null;
  snapshot?: TrackedOrderSnapshot | null;
  taxRate: number;
};

function lineDetail(line: TrackedOrderLine): string {
  return [line.sizeLabelSnapshot, line.milkLabelSnapshot, line.temperature]
    .filter(Boolean)
    .join(' · ');
}

export default function OrderTrackingSummary({ tracked, snapshot, taxRate }: Props) {
  const items = tracked?.items?.length ? tracked.items : snapshot?.items ?? [];
  const subtotal = tracked?.subtotal ?? snapshot?.subtotal ?? 0;
  const modifiers = tracked?.modifiersTotal ?? snapshot?.modifiersTotal ?? 0;
  const tax = tracked?.tax ?? snapshot?.tax ?? 0;
  const total = tracked?.total ?? snapshot?.total ?? 0;

  const itemCount = useMemo(() => items.reduce((s, l) => s + l.qty, 0), [items]);

  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-kado-dark/10 bg-white overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-kado-dark/8 flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-kado-dark/45">
          Your order
        </p>
        <span className="text-[10px] font-bold text-kado-red">
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>
      </div>

      <ul className="divide-y divide-kado-dark/6">
        {items.map((line) => (
          <li key={line.id} className="flex gap-3 px-4 py-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-kado-dark/5 shrink-0 border border-kado-dark/6">
              <MenuProductImage
                product={{
                  image: line.productImage,
                  categoryId: '',
                }}
                alt={line.productNameSnapshot}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display font-bold text-sm text-kado-dark leading-snug line-clamp-2">
                  {line.productNameSnapshot}
                </p>
                <span className="font-black text-sm text-kado-red shrink-0">
                  {formatPhp(line.lineTotal)}
                </span>
              </div>
              {lineDetail(line) ? (
                <p className="text-[10px] text-kado-dark/45 mt-0.5 truncate">{lineDetail(line)}</p>
              ) : null}
              <p className="text-[10px] text-kado-dark/35 mt-0.5">
                {line.qty > 1 ? `${line.qty} × ${formatPhp(line.unitPrice)}` : 'Qty 1'}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="px-4 py-3 bg-kado-offwhite border-t border-kado-dark/8 space-y-1 text-[11px] text-kado-dark/55">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPhp(subtotal)}</span>
        </div>
        {modifiers > 0 && (
          <div className="flex justify-between">
            <span>Modifiers</span>
            <span>+{formatPhp(modifiers)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between">
            <span>Tax ({taxRate}%)</span>
            <span>{formatPhp(tax)}</span>
          </div>
        )}
        <div className="flex justify-between font-display font-black text-kado-dark text-sm pt-1 border-t border-kado-dark/8 mt-1">
          <span>Total</span>
          <span className="text-kado-red">{formatPhp(total)}</span>
        </div>
      </div>
    </div>
  );
}
