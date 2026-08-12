import { useEffect, useRef } from 'react';
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
  activeCategoryId: string;
  onActiveCategoryChange: (id: string) => void;
  onSelectProduct: (product: Product) => void;
};

export default function QrGuestMenuCatalog({
  sections,
  activeCategoryId,
  onActiveCategoryChange,
  onSelectProduct,
}: Props) {
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current?.disconnect();
    if (!sections.length) return;

    const visible = new Map<string, number>();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-category-id');
          if (!id) continue;
          visible.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let bestId = sections[0]?.id ?? '';
        let bestRatio = 0;
        for (const section of sections) {
          const ratio = visible.get(section.id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = section.id;
          }
        }
        if (bestId && bestRatio > 0) onActiveCategoryChange(bestId);
      },
      { root: null, rootMargin: '-28% 0px -58% 0px', threshold: [0, 0.15, 0.35, 0.55] },
    );

    for (const section of sections) {
      const el = sectionRefs.current.get(section.id);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [sections, onActiveCategoryChange]);

  if (!sections.length) {
    return (
      <p className="qr-text-muted text-center text-sm py-12">
        No drinks available right now. Please ask staff.
      </p>
    );
  }

  let itemIndex = 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {sections.map((section) => (
        <section
          key={section.id}
          ref={(el) => {
            if (el) sectionRefs.current.set(section.id, el);
            else sectionRefs.current.delete(section.id);
          }}
          data-category-id={section.id}
          id={`qr-cat-${section.id}`}
          aria-labelledby={`qr-cat-heading-${section.id}`}
          className="scroll-mt-[var(--qr-menu-scroll-anchor,10.5rem)] sm:scroll-mt-[var(--qr-menu-scroll-anchor,11rem)] qr-menu-section-anchor"
        >
          <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
            <h2
              id={`qr-cat-heading-${section.id}`}
              className={`font-display text-[11px] sm:text-xs font-black uppercase tracking-[0.14em] ${
                activeCategoryId === section.id ? 'text-kado-red' : 'qr-text-subtle'
              }`}
            >
              {section.name}
            </h2>
            <span className="qr-text-subtle shrink-0 text-[9px] font-bold uppercase tracking-wider opacity-80">
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
                      <span className="absolute top-1 left-1 text-[6px] font-black uppercase tracking-widest bg-amber-600 text-white px-1 py-0.5 rounded-full">
                        Out
                      </span>
                    ) : (
                      tag && (
                        <span className="absolute top-1 left-1 text-[6px] font-black uppercase tracking-widest qr-badge-tag px-1 py-0.5 rounded-full max-w-[calc(100%-0.5rem)] truncate">
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                  <div className="p-1.5 sm:p-2 flex flex-col flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-0.5">
                      <h3 className="font-display font-bold text-[10px] sm:text-xs qr-text line-clamp-2 leading-tight">
                        {p.name}
                      </h3>
                      <span className="flex shrink-0 flex-col items-end leading-none">
                        {productPromoTag(p) ? (
                          <span className="text-[7px] font-semibold qr-text-subtle line-through sm:text-[8px]">
                            {formatPhp(p.basePrice)}
                          </span>
                        ) : null}
                        <span className="text-[10px] font-black text-kado-red sm:text-xs">
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
