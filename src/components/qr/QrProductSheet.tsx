import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import type { Product } from '../../types/domain';
import { formatPhp } from '../../lib/money';
import { getProductDescription, getProductImageUrl } from '../../lib/productImage';
import { isProductInStock } from '../../lib/productStock';
import { qrChipClass } from '../../lib/qrGuestTheme';

export type QrCartPayload = {
  productId: string;
  qty: number;
  milkId?: string;
  milkLabel?: string;
  temperature?: 'hot' | 'iced';
};

type Props = {
  product: Product | null;
  onClose: () => void;
  onAdd: (payload: QrCartPayload) => void;
  /** CTA verb shown on the add button, e.g. "Add to order". */
  ctaLabel?: string;
};

function ChipCheck({ visible, tone }: { visible: boolean; tone: 'default' | 'hot' | 'iced' }) {
  if (!visible) return null;
  const isIced = tone === 'iced';
  return (
    <span
      className={`absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
        isIced
          ? 'border-[var(--qr-chip-iced-text)] bg-[var(--qr-chip-iced-text)] text-[var(--qr-chip-iced-bg)]'
          : 'border-[var(--qr-chip-hot-text)] bg-[var(--qr-chip-hot-text)] text-[var(--qr-chip-hot-bg)]'
      }`}
      aria-hidden
    >
      <Check className="h-3 w-3 stroke-[3]" />
    </span>
  );
}

export default function QrProductSheet({ product, onClose, onAdd, ctaLabel = 'Add to table order' }: Props) {
  const [qty, setQty] = useState(1);
  const [milkId, setMilkId] = useState('');
  const [temp, setTemp] = useState<'hot' | 'iced'>('hot');

  useEffect(() => {
    if (!product) return;
    setQty(1);
    setMilkId(product.milks?.[0]?.id ?? '');
    setTemp(product.temperature === 'iced' ? 'iced' : 'hot');
  }, [product]);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    let price = product.basePrice;
    const milk = product.milks?.find((m) => m.id === milkId);
    if (milk) price += milk.priceDelta;
    return price;
  }, [product, milkId]);

  if (!product) return null;

  const inStock = isProductInStock(product);
  const image = getProductImageUrl(product);
  const showTemp = product.temperature === 'both';
  const showMilk = (product.milks?.length ?? 0) > 0;

  const handleAdd = () => {
    if (!inStock) return;
    const milk = product.milks?.find((m) => m.id === milkId);
    onAdd({
      productId: product.id,
      qty,
      milkId: milk?.id,
      milkLabel: milk?.label,
      temperature:
        product.temperature === 'both'
          ? temp
          : product.temperature === 'iced'
            ? 'iced'
            : 'hot',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            key="qr-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[180] bg-kado-dark/55 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            key="qr-sheet-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className="fixed inset-x-0 bottom-0 z-[181] max-h-[min(92dvh,640px)] flex flex-col rounded-t-[1.75rem] bg-[var(--qr-sheet-bg)] text-[var(--qr-text)] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--qr-border)]">
              <span className="text-[10px] font-black uppercase tracking-widest text-kado-red">Customize</span>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--qr-text)] hover:bg-[var(--qr-chip-idle-bg)]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="aspect-[16/10] sm:aspect-[2/1] bg-[var(--qr-surface)] relative">
                <img
                  src={image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="px-4 sm:px-6 py-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display font-black text-xl text-[var(--qr-text)] leading-tight">
                      {product.name}
                    </h2>
                    <p className="text-sm text-[var(--qr-text-muted)] mt-1 leading-relaxed">
                      {getProductDescription(product)}
                    </p>
                  </div>
                  <span className="font-display font-black text-lg text-kado-red shrink-0">{formatPhp(unitPrice)}</span>
                </div>

                {showMilk && (
                  <div role="group" aria-label="Milk choice">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--qr-text-subtle)] mb-2">
                      Milk
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.milks!.map((m) => {
                        const active = milkId === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setMilkId(m.id)}
                            className={qrChipClass(active, 'default')}
                          >
                            <ChipCheck visible={active} tone="default" />
                            {m.label}
                            {m.priceDelta > 0 && (
                              <span className={`ml-1 ${active ? 'opacity-90' : 'opacity-70'}`}>
                                +{formatPhp(m.priceDelta)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {showTemp && (
                  <div role="group" aria-label="Temperature">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--qr-text-subtle)] mb-2">
                      Temperature
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['hot', 'iced'] as const).map((t) => {
                        const active = temp === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setTemp(t)}
                            className={`${qrChipClass(active, t)} uppercase tracking-wider`}
                          >
                            <ChipCheck visible={active} tone={t} />
                            {t === 'hot' ? 'Hot' : 'Iced'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--qr-text-subtle)] mb-2">
                    Quantity
                  </p>
                  <div className="inline-flex items-center gap-3 bg-[var(--qr-surface)] border-2 border-[var(--qr-border)] rounded-full px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--qr-text)] hover:bg-kado-red/10"
                      aria-label="Decrease"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-black text-sm min-w-[1.5rem] text-center text-[var(--qr-text)]">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--qr-text)] hover:bg-kado-red/10"
                      aria-label="Increase"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 p-4 border-t border-[var(--qr-border)] pb-[max(1rem,env(safe-area-inset-bottom))] bg-[var(--qr-sheet-bg)]">
              {!inStock && (
                <p className="text-xs text-amber-800 font-medium text-center mb-3 [@media(prefers-color-scheme:dark)]:text-amber-200">
                  This drink is out of stock right now. Ask staff when it is available again.
                </p>
              )}
              <button
                type="button"
                onClick={handleAdd}
                disabled={!inStock}
                className="w-full min-h-[52px] rounded-2xl bg-kado-red text-kado-cream flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                {inStock ? `${ctaLabel} — ${formatPhp(unitPrice * qty)}` : 'Out of stock'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
