import { formatPhp } from '../../lib/money';
import type { BookingEstimate } from '../../types/domain';

type Props = {
  estimate: BookingEstimate;
  title: string;
  subtitle?: string;
  variant?: 'light' | 'dash';
};

export default function BoothEstimateBreakdown({
  estimate,
  title,
  subtitle,
  variant = 'light',
}: Props) {
  const isDash = variant === 'dash';

  return (
    <div
      className={
        isDash
          ? 'rounded-xl border dash-border dash-card-alt p-4'
          : 'rounded-xl border border-kado-dark/10 bg-kado-offwhite/50 p-4'
      }
    >
      <p
        className={
          isDash
            ? 'text-[10px] font-black uppercase tracking-widest text-kado-red mb-0.5'
            : 'text-[10px] font-black uppercase tracking-widest text-kado-red mb-0.5'
        }
      >
        {title}
      </p>
      {subtitle && (
        <p className={`text-xs mb-3 ${isDash ? 'dash-muted' : 'text-kado-dark/55'}`}>{subtitle}</p>
      )}
      <div className="space-y-2">
        {estimate.lineItems.map((line) => (
          <div key={line.id} className="flex justify-between gap-3 text-sm">
            <span className={isDash ? 'dash-muted' : 'text-kado-dark/75'}>
              {line.labelSnapshot}
              {line.qty > 1 && ` × ${line.qty}`}
            </span>
            <span className={`font-semibold shrink-0 ${isDash ? 'dash-heading' : 'text-kado-dark'}`}>
              {formatPhp(line.lineTotal)}
            </span>
          </div>
        ))}
      </div>
      <div
        className={`mt-3 pt-3 border-t flex justify-between font-display font-bold text-lg ${
          isDash ? 'border-dash-border dash-heading' : 'border-kado-dark/10 text-kado-dark'
        }`}
      >
        <span>Total</span>
        <span className="text-kado-red">{formatPhp(estimate.total)}</span>
      </div>
      {estimate.notes && (
        <p className={`mt-2 text-xs ${isDash ? 'dash-muted' : 'text-kado-dark/60'}`}>{estimate.notes}</p>
      )}
    </div>
  );
}
