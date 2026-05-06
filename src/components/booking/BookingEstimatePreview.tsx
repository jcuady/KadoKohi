import { ReceiptText } from 'lucide-react';
import { formatPhp } from '../../lib/money';
import type { BookingEstimate } from '../../types/domain';

interface BookingEstimatePreviewProps {
  estimate: BookingEstimate | null;
}

export default function BookingEstimatePreview({ estimate }: BookingEstimatePreviewProps) {
  if (!estimate) {
    return (
      <aside className="rounded-2xl bg-white border border-kado-dark/10 p-6">
        <p className="text-sm text-kado-dark/55">
          Choose a package and add-ons to preview your estimated booking cost.
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl bg-white border border-kado-dark/10 p-6 shadow-sm sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <ReceiptText className="w-4 h-4 text-kado-red" />
        <h3 className="font-display text-xl font-bold text-kado-dark">Estimate Preview</h3>
      </div>

      <div className="space-y-2.5">
        {estimate.lineItems.map((line) => (
          <div key={line.id} className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold text-kado-dark leading-tight">{line.labelSnapshot}</p>
              <p className="text-kado-dark/55 text-xs mt-0.5">
                {line.qty} × {formatPhp(line.unitPrice)}
              </p>
            </div>
            <span className="font-bold text-kado-dark shrink-0">{formatPhp(line.lineTotal)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-kado-dark/10 mt-4 pt-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-kado-dark/65">
          <span>Subtotal</span>
          <span>{formatPhp(estimate.subtotal)}</span>
        </div>
        {(estimate.tax ?? 0) > 0 && (
          <div className="flex justify-between text-kado-dark/65">
            <span>Tax</span>
            <span>{formatPhp(estimate.tax ?? 0)}</span>
          </div>
        )}
        <div className="flex justify-between font-display font-bold text-lg text-kado-dark pt-1">
          <span>Total</span>
          <span className="text-kado-red">{formatPhp(estimate.total)}</span>
        </div>
      </div>

      {!!estimate.assumptions?.length && (
        <div className="mt-4 rounded-xl bg-kado-red/5 border border-kado-red/15 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-kado-red mb-1.5">
            Assumptions
          </p>
          <ul className="space-y-1">
            {estimate.assumptions.map((note) => (
              <li key={note} className="text-xs text-kado-dark/70 leading-relaxed">
                • {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
