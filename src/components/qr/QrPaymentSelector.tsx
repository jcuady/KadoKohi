import { Banknote, CreditCard, QrCode } from 'lucide-react';
import type { PaymentMethod } from '../../types/domain';

type Props = {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
};

const OPTIONS: { id: PaymentMethod; label: string; hint: string; Icon: typeof QrCode }[] = [
  { id: 'paymongo', label: 'QR Ph', hint: 'Any bank / e-wallet', Icon: CreditCard },
  { id: 'gcash-qr', label: 'GCash QR', hint: 'Pay now · upload proof', Icon: QrCode },
  { id: 'pay-at-store', label: 'Cash', hint: 'Pay at the counter', Icon: Banknote },
];

export default function QrPaymentSelector({ value, onChange }: Props) {
  return (
    <div>
      <p className="qr-text-subtle mb-2 text-[9px] font-black uppercase tracking-[0.18em]">Payment</p>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ id, label, hint, Icon }) => {
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`min-h-[52px] rounded-xl border px-1.5 py-2 text-left transition-colors touch-manipulation ${
                active
                  ? 'border-kado-red bg-kado-red text-white'
                  : 'qr-payment-idle border hover:border-kado-red/30'
              }`}
            >
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider sm:text-[10px]">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </span>
              <span className={`mt-0.5 block text-[8px] leading-snug sm:text-[9px] ${active ? 'opacity-90' : 'opacity-60'}`}>
                {hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
