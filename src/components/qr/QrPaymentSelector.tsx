import { Banknote, QrCode } from 'lucide-react';
import type { PaymentMethod } from '../../types/domain';

type Props = {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  /** Light theme for QR pages; dark for admin-style panels. */
  variant?: 'light' | 'dark';
};

const OPTIONS: { id: PaymentMethod; label: string; hint: string; Icon: typeof QrCode }[] = [
  { id: 'gcash-qr', label: 'GCash QR', hint: 'Pay now · upload proof', Icon: QrCode },
  { id: 'pay-at-store', label: 'Cash', hint: 'Pay at the counter', Icon: Banknote },
];

export default function QrPaymentSelector({ value, onChange, variant = 'light' }: Props) {
  const isLight = variant === 'light';

  return (
    <div>
      <p
        className={`text-[9px] font-black uppercase tracking-[0.18em] mb-2 ${
          isLight ? 'text-kado-dark/45' : 'text-white/45'
        }`}
      >
        Payment
      </p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ id, label, hint, Icon }) => {
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`min-h-[52px] rounded-xl px-2 py-2.5 text-left border transition-colors touch-manipulation ${
                active
                  ? isLight
                    ? 'bg-kado-red text-white border-kado-red'
                    : 'bg-kado-red text-white border-kado-red'
                  : isLight
                    ? 'bg-white border-kado-dark/10 text-kado-dark/70 hover:border-kado-red/30'
                    : 'bg-white/5 border-white/10 text-white/70 hover:border-kado-red/40'
              }`}
            >
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </span>
              <span className={`block text-[9px] mt-0.5 leading-snug ${active ? 'opacity-90' : 'opacity-60'}`}>
                {hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
