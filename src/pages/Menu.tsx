import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Coffee, Leaf, IceCreamCone, Star, Croissant } from 'lucide-react';
import { useMenuStore } from '../store/menuStore';
import { formatPhp } from '../lib/money';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import ProductGridPagination, { PRODUCT_GRID_PAGE_SIZE } from '../components/ProductGridPagination';
import CatalogPageSkeleton from '../components/catalog/CatalogPageSkeleton';
import MenuProductImage from '../components/catalog/MenuProductImage';
import type { Product } from '../types/domain';
import { isProductInStock } from '../lib/productStock';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import { isIcedOnlyDrink, productFallbackDescription } from '../lib/menuProductModifiers';
import {
  findVisibleMenuProduct,
  menuProductDomId,
  pageForProductInList,
} from '../lib/menuDeepLink';

function categoryIcon(categoryId: string, categoryName?: string): React.ReactNode {
  if (categoryName?.trim().toLowerCase() === 'pastries') {
    return <Croissant className="w-4 h-4 shrink-0" />;
  }
  if (categoryId === 'cat_matcha') return <Leaf className="w-4 h-4 shrink-0" />;
  if (categoryId === 'cat_yuzu') return <IceCreamCone className="w-4 h-4 shrink-0" />;
  return <Coffee className="w-4 h-4 shrink-0" />;
}

/** Shorter labels for narrow mobile grid cells — full name stays in aria-label. */
function categoryShortLabel(categoryId: string, fullName: string): string {
  switch (categoryId) {
    case 'cat_classics':
      return 'Espresso Classics';
    case 'cat_signatures':
      return 'Espresso Signatures';
    default:
      return fullName;
  }
}

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkProductId = searchParams.get('product')?.trim() ?? '';
  const deepLinkCategoryId = searchParams.get('category')?.trim() ?? '';
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);
  const remoteLoaded = useMenuStore((s) => s.remoteLoaded);
  const catalogLoading = !remoteLoaded;

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    () => sortedCategories[0]?.id ?? '',
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [highlightProductId, setHighlightProductId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const deepLinkHandled = useRef('');

  useEffect(() => {
    if (!sortedCategories.length) return;
    if (!sortedCategories.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(sortedCategories[0].id);
    }
  }, [sortedCategories, activeCategoryId]);

  useEffect(() => {
    if (!remoteLoaded) return;
    if (deepLinkCategoryId && sortedCategories.some((c) => c.id === deepLinkCategoryId)) {
      setActiveCategoryId(deepLinkCategoryId);
    }
  }, [remoteLoaded, deepLinkCategoryId, sortedCategories]);

  useEffect(() => {
    if (!remoteLoaded || !deepLinkProductId) return;
    if (deepLinkHandled.current === deepLinkProductId) return;

    const product = findVisibleMenuProduct(products, deepLinkProductId);
    if (!product?.categoryId) return;

    const categoryItems = productsByCategory(product.categoryId);
    const targetPage = pageForProductInList(product.id, categoryItems, PRODUCT_GRID_PAGE_SIZE);

    deepLinkHandled.current = deepLinkProductId;
    setActiveCategoryId(product.categoryId);
    if (targetPage) setPage(targetPage);
    setSelectedProduct(product);
    setHighlightProductId(product.id);
  }, [remoteLoaded, deepLinkProductId, products, productsByCategory]);

  useEffect(() => {
    if (!deepLinkProductId) deepLinkHandled.current = '';
  }, [deepLinkProductId]);

  const clearMenuDeepLink = () => {
    deepLinkHandled.current = '';
    setHighlightProductId(null);
    if (!searchParams.has('product') && !searchParams.has('category')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('product');
    next.delete('category');
    setSearchParams(next, { replace: true });
  };

  const activeCategory = useMemo(
    () => sortedCategories.find((c) => c.id === activeCategoryId),
    [sortedCategories, activeCategoryId],
  );

  const items = activeCategoryId ? productsByCategory(activeCategoryId) : [];

  useEffect(() => {
    setPage(1);
  }, [activeCategoryId]);

  const totalPages = items.length === 0 ? 1 : Math.ceil(items.length / PRODUCT_GRID_PAGE_SIZE);
  const safePage = items.length === 0 ? 1 : Math.min(Math.max(1, page), totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * PRODUCT_GRID_PAGE_SIZE;
    return items.slice(start, start + PRODUCT_GRID_PAGE_SIZE);
  }, [items, safePage]);

  useEffect(() => {
    if (!highlightProductId || highlightProductId !== deepLinkProductId) return;
    if (!paginatedItems.some((p) => p.id === highlightProductId)) return;

    const domId = menuProductDomId(highlightProductId);
    const scrollTimer = window.setTimeout(() => {
      document.getElementById(domId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    const clearTimer = window.setTimeout(() => setHighlightProductId(null), 2800);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [highlightProductId, deepLinkProductId, paginatedItems, safePage, activeCategoryId]);

  return (
    <div className="customer-menu-page relative w-full bg-white font-sans">
      {/* Full-viewport ribbon: fixed below navbar, does not scroll with content */}
      <div
        className="hidden md:block pointer-events-none fixed left-0 top-16 bottom-0 z-[30] w-28 lg:w-40 bg-kado-red shadow-[10px_0_30px_rgba(158,24,29,0.15)] overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="font-display font-black text-white text-[10rem] lg:text-[13rem] leading-none -rotate-90 tracking-tighter whitespace-nowrap select-none opacity-95">
            MENU
          </h1>
        </div>
      </div>

      <div className="flex min-w-0 flex-col overflow-x-clip md:pl-28 lg:pl-40">
        {/* Mobile Header (Red block) */}
        <div className="relative overflow-hidden bg-kado-red px-4 pb-7 pt-8 shadow-md sm:px-6 sm:pb-8 sm:pt-10 [@media(orientation:landscape)_and_(max-height:30rem)]:px-4 [@media(orientation:landscape)_and_(max-height:30rem)]:pb-4 [@media(orientation:landscape)_and_(max-height:30rem)]:pt-5 md:hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <h1 className="font-display font-black text-white text-[8rem] leading-none -mt-4">
              MENU
            </h1>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 mb-2 relative z-10">
            Daily Rituals
          </p>
          <h1 className="relative z-10 mb-2 font-display text-[clamp(1.75rem,8vw,3rem)] font-black uppercase tracking-tighter text-white sm:text-5xl">
            Our Menu
          </h1>
          <p className="relative z-10 max-w-sm text-sm leading-relaxed text-white/80">
            Carefully sourced beans, masterful techniques, and a touch of Japanese minimalism.
          </p>
        </div>

        {/* Desktop Header */}
        <section className="hidden md:block pt-10 pb-6 px-8 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-kado-red mb-3">
              Daily Rituals
            </p>
            <h1 className="font-display text-4xl lg:text-5xl font-black text-kado-dark mb-3 tracking-tighter uppercase">
              Our Menu
            </h1>
            <p className="text-kado-dark/60 text-base max-w-lg leading-relaxed">
              Carefully sourced beans, masterful techniques, and a touch of Japanese minimalism.
            </p>
          </div>
        </section>

        {/* Category tabs — one control: 2×2 grid on mobile, wrapped pills on md+ */}
        {catalogLoading ? (
          <CatalogPageSkeleton variant="menu" />
        ) : (
          <>
        <section className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[35] border-b border-kado-dark/5 bg-white/95 px-4 pb-4 pt-4 backdrop-blur-md sm:px-6 sm:pt-5 md:top-[calc(3.75rem+env(safe-area-inset-top,0px))] md:px-8 md:pb-5 md:pt-0 lg:px-16 [@media(orientation:landscape)_and_(max-height:30rem)]:py-2">
          <div className="mx-auto max-w-6xl min-w-0">
            <div
              className="menu-category-tabs grid grid-cols-2 gap-2 sm:gap-2.5 md:flex md:flex-wrap md:items-center md:gap-3 [@media(orientation:landscape)_and_(max-height:30rem)]:grid-cols-4 [@media(orientation:landscape)_and_(max-height:30rem)]:gap-1.5 [@media(orientation:landscape)_and_(max-height:30rem)_and_(min-width:48rem)]:flex [@media(orientation:landscape)_and_(max-height:30rem)_and_(min-width:48rem)]:flex-wrap"
              role="tablist"
              aria-label="Menu categories"
            >
              {sortedCategories.map((cat) => {
                const active = activeCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={cat.name}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`flex min-h-[44px] min-w-0 touch-manipulation items-center font-black uppercase tracking-widest transition-all duration-300 ${
                      active
                        ? 'bg-kado-red text-white shadow-lg shadow-kado-red/30'
                        : 'border border-kado-dark/15 bg-white text-kado-dark/70 hover:border-kado-red/50 hover:text-kado-red'
                    } flex-col justify-center gap-1.5 rounded-2xl px-2.5 py-3 text-[9px] leading-snug text-center sm:text-[10px] md:flex-row md:justify-start md:gap-2 md:rounded-full md:px-5 md:py-2.5 md:text-[11px] md:whitespace-nowrap md:text-left`}
                  >
                    {categoryIcon(cat.id, cat.name)}
                    <span className="md:hidden">{categoryShortLabel(cat.id, cat.name)}</span>
                    <span className="hidden md:inline">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Product grid */}
        <section className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-16">
          <div className="mx-auto min-w-0 max-w-6xl">
            {paginatedItems.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-kado-dark/10 bg-[#FAF7F2] p-12 text-center">
                <p className="text-sm font-semibold text-kado-dark/50">No drinks in this category yet.</p>
              </div>
            ) : (
            <motion.div
              key={`${activeCategoryId}-${safePage}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 gap-2.5 sm:gap-4 [@media(orientation:landscape)_and_(max-height:30rem)]:grid-cols-3 [@media(orientation:landscape)_and_(max-height:30rem)]:gap-2 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4"
            >
              {paginatedItems.map((product, i) => {
                const tag = isIcedOnlyDrink(product) ? 'Iced only' : product.tags?.[0];
                const inStock = isProductInStock(product);
                const desc = productFallbackDescription(product);

                return (
                  <motion.button
                    key={product.id}
                    id={menuProductDomId(product.id)}
                    type="button"
                    disabled={!inStock}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, ease: 'easeOut' }}
                    onClick={() => inStock && setSelectedProduct(product)}
                    className={`group flex h-full touch-manipulation flex-col overflow-hidden rounded-xl border bg-white text-left transition-all duration-300 focus:outline-none active:scale-[0.99] md:rounded-[1.25rem] ${
                      highlightProductId === product.id
                        ? 'border-kado-red ring-2 ring-kado-red ring-offset-2'
                        : 'border-kado-dark/10'
                    } ${
                      inStock
                        ? 'hover:-translate-y-0.5 hover:border-kado-red/30 hover:shadow-[0_12px_28px_rgba(158,24,29,0.08)] focus-visible:ring-2 focus-visible:ring-kado-red'
                        : 'cursor-not-allowed border-kado-dark/5 opacity-60'
                    }`}
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-kado-dark/5 shrink-0">
                      <MenuProductImage
                        product={product}
                        alt={product.name}
                        loading={i < 4 ? 'eager' : 'lazy'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {!inStock ? (
                        <span className="absolute top-2 left-2 text-[8px] font-black uppercase tracking-widest bg-amber-600 text-white px-2 py-0.5 rounded-full shadow">
                          Out of stock
                        </span>
                      ) : (
                        tag && (
                          <span className="absolute top-2 left-2 text-[8px] font-black uppercase tracking-widest bg-kado-dark text-white px-2 py-0.5 rounded-full shadow">
                            {tag}
                          </span>
                        )
                      )}

                      {/* Quick-add hint on hover */}
                      <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="bg-kado-red/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-full shadow-lg">
                          View details
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col p-2.5 sm:p-4">
                      <div className="mb-1 flex items-start justify-between gap-1.5 sm:gap-2">
                        <h3 className="line-clamp-2 font-display text-xs font-black leading-snug text-kado-dark transition-colors group-hover:text-kado-red sm:text-[0.95rem]">
                          {product.name}
                        </h3>
                        <span className="shrink-0 font-sans text-xs font-black text-kado-dark sm:text-base">
                          {formatPhp(product.basePrice)}
                        </span>
                      </div>
                      <p className="mt-auto line-clamp-2 pt-1 text-[10px] font-medium leading-relaxed text-kado-dark/60 sm:text-xs">
                        {desc}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
            )}

            <ProductGridPagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </section>
          </>
        )}

        {/* Loyalty card */}
        <section className="px-4 sm:px-6 md:px-8 lg:px-16 pb-[max(6rem,calc(5rem+env(safe-area-inset-bottom)))] mt-auto [@media(orientation:landscape)_and_(max-height:30rem)]:pb-16">
          <div className="max-w-6xl mx-auto border-t border-kado-dark/10 pt-16">
            <LoyaltyCard />
          </div>
        </section>
      </div>

      <PageSeoBlurb />

      {/* Product detail drawer */}
      <ProductDetailDrawer
        product={selectedProduct}
        categoryName={activeCategory?.name}
        onClose={() => {
          setSelectedProduct(null);
          clearMenuDeepLink();
        }}
      />
    </div>
  );
}

function LoyaltyCard() {
  return (
    <div className="w-full max-w-4xl mx-auto relative">
      <div className="absolute inset-0 bg-kado-red/10 translate-x-3 translate-y-3 rounded-[2.5rem]" />

      <div className="relative bg-kado-dark border border-[#4A423C] p-8 md:p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -bottom-16 opacity-[0.04] pointer-events-none">
          <Coffee className="w-64 h-64 text-white" />
        </div>

        <div className="flex flex-col text-center md:text-left z-10 max-w-sm">
          <p className="text-kado-red font-bold tracking-[0.2em] uppercase text-[10px] mb-3 flex items-center justify-center md:justify-start gap-2">
            <Star className="w-3.5 h-3.5 fill-current" /> Member Rewards
          </p>
          <h3 className="font-display text-3xl md:text-4xl text-kado-cream font-bold mb-4 leading-tight">
            Earn Your <br className="hidden md:block" />
            Free Cup.
          </h3>
          <p className="text-[#A09A90] text-sm md:text-base font-medium leading-relaxed">
            Every coffee brings you closer to your next reward. Buy 9, get your 10th completely on
            us.
          </p>
        </div>

        <div className="relative bg-white/5 p-6 md:p-8 rounded-3xl border border-white/5 z-10 w-full md:w-auto backdrop-blur-sm">
          <div className="grid grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="relative flex items-center justify-center">
                <div
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                    i < 3
                      ? 'border-kado-red bg-kado-red/10 text-kado-red shadow-[0_0_15px_rgba(158,24,29,0.25)]'
                      : 'border-white/10 bg-transparent text-white/20 border-dashed'
                  }`}
                >
                  {i === 9 ? (
                    <Star className={`w-5 h-5 md:w-6 md:h-6 ${i < 3 ? 'fill-current' : ''}`} />
                  ) : (
                    <Coffee className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </div>
                {i < 3 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.12, type: 'spring', stiffness: 220 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 border-[3px] border-kado-red rounded-full opacity-40 flex items-center justify-center">
                      <span className="text-[7px] font-bold text-kado-red uppercase tracking-widest rotate-12">
                        Kado
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
