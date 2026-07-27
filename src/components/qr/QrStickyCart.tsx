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

export type QrGuestNameField = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  required?: boolean;
  inputId?: string;
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
  placeOrderAriaLabel: string;
  emptyCartTitle: string;
  beforePlaceButton?: ReactNode;
  guestName?: QrGuestNameField;
};

function GuestNameInput({
  guestName,
  nameMissing,
  compact,
}: {
  guestName: QrGuestNameField;
  nameMissing: boolean;
  compact?: boolean;
}) {
  const nameInputId = guestName.inputId ?? 'qr-sticky-guest-name';
  return (
    <div
      className={`rounded-xl ${compact ? 'p-2.5' : 'p-3'} ${
        nameMissing
          ? 'border border-kado-red/45 bg-kado-red/10'
          : 'border border-[var(--qr-border)] bg-[var(--qr-surface-muted)]'
      }`}
    >
      <label
        htmlFor={nameInputId}
        className="mb-1.5 block text-[9px] font-black uppercase tracking-widest qr-text-subtle"
      >
        {guestName.label}
        {guestName.required ? <span className="text-kado-red"> *</span> : null}
        {!guestName.required ? (
          <span className="font-semibold normal-case tracking-normal opacity-70"> (optional)</span>
        ) : null}
      </label>
      <input
        id={nameInputId}
        type="text"
        value={guestName.value}
        onChange={(e) => guestName.onChange(e.target.value)}
        placeholder={guestName.placeholder}
        maxLength={80}
        autoComplete="name"
        enterKeyHint="done"
        className={`qr-field w-full rounded-lg px-3 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-kado-red/30 touch-manipulation ${
          compact ? 'py-2' : 'py-2.5'
        } ${nameMissing ? 'border-kado-red/50' : ''}`}
        aria-invalid={nameMissing || undefined}
        aria-required={guestName.required || undefined}
      />
      {nameMissing ? (
        <p className="mt-1.5 text-[11px] font-semibold leading-snug text-kado-red">
          Enter your name so we can call you.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Sticky guest cart — items scroll; name + payment + place stay pinned.
 */
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
  guestName,
}: Props) {
  const hasItems = cart.length > 0;
  const nameMissing = Boolean(guestName?.required && !guestName.value.trim());
  const showCollapsedName = Boolean(hasItems && guestName && !cartExpanded);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl px-[max(0.75rem,env(safe-area-inset-left))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-4 sm:pr-4">
        <div className="qr-cart-shell overflow-hidden rounded-2xl">
          <button
            type="button"
            onClick={() => hasItems && onCartExpandedChange(!cartExpanded)}
            className="flex min-h-[52px] w-full touch-manipulation items-center justify-between gap-3 px-4 py-3 text-left sm:min-h-[56px] sm:py-3.5"
            aria-expanded={cartExpanded}
            aria-label={cartExpanded ? 'Hide cart' : hasItems ? 'View cart' : emptyCartTitle}
          >
            <div className="flex min-w-0 items-center gap-2">
              <ShoppingBag className="h-5 w-5 shrink-0 text-kado-red" />
              <div className="min-w-0">
                <p className="font-display text-sm font-bold qr-text">
                  {cartCount === 0 ? emptyCartTitle : `${cartCount} item${cartCount !== 1 ? 's' : ''}`}
                </p>
                <p className="truncate text-[10px] qr-text-subtle">
                  {cartCount === 0
                    ? 'Tap a drink to add'
                    : cartExpanded
                      ? 'Hide cart to browse menu'
                      : nameMissing
                        ? 'Add your name, then place order'
                        : `View cart · ${formatPhp(cartTotals.total)}`}
                </p>
              </div>
            </div>
            {hasItems ? (
              cartExpanded ? (
                <ChevronDown className="h-5 w-5 shrink-0 qr-text-subtle" aria-hidden />
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-kado-red px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {nameMissing ? 'Checkout' : 'View cart'}
                  <ChevronUp className="h-3.5 w-3.5" />
                </span>
              )
            ) : null}
          </button>

          {cartExpanded && hasItems ? (
            <div className="border-t border-[var(--qr-border)]">
              <div className="flex justify-center px-4 pb-2 pt-3">
                <button
                  type="button"
                  onClick={() => onCartExpandedChange(false)}
                  className="qr-field inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:border-kado-red/30"
                >
                  <UtensilsCrossed className="h-4 w-4 shrink-0 text-kado-red" />
                  Order more drinks
                </button>
              </div>

              {/* Lines only scroll — checkout controls stay pinned below */}
              <div className="max-h-[min(28dvh,220px)] overflow-y-auto overscroll-contain px-4 pb-2 [@media(orientation:landscape)_and_(max-height:30rem)]:max-h-[min(20dvh,120px)]">
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
                      <li key={line.key} className="qr-line-item flex items-center gap-2 rounded-xl p-2.5">
                        <MenuProductImage
                          product={p}
                          alt=""
                          loading="lazy"
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold qr-text">{p.name}</p>
                          <p className="truncate text-[10px] qr-text-subtle">
                            {[line.milkLabel ?? milk?.label, line.temperature].filter(Boolean).join(' · ')}
                          </p>
                          <p className="mt-0.5 text-xs font-bold text-kado-red">
                            {formatPhp(unit * line.qty)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onRemoveLine(line.key)}
                            className="-m-1 p-2 touch-manipulation qr-text-subtle hover:text-red-500"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="qr-field flex items-center gap-0.5 rounded-full px-0.5">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(line.key, line.qty - 1)}
                              className="flex h-9 w-9 touch-manipulation items-center justify-center"
                              aria-label="Less"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold">{line.qty}</span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(line.key, line.qty + 1)}
                              className="flex h-9 w-9 touch-manipulation items-center justify-center"
                              aria-label="More"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="space-y-3 border-t border-[var(--qr-border)] px-4 py-3">
                <div className="space-y-1 text-[11px] qr-text-muted">
                  <div className="flex justify-between gap-3">
                    <span>Subtotal</span>
                    <span className="shrink-0 tabular-nums">{formatPhp(cartTotals.subtotal)}</span>
                  </div>
                  {cartTotals.modifiers > 0 ? (
                    <div className="flex justify-between gap-3">
                      <span>Modifiers</span>
                      <span className="shrink-0 tabular-nums">+{formatPhp(cartTotals.modifiers)}</span>
                    </div>
                  ) : null}
                  {cartTotals.tax > 0 ? (
                    <div className="flex justify-between gap-3">
                      <span>Tax ({taxRate}%)</span>
                      <span className="shrink-0 tabular-nums">{formatPhp(cartTotals.tax)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-3 pt-1 text-sm font-bold qr-text">
                    <span>Total</span>
                    <span className="shrink-0 tabular-nums text-kado-red">
                      {formatPhp(cartTotals.total)}
                    </span>
                  </div>
                </div>

                {guestName ? (
                  <GuestNameInput guestName={guestName} nameMissing={nameMissing} />
                ) : null}

                <QrPaymentSelector value={paymentMethod} onChange={onPaymentMethodChange} />
              </div>
            </div>
          ) : null}

          <div className="space-y-2 border-t border-[var(--qr-border)] p-3 sm:p-4">
            {showCollapsedName && guestName ? (
              <GuestNameInput guestName={guestName} nameMissing={nameMissing} compact />
            ) : null}
            {beforePlaceButton}
            {orderError ? (
              <div className="qr-error-panel space-y-2 rounded-xl px-3 py-2.5">
                <p className="text-xs font-medium leading-relaxed">{orderError}</p>
                {onRetrySync ? (
                  <button
                    type="button"
                    onClick={onRetrySync}
                    className="qr-field min-h-[40px] w-full touch-manipulation rounded-lg text-[10px] font-bold uppercase tracking-wider"
                  >
                    Try again
                  </button>
                ) : null}
              </div>
            ) : null}
            {hasItems && !cartExpanded ? (
              <button
                type="button"
                onClick={() => onCartExpandedChange(true)}
                className="qr-field min-h-[44px] w-full touch-manipulation rounded-xl text-[10px] font-bold uppercase tracking-wider hover:border-kado-red/30"
              >
                {nameMissing ? 'Review cart & add name' : 'Review cart & pay'}
              </button>
            ) : null}
            {(cartExpanded || !hasItems) && (
              <button
                type="button"
                onClick={onPlaceOrder}
                disabled={placeDisabled || nameMissing}
                aria-label={placeOrderAriaLabel}
                className="min-h-[52px] w-full touch-manipulation rounded-2xl bg-kado-red text-xs font-bold uppercase tracking-wider text-kado-cream transition-colors hover:bg-kado-dark disabled:opacity-40"
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
