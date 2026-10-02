import { motion } from 'motion/react';
import type { Product } from '../../types/domain';
import type { QrGuestMenuSection } from '../../lib/qrGuestMenu';
import { formatPhp } from '../../lib/money';
import { getProductDescription } from '../../lib/productImage';
import { isIcedOnlyDrink } from '../../lib/menuProductModifiers';
import MenuProductImage from '../catalog/MenuProductImage';
import { isProductInStock } from '../../lib/productStock';
import { discountedBasePrice, productPromoTag } from '../../lib/productPricing';
import { isKukidoCookieId, KUKIDO_CREAM } from '../../lib/kukido';

type Props = {
  sections: QrGuestMenuSection[];
  onSelectProduct: (product: Product) => void;
};

export default function QrGuestMenuCatalog({ sections, onSelectProduct }: Props) {
  if (!sections.length) {
    return (
      <p className="qr-text-muted text-center text-sm py-12">
        Nothing available right now. Please ask staff.
      </p>
    );
  }

  let itemIndex = 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {sections.map((section) => (
        <section
          key={section.id}
          id={`qr-cat-${section.id}`}
          aria-labelledby={`qr-cat-heading-${section.id}`}
        >
          <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
            <h2
              id={`qr-cat-heading-${section.id}`}
              className="font-display text-xs font-black uppercase tracking-[0.14em] qr-text"
            >
              {section.name}
            </h2>
            <span className="qr-text-muted shrink-0 text-[11px] font-bold tabular-nums">
              {section.products.length}
            </span>
          </div>
          <div className="guest-order-product-grid">
            {section.products.map((p) => {
              const tag = productPromoTag(p) ?? (isIcedOnlyDrink(p) ? 'Iced only' : p.tags?.[0]);
              const inStock = isProductInStock(p);
              const i = itemIndex++;
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  disabled={!inStock}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.18) }}
                  onClick={() => inStock && onSelectProduct(p)}
                  className={`qr-surface-card text-left rounded-xl overflow-hidden transition-all touch-manipulation flex flex-col h-full ${
                    inStock
                      ? 'hover:border-kado-red/25 active:scale-[0.98]'
                      : 'opacity-55 cursor-not-allowed'
                  }`}
                >
                  <div
                    className="relative aspect-square shrink-0 qr-image-placeholder"
                    style={isKukidoCookieId(p.id) ? { backgroundColor: KUKIDO_CREAM } : undefined}
                  >
                    <MenuProductImage
                      product={p}
                      alt={p.name}
                      loading={i < 9 ? 'eager' : 'lazy'}
                      className={
                        isKukidoCookieId(p.id)
                          ? 'h-full w-full object-contain p-2'
                          : 'h-full w-full object-cover'
                      }
                    />
                    {!inStock ? (
                      <span className="absolute top-1 left-1 text-[8px] font-black uppercase tracking-wider bg-amber-800 text-white px-1.5 py-0.5 rounded-full">
                        Out
                      </span>
                    ) : (
                      tag && (
                        <span className="absolute top-1 left-1 text-[8px] font-black uppercase tracking-wider qr-badge-tag px-1.5 py-0.5 rounded-full max-w-[calc(100%-0.5rem)] truncate">
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                  <div className="p-1.5 sm:p-2 flex flex-col flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-0.5">
                      <h3 className="font-display font-bold text-[11px] sm:text-xs qr-text line-clamp-2 leading-tight">
                        {p.name}
                      </h3>
                      <span className="flex shrink-0 flex-col items-end leading-none">
                        {productPromoTag(p) ? (
                          <span className="text-[9px] font-semibold qr-text-subtle line-through">
                            {formatPhp(p.basePrice)}
                          </span>
                        ) : null}
                        <span className="text-[11px] font-black text-kado-red sm:text-xs">
                          {formatPhp(discountedBasePrice(p))}
                        </span>
                      </span>
                    </div>
                    <p className="hidden sm:block qr-text-subtle text-[9px] line-clamp-1 leading-snug mt-0.5">
                      {getProductDescription(p)}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
