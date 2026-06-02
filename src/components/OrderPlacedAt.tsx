import { formatOrderDbLabel, formatOrderTimestamp } from '../lib/orderTime';

type Props = {
  createdAt: string;
  updatedAt?: string;
  /** Show full DB-style timestamp (for admin / staff). */
  showDb?: boolean;
  align?: 'left' | 'right';
};

export default function OrderPlacedAt({ createdAt, updatedAt, showDb = false, align = 'right' }: Props) {
  const placed = formatOrderTimestamp(createdAt);
  const alignClass = align === 'right' ? 'text-right' : 'text-left';

  return (
    <div className={`shrink-0 ${alignClass}`} title={createdAt}>
      <span className="block text-[10px] font-semibold dash-heading tabular-nums leading-tight">
        {placed.clock}
      </span>
      <span className="block text-[9px] dash-muted leading-tight">{placed.relative}</span>
      {showDb && (
        <span className="block text-[8px] font-mono dash-muted leading-tight mt-0.5">
          {formatOrderDbLabel(createdAt)}
        </span>
      )}
      {showDb && updatedAt && updatedAt !== createdAt && (
        <span className="block text-[8px] font-mono dash-muted/80 leading-tight">
          Updated {formatOrderDbLabel(updatedAt)}
        </span>
      )}
    </div>
  );
}
