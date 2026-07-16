import { useEffect, useState } from 'react';
import { Banknote, CreditCard, Pencil, QrCode, XCircle } from 'lucide-react';
import type { PaymentMethod } from '../../types/domain';
import {
  canModifyUnpaidOrder,
  formatPaymentMethod,
  guestModifyBlockedMessage,
  paymentMethodsForOrderChange,
} from '../../lib/orderStatus';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { formatOrderError } from '../../lib/validation';
import GuestOrderActionSheet from '../order/GuestOrderActionSheet';
import type { GuestOrderAction } from '../../lib/guestOrderActions';
import { clearPendingPayment } from '../../lib/pendingPayments';

type Props = {
  orderId: string;
  shortCode: string;
  channel: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  hasPaymentProof?: boolean;
  isCustomer: boolean;
  onUpdated: () => void | Promise<void>;
  onCancelled: (action: GuestOrderAction) => void | Promise<void>;
  openMethodPicker?: boolean;
  onMethodPickerOpened?: () => void;
};

const METHOD_META: Record<
  PaymentMethod,
  { label: string; hint: string; Icon: typeof CreditCard }
> = {
  paymongo: { label: 'QR Ph', hint: 'Bank / e-wallet', Icon: CreditCard },
  'gcash-qr': { label: 'GCash QR', hint: 'Upload proof', Icon: QrCode },
  'pay-at-store': { label: 'Cash', hint: 'Pay at counter', Icon: Banknote },
};

export default function CheckoutOrderActions({
  orderId,
  shortCode,
  channel,
  paymentMethod,
  paymentStatus,
  hasPaymentProof,
  isCustomer,
  onUpdated,
  onCancelled,
  openMethodPicker,
  onMethodPickerOpened,
}: Props) {
  const [changingMethod, setChangingMethod] = useState(false);
  const [methodError, setMethodError] = useState('');
  const [actionPanel, setActionPanel] = useState<GuestOrderAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showMethodPicker, setShowMethodPicker] = useState(false);

  useEffect(() => {
    if (!openMethodPicker) return;
    setShowMethodPicker(true);
    onMethodPickerOpened?.();
  }, [openMethodPicker, onMethodPickerOpened]);

  const modifyCtx = {
    status: 'pending' as const,
    channel: channel as 'dine-in' | 'takeout' | 'online' | 'merch',
    paymentMethod,
    paymentStatus: paymentStatus as 'unpaid' | 'paid' | 'proof_submitted',
    hasPaymentProof,
  };
  const canModify = canModifyUnpaidOrder(modifyCtx);
  const blockedMsg = guestModifyBlockedMessage(modifyCtx);
  const methods = paymentMethodsForOrderChange(modifyCtx.channel, isCustomer).filter(
    (m) => m !== paymentMethod,
  );

  const changeMethod = async (next: PaymentMethod) => {
    setChangingMethod(true);
    setMethodError('');
    try {
      await orderingRepo.changeOrderPaymentMethod(orderId, next, shortCode);
      setShowMethodPicker(false);
      await onUpdated();
    } catch (err) {
      setMethodError(formatOrderError(err));
    } finally {
      setChangingMethod(false);
    }
  };

  const runGuestAction = async (action: GuestOrderAction, reason: string, note?: string) => {
    setActionBusy(true);
    setActionError('');
    try {
      await orderingRepo.cancelGuestOrder(orderId, { action, reason: reason as never, note });
      clearPendingPayment(orderId);
      setActionPanel(null);
      await onCancelled(action);
    } catch (err) {
      setActionError(formatOrderError(err));
    } finally {
      setActionBusy(false);
    }
  };

  if (!canModify && !blockedMsg) return null;

  return (
    <div className="rounded-2xl border border-kado-dark/10 bg-white p-4 sm:p-5 space-y-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/50">
        Order options
      </p>

      {blockedMsg ? (
        <p className="text-xs text-kado-dark/55 leading-relaxed">{blockedMsg}</p>
      ) : (
        <>
          {showMethodPicker && methods.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-kado-dark/60">
                Currently paying with <strong>{formatPaymentMethod(paymentMethod)}</strong>. Pick another
                method:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {methods.map((id) => {
                  const { label, hint, Icon } = METHOD_META[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={changingMethod}
                      onClick={() => void changeMethod(id)}
                      className="min-h-[52px] rounded-xl border border-kado-dark/12 bg-kado-offwhite px-3 py-2 text-left hover:border-kado-red/35 transition-colors touch-manipulation cursor-pointer disabled:opacity-50"
                    >
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-kado-dark">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-kado-red" aria-hidden />
                        {label}
                      </span>
                      <span className="mt-0.5 block text-[9px] text-kado-dark/50">{hint}</span>
                    </button>
                  );
                })}
              </div>
              {methodError ? <p className="text-xs font-semibold text-red-700">{methodError}</p> : null}
              <button
                type="button"
                onClick={() => setShowMethodPicker(false)}
                className="text-[10px] font-bold uppercase tracking-wider text-kado-dark/45 hover:text-kado-dark"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {methods.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowMethodPicker(true)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-kado-dark/15 bg-kado-offwhite px-4 text-[10px] font-bold uppercase tracking-wider text-kado-dark hover:border-kado-red/30 touch-manipulation cursor-pointer"
                >
                  <CreditCard className="h-3.5 w-3.5" aria-hidden />
                  Change payment method
                </button>
              ) : null}
              {!actionPanel ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActionPanel('change_order')}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-kado-dark/15 bg-kado-offwhite px-4 text-[10px] font-bold uppercase tracking-wider text-kado-dark hover:border-kado-red/30 touch-manipulation cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Change order
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionPanel('cancel')}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 text-[10px] font-bold uppercase tracking-wider text-red-800 hover:bg-red-100 touch-manipulation cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" aria-hidden />
                    Cancel order
                  </button>
                </>
              ) : null}
            </div>
          )}

          {actionPanel ? (
            <GuestOrderActionSheet
              action={actionPanel}
              busy={actionBusy}
              error={actionError}
              onClose={() => {
                setActionPanel(null);
                setActionError('');
              }}
              onConfirm={(reason, note) => void runGuestAction(actionPanel, reason, note)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
