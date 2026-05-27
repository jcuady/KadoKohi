import { Clock } from 'lucide-react';
import type { OnlineOrderHoursStatus } from '../lib/onlineOrderHours';

type Variant = 'cart' | 'inline' | 'compact';

type Props = {
  status: OnlineOrderHoursStatus;
  variant?: Variant;
  className?: string;
};

export default function OnlineOrderHoursNotice({ status, variant = 'cart', className = '' }: Props) {
  if (status.isOpen) {
    if (variant === 'compact') return null;
    return (
      <div
        className={`rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-900/80 leading-relaxed ${className}`}
      >
        <p className="font-bold text-emerald-900 flex items-center gap-1.5 mb-0.5">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Online ordering open
        </p>
        <p>{status.message}</p>
      </div>
    );
  }

  const tone =
    variant === 'cart'
      ? 'border-amber-200/90 bg-amber-50/90 text-amber-950/85'
      : 'border-kado-dark/10 bg-[#FAF7F2] text-kado-dark/65';

  return (
    <div className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${tone} ${className}`}>
      <p className="font-bold text-kado-dark flex items-center gap-1.5 mb-1">
        <Clock className="w-3.5 h-3.5 shrink-0 text-kado-red" />
        Online ordering closed
      </p>
      <p>{status.message}</p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-kado-dark/45">
        Hours: {status.openLabel} – {status.closeLabel} · Last order {status.lastOrderLabel}
      </p>
    </div>
  );
}
