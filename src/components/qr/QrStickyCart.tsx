import type { ReactNode } from 'react';
import type { PaymentMethod, Product } from '../../types/domain';
import type { QrCartLine } from '../../lib/qrOrderCart';
import { formatPhp } from '../../lib/money';
import { resolvePosUnitPrice } from '../../lib/posPricing';
import QrPaymentSelector from './QrPaymentSelector';
import MenuProductImage from '../catalog/MenuProductImage';
import {
  ShoppingBag,
  ChevronUp,
  ChevronDown,
  Minus,
  Plus,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';

type CartTotals = {
  lines: { length: number };
  subtotal: number;
  modifiers: number;
  tax: number;
  total: number;
};

type Props = {
  cart: QrCartLine[];
  cartExpanded: boolean;
  onCartExpandedChange: (expanded: boolean) => void;
  cartCount: number;
  cartTotals: CartTotals;
  products: Product[];
  taxRate: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onUpdateQty: (key: string, qty: number) => void;
  onRemoveLine: (key: string) => void;
  orderError: string | null;
  onRetrySync?: () => void;
  submitting: boolean;
  onPlaceOrder: () => void;
  placeDisabled: boolean;
  placeButtonLabel: string;
  /** Stable accessible name for place-order (e2e + screen readers). */
  placeOrderAriaLabel: string;
  emptyCartTitle: string;
  beforePlaceButton?: ReactNode;
};

export default function QrStickyCart({
  cart,
  cartExpanded,
  onCartExpandedChange,
  cartCount,
  cartTotals,
  products,
  taxRate,
  paymentMethod,
  onPaymentMethodChange,
  onUpdateQty,
  onRemoveLine,
  orderError,
  onRetrySync,
  submitting,
  onPlaceOrder,
  placeDisabled,
  placeButtonLabel,
  placeOrderAriaLabel,
  emptyCartTitle,
  beforePlaceButton,
}: Props) {
  const hasItems = cart.length > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
      <div className="pointer-events-auto max-w-3xl mx-auto px-[max(0.75rem,env(safe-area-inset-left))] sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:pr-4">
        <div className="qr-cart-shell rounded-2xl overflow-hidden">
          {/* Collapsed summary — tap to open cart */}
          <button
            type="button"
            onClick={() => hasItems && onCartExpandedChange(!cartExpanded)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left touch-manipulation min-h-[56px]"
            aria-expanded={cartExpanded}
            aria-label={cartExpanded ? 'Hide cart' : hasItems ? 'View cart' : emptyCartTitle}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShoppingBag className="w-5 h-5 text-kado-red shrink-0" />
              <div className="min-w-0">
                <p className="font-display font-bold text-sm qr-text">
                  {cartCount === 0 ? emptyCartTitle : `${cartCount} item${cartCount !== 1 ? 's' : ''}`}
                </p>
                <p className="qr-text-subtle text-[10px] truncate">
                  {cartCount === 0
                    ? 'Tap a drink to add'
                    : cartExpanded
                      ? 'Hide cart to browse menu'
                      : `View cart · ${formatPhp(cartTotals.total)}`}
                </p>
              </div>
            </div>
            {hasItems &&
              (cartExpanded ? (
                <ChevronDown className="qr-text-subtle w-5 h-5 shrink-0" aria-hidden />
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-kado-red text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                  View cart
                  <ChevronUp className="w-3.5 h-3.5" />
                </span>
              ))}
          </button>

          {cartExpanded && hasItems && (
            <div className="border-t border-[var(--qr-border)]">
              <div className="px-4 pt-3 pb-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => onCartExpandedChange(false)}
                  className="qr-field inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider touch-manipulation hover:border-kado-red/30"
                >
                  <UtensilsCrossed className="w-4 h-4 text-kado-red shrink-0" />
                  Order more drinks
                </button>
              </div>

              <div className="px-4 pb-3 max-h-[min(42dvh,360px)] [@media(orientation:landscape)_and_(max-height:30rem)]:max-h-[min(30dvh,200px)] overflow-y-auto overscroll-contain">
                <ul className="space-y-2">
                  {cart.map((line) => {
                    const p = products.find((x) => x.id === line.productId);
                    if (!p) return null;
                    const milk = p.milks?.find((m) => m.id === line.milkId);
                    const { unit } = resolvePosUnitPrice(p, {
                      milkId: line.milkId,
                      sizeId: line.sizeId,
                      customizations: line.customizations ?? [],
                    });
                    return (
                      <li
                        key={line.key}
                        className="qr-line-item flex gap-2 items-center rounded-xl p-2.5"
                      >
                        <MenuProductImage
                          product={p}
                          alt=""
                          loading="lazy"
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold qr-text truncate">{p.name}</p>
                          <p className="qr-text-subtle text-[10px] truncate">
                            {[line.milkLabel ?? milk?.label, line.temperature].filter(Boolean).join(' · ')}
                          </p>
                          <p className="text-xs font-bold text-kado-red mt-0.5">{formatPhp(unit * line.qty)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onRemoveLine(line.key)}
                            className="p-2 -m-1 qr-text-subtle hover:text-red-500 touch-manipulation"
                            aria-label="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-0.5 qr-field rounded-full px-0.5">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(line.key, line.qty - 1)}
                              className="w-9 h-9 flex items-center justify-center touch-manipulation"
                              aria-label="Less"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold w-5 text-center">{line.qty}</span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(line.key, line.qty + 1)}
                              className="w-9 h-9 flex items-center justify-center touch-manipulation"
                              aria-label="More"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="qr-text-muted mt-3 space-y-1 border-t border-[var(--qr-border)] pt-3 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPhp(cartTotals.subtotal)}</span>
                  </div>
                  {cartTotals.modifiers > 0 && (
                    <div className="flex justify-between">
                      <span>Modifiers</span>
                      <span>+{formatPhp(cartTotals.modifiers)}</span>
                    </div>
                  )}
                  {cartTotals.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax ({taxRate}%)</span>
                      <span>{formatPhp(cartTotals.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 text-sm font-bold qr-text">
                    <span>Total</span>
                    <span className="text-kado-red">{formatPhp(cartTotals.total)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <QrPaymentSelector value={paymentMethod} onChange={onPaymentMethodChange} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 border-t border-[var(--qr-border)] p-3 sm:p-4">
            {beforePlaceButton}
            {orderError && (
              <div className="qr-error-panel space-y-2 rounded-xl px-3 py-2.5">
                <p className="text-xs font-medium leading-relaxed">{orderError}</p>
                {onRetrySync && (
                  <button
                    type="button"
                    onClick={onRetrySync}
                    className="qr-field w-full min-h-[40px] rounded-lg text-[10px] font-bold uppercase tracking-wider touch-manipulation"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
            {hasItems && !cartExpanded && (
              <button
                type="button"
                onClick={() => onCartExpandedChange(true)}
                className="qr-field w-full min-h-[44px] rounded-xl text-[10px] font-bold uppercase tracking-wider touch-manipulation hover:border-kado-red/30"
              >
                Review cart &amp; pay
              </button>
            )}
            {(cartExpanded || !hasItems) && (
              <button
                type="button"
                onClick={onPlaceOrder}
                disabled={placeDisabled}
                aria-label={placeOrderAriaLabel}
                className="w-full min-h-[52px] rounded-2xl bg-kado-red text-kado-cream text-xs font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-kado-dark transition-colors touch-manipulation"
              >
                {submitting ? 'Sending…' : placeButtonLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
