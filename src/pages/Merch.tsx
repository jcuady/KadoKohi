import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Package, Tag } from 'lucide-react';
import type { MerchProduct } from '../types/domain';
import { useMerchStore } from '../store/merchStore';
import { formatPhp } from '../lib/money';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import ProductGridPagination, { PRODUCT_GRID_PAGE_SIZE } from '../components/ProductGridPagination';
import CatalogPageSkeleton from '../components/catalog/CatalogPageSkeleton';
import CatalogPageFrame from '../components/catalog/CatalogPageFrame';
import { toWebpSrc } from '../lib/toWebpSrc';
import { discountedBasePrice, hasProductDiscount, productPromoTag } from '../lib/productPricing';
import { MENU_PROMO_FILTER_ID, isPromoFilterId } from '../lib/menuCatalogFilters';

const DEFAULT_IMAGE = '/social/coffee-series.webp';

export default function Merch() {
  const categories = useMerchStore((s) => s.categories);
  const products = useMerchStore((s) => s.products);
  const remoteLoaded = useMerchStore((s) => s.remoteLoaded);
  const catalogLoading = !remoteLoaded;

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );
  const [activeCategoryId, setActiveCategoryId] = useState<string>(sortedCategories[0]?.id ?? '');
  const [selectedProduct, setSelectedProduct] = useState<MerchProduct | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!sortedCategories.length) return;
    if (isPromoFilterId(activeCategoryId)) return;
    if (!sortedCategories.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(sortedCategories[0].id);
    }
  }, [sortedCategories, activeCategoryId]);

  const activeCategory = useMemo(
    () => sortedCategories.find((c) => c.id === activeCategoryId),
    [sortedCategories, activeCategoryId],
  );

  const items = useMemo(() => {
    if (isPromoFilterId(activeCategoryId)) {
      return products
        .filter((p) => p.visible && hasProductDiscount(p))
        .sort((a, b) => a.order - b.order);
    }
    return products
      .filter((p) => p.categoryId === activeCategoryId && p.visible)
      .sort((a, b) => a.order - b.order);
  }, [products, activeCategoryId]);

  useEffect(() => {
    setPage(1);
  }, [activeCategoryId]);

  const totalPages = items.length === 0 ? 1 : Math.ceil(items.length / PRODUCT_GRID_PAGE_SIZE);
  const safePage = items.length === 0 ? 1 : Math.min(Math.max(1, page), totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * PRODUCT_GRID_PAGE_SIZE;
    return items.slice(start, start + PRODUCT_GRID_PAGE_SIZE);
  }, [items, safePage]);

  return (
    <>
      <CatalogPageFrame
        ribbon="MERCH"
        eyebrow="Kado Essentials"
        title="Shop Merch"
        subhead="Premium Kado Kohi apparel and accessories. Add to cart, checkout with GCash, then claim in-store."
        className="bg-white"
      >
        {catalogLoading ? (
          <CatalogPageSkeleton variant="merch" />
        ) : (
          <>
            <section className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[35] border-b border-kado-dark/5 bg-white/95 px-4 pb-4 pt-4 backdrop-blur-md sm:px-6 md:top-[calc(3.75rem+env(safe-area-inset-top,0px))] md:px-8 lg:px-16">
              <div className="mx-auto max-w-6xl">
                <div className="scrollbar-hide -mx-4 flex flex-nowrap items-center gap-2.5 overflow-x-auto px-4 pb-1 sm:gap-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryId(MENU_PROMO_FILTER_ID)}
                    className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 md:px-5 md:text-[11px] ${
                      isPromoFilterId(activeCategoryId)
                        ? 'bg-kado-red text-white shadow-lg shadow-kado-red/30'
                        : 'border border-kado-dark/15 bg-white text-kado-dark/70 hover:border-kado-red/50 hover:text-kado-red'
                    }`}
                  >
                    <Tag className="h-4 w-4 shrink-0" aria-hidden />
                    On promo
                  </button>
                  {sortedCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 md:px-5 md:text-[11px] ${
                        activeCategoryId === cat.id
                          ? 'bg-kado-red text-white shadow-lg shadow-kado-red/30'
                          : 'border border-kado-dark/15 bg-white text-kado-dark/70 hover:border-kado-red/50 hover:text-kado-red'
                      }`}
                    >
                      <Package className="h-4 w-4 shrink-0" aria-hidden />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-16">
              <div className="mx-auto max-w-6xl">
                {isPromoFilterId(activeCategoryId) && items.length > 0 ? (
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-kado-dark/45 sm:mb-5">
                    {items.length} on promo
                  </p>
                ) : null}
                {paginatedItems.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-kado-dark/10 bg-kado-offwhite p-12 text-center">
                    <p className="text-sm font-semibold text-kado-dark/50">
                      {isPromoFilterId(activeCategoryId)
                        ? 'No discounted merch right now. Check back soon or browse a category.'
                        : 'No merch items in this category yet.'}
                    </p>
                  </div>
                ) : (
                  <motion.div
                    key={`${activeCategoryId}-${safePage}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="menu-product-grid grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4"
                  >
                    {paginatedItems.map((product, i) => {
                      const promoTag = productPromoTag(product);
                      return (
                        <motion.button
                          key={product.id}
                          type="button"
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.04, 0.2), ease: 'easeOut' }}
                          onClick={() => setSelectedProduct(product)}
                          className="menu-product-card group flex h-full flex-col overflow-hidden rounded-xl border border-kado-dark/10 bg-white text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-kado-red/30 hover:shadow-[0_12px_28px_rgba(158,24,29,0.08)] md:rounded-[1.25rem]"
                        >
                          <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-kado-dark/5">
                            <img
                              src={toWebpSrc(product.image ?? DEFAULT_IMAGE) || product.image || DEFAULT_IMAGE}
                              alt={product.name}
                              loading="lazy"
                              decoding="async"
                              width={800}
                              height={600}
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="h-full w-full object-cover transition-transform duration-500 ease-out md:group-hover:scale-105"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const img = e.currentTarget;
                                const raw = product.image ?? DEFAULT_IMAGE;
                                if (img.getAttribute('data-fallback') !== '1' && toWebpSrc(raw) !== raw) {
                                  img.setAttribute('data-fallback', '1');
                                  img.src = raw;
                                  return;
                                }
                                if (!img.src.endsWith(DEFAULT_IMAGE)) img.src = toWebpSrc(DEFAULT_IMAGE) || DEFAULT_IMAGE;
                              }}
                            />
                            {promoTag ? (
                              <span className="absolute left-2 top-2 rounded-full bg-kado-dark px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white shadow">
                                {promoTag}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-1 flex-col p-2.5 sm:p-4">
                            <div className="mb-1 flex items-start justify-between gap-1.5 sm:gap-2">
                              <h3 className="line-clamp-2 font-display text-xs font-black leading-snug text-kado-dark transition-colors group-hover:text-kado-red sm:text-[0.95rem]">
                                {product.name}
                              </h3>
                              <span className="flex shrink-0 flex-col items-end font-sans leading-none">
                                {promoTag ? (
                                  <span className="text-[9px] font-semibold text-kado-dark/45 line-through sm:text-[10px]">
                                    {formatPhp(product.basePrice)}
                                  </span>
                                ) : null}
                                <span className="text-xs font-black text-kado-dark sm:text-base">
                                  {formatPhp(discountedBasePrice(product))}
                                </span>
                              </span>
                            </div>
                            <p className="mt-auto line-clamp-2 pt-1 text-[10px] font-medium leading-relaxed text-kado-dark/60 sm:text-xs">
                              {product.description ?? 'Premium Kado Kohi merchandise.'}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                <ProductGridPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </section>
          </>
        )}
      </CatalogPageFrame>

      <PageSeoBlurb />

      <ProductDetailDrawer
        product={selectedProduct}
        categoryName={activeCategory?.name}
        onClose={() => setSelectedProduct(null)}
        requireAuthToOrder
      />
    </>
  );
}
