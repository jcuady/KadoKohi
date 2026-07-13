import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Coffee, Leaf, IceCreamCone, Star, Croissant } from 'lucide-react';
import { useMenuStore } from '../store/menuStore';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import ProductGridPagination, { PRODUCT_GRID_PAGE_SIZE } from '../components/ProductGridPagination';
import CatalogPageSkeleton from '../components/catalog/CatalogPageSkeleton';
import CatalogToolbar from '../components/catalog/CatalogToolbar';
import MenuProductCard from '../components/catalog/MenuProductCard';
import type { Product } from '../types/domain';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import {
  baseProductsForFilters,
  DEFAULT_MENU_CATALOG_FILTERS,
  filterMenuProducts,
  hasActiveMenuFilters,
  parseMenuCatalogFilters,
  parseMenuPage,
  shouldPaginateMenuCatalog,
  writeMenuCatalogFilters,
  type MenuCatalogFilters,
} from '../lib/menuCatalogFilters';
import {
  findVisibleMenuProduct,
  menuProductDomId,
  pageForProductInList,
} from '../lib/menuDeepLink';

const ALL_CATEGORY_ID = 'all';

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
  const remoteLoaded = useMenuStore((s) => s.remoteLoaded);
  const catalogLoading = !remoteLoaded;

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );

  const filters = useMemo(() => parseMenuCatalogFilters(searchParams), [searchParams]);
  const page = parseMenuPage(searchParams);

  const filterCtx = useMemo(() => {
    const byCategory = new Map<string, Product[]>();
    for (const product of products) {
      if (!product.visible) continue;
      const list = byCategory.get(product.categoryId);
      if (list) list.push(product);
      else byCategory.set(product.categoryId, [product]);
    }
    for (const list of byCategory.values()) {
      list.sort((a, b) => a.order - b.order);
    }
    return {
      categories: sortedCategories,
      productsByCategory: (categoryId: string) => byCategory.get(categoryId) ?? [],
    };
  }, [sortedCategories, products]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [highlightProductId, setHighlightProductId] = useState<string | null>(null);
  const deepLinkHandled = useRef('');
  const openProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const updateFilters = (patch: Partial<MenuCatalogFilters>) => {
    const next = { ...filters, ...patch };
    const params = writeMenuCatalogFilters(searchParams, next, 1);
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    const params = writeMenuCatalogFilters(searchParams, DEFAULT_MENU_CATALOG_FILTERS, 1);
    setSearchParams(params, { replace: true });
  };

  const setPage = (nextPage: number) => {
    const params = writeMenuCatalogFilters(searchParams, filters, nextPage);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    if (!remoteLoaded || !deepLinkCategoryId || deepLinkProductId) return;
    if (sortedCategories.some((c) => c.id === deepLinkCategoryId)) {
      updateFilters({ categoryId: deepLinkCategoryId });
    }
  }, [remoteLoaded, deepLinkCategoryId, deepLinkProductId, sortedCategories]);

  useEffect(() => {
    if (!remoteLoaded || !deepLinkProductId) return;
    if (deepLinkHandled.current === deepLinkProductId) return;

    const product = findVisibleMenuProduct(products, deepLinkProductId);
    if (!product?.categoryId) return;

    const base = baseProductsForFilters(
      { ...filters, categoryId: product.categoryId },
      filterCtx,
    );
    const filtered = filterMenuProducts(base, filters, filterCtx);
    const targetPage = pageForProductInList(product.id, filtered, PRODUCT_GRID_PAGE_SIZE);

    deepLinkHandled.current = deepLinkProductId;
    const params = writeMenuCatalogFilters(
      searchParams,
      { ...filters, categoryId: product.categoryId },
      targetPage ?? 1,
    );
    setSearchParams(params, { replace: true });
    setSelectedProduct(product);
    setHighlightProductId(product.id);
  }, [remoteLoaded, deepLinkProductId, products, filters, filterCtx, searchParams, setSearchParams]);

  useEffect(() => {
    if (!deepLinkProductId) deepLinkHandled.current = '';
  }, [deepLinkProductId]);

  const activeCategory = useMemo(() => {
    if (filters.categoryId === ALL_CATEGORY_ID) return undefined;
    return sortedCategories.find((c) => c.id === filters.categoryId);
  }, [sortedCategories, filters.categoryId]);

  const baseItems = useMemo(
    () => baseProductsForFilters(filters, filterCtx),
    [filters, filterCtx],
  );

  const filteredItems = useMemo(
    () => filterMenuProducts(baseItems, filters, filterCtx),
    [baseItems, filters, filterCtx],
  );

  const shouldPaginate = shouldPaginateMenuCatalog(
    filters,
    filteredItems.length,
    PRODUCT_GRID_PAGE_SIZE,
  );
  const browsingAllUnfiltered =
    filters.categoryId === ALL_CATEGORY_ID &&
    !hasActiveMenuFilters(filters) &&
    filteredItems.length > 0;

  const totalPages =
    filteredItems.length === 0 ? 1 : Math.ceil(filteredItems.length / PRODUCT_GRID_PAGE_SIZE);
  const safePage =
    filteredItems.length === 0 ? 1 : Math.min(Math.max(1, page), totalPages);

  const paginatedItems = useMemo(() => {
    if (!shouldPaginate) return filteredItems;
    const start = (safePage - 1) * PRODUCT_GRID_PAGE_SIZE;
    return filteredItems.slice(start, start + PRODUCT_GRID_PAGE_SIZE);
  }, [filteredItems, safePage, shouldPaginate]);

  useEffect(() => {
    if (filteredItems.length === 0 || page === safePage) return;
    const params = writeMenuCatalogFilters(searchParams, filters, safePage);
    setSearchParams(params, { replace: true });
  }, [filteredItems.length, page, safePage, filters, searchParams, setSearchParams]);

  const clearMenuDeepLink = () => {
    deepLinkHandled.current = '';
    setHighlightProductId(null);
    if (!searchParams.has('product') && !searchParams.has('category')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('product');
    if (filters.categoryId === ALL_CATEGORY_ID) next.delete('category');
    setSearchParams(next, { replace: true });
  };

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
  }, [highlightProductId, deepLinkProductId, paginatedItems, safePage, filters.categoryId]);

  const emptyMessage = hasActiveMenuFilters(filters)
    ? 'No drinks match your search or filters. Try clearing filters or another category.'
    : filters.categoryId === ALL_CATEGORY_ID
      ? 'No drinks on the menu yet.'
      : 'No drinks in this category yet.';

  return (
    <div className="customer-menu-page relative w-full font-sans">
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
        <section className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[35] border-b border-kado-dark/5 bg-kado-offwhite/95 px-4 pb-0 pt-4 backdrop-blur-md sm:px-6 md:top-[calc(3.75rem+env(safe-area-inset-top,0px))] md:px-8 lg:px-16 [@media(orientation:landscape)_and_(max-height:30rem)]:py-2">
          <div className="mx-auto max-w-6xl min-w-0 space-y-0">
            <div
              className="menu-category-tabs grid grid-cols-2 gap-2 sm:gap-2.5 md:flex md:flex-wrap md:items-center md:gap-3 [@media(orientation:landscape)_and_(max-height:30rem)]:grid-cols-4 [@media(orientation:landscape)_and_(max-height:30rem)]:gap-1.5 [@media(orientation:landscape)_and_(max-height:30rem)_and_(min-width:48rem)]:flex [@media(orientation:landscape)_and_(max-height:30rem)_and_(min-width:48rem)]:flex-wrap"
              role="tablist"
              aria-label="Menu categories"
            >
              <button
                type="button"
                role="tab"
                aria-selected={filters.categoryId === ALL_CATEGORY_ID}
                aria-label="All items"
                onClick={() => updateFilters({ categoryId: ALL_CATEGORY_ID })}
                className={`flex min-h-[44px] min-w-0 touch-manipulation items-center font-black uppercase tracking-widest transition-all duration-300 ${
                  filters.categoryId === ALL_CATEGORY_ID
                    ? 'bg-kado-red text-white shadow-lg shadow-kado-red/30'
                    : 'border border-kado-dark/15 bg-white text-kado-dark/70 hover:border-kado-red/50 hover:text-kado-red'
                } flex-col justify-center gap-1.5 rounded-2xl px-2.5 py-3 text-[9px] leading-snug text-center sm:text-[10px] md:flex-row md:justify-start md:gap-2 md:rounded-full md:px-5 md:py-2.5 md:text-[11px] md:whitespace-nowrap md:text-left`}
              >
                <Coffee className="w-4 h-4 shrink-0" />
                <span>All items</span>
              </button>
              {sortedCategories.map((cat) => {
                const active = filters.categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={cat.name}
                    onClick={() => updateFilters({ categoryId: cat.id })}
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
            <CatalogToolbar
              filters={filters}
              resultCount={filteredItems.length}
              onChange={updateFilters}
              onClear={clearFilters}
            />
          </div>
        </section>

        {/* Product grid */}
        <section className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-16">
          <div className="mx-auto min-w-0 max-w-6xl">
            {browsingAllUnfiltered ? (
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-kado-dark/45">
                {filteredItems.length} drink{filteredItems.length === 1 ? '' : 's'} across{' '}
                {sortedCategories.length} categor{sortedCategories.length === 1 ? 'y' : 'ies'}
              </p>
            ) : null}
            {paginatedItems.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-kado-dark/10 bg-kado-offwhite p-12 text-center">
                <p className="text-sm font-semibold text-kado-dark/50">{emptyMessage}</p>
                {hasActiveMenuFilters(filters) ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-full bg-kado-dark px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : (
            <div className="menu-product-grid grid grid-cols-2 gap-2.5 sm:gap-4 [@media(orientation:landscape)_and_(max-height:30rem)]:grid-cols-3 [@media(orientation:landscape)_and_(max-height:30rem)]:gap-2 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
              {paginatedItems.map((product, i) => (
                <MenuProductCard
                  key={product.id}
                  product={product}
                  highlight={highlightProductId === product.id}
                  imagePriority={i < 4}
                  onSelect={openProduct}
                />
              ))}
            </div>
            )}

            <ProductGridPagination
              page={safePage}
              totalPages={totalPages}
              totalItems={shouldPaginate ? filteredItems.length : undefined}
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
        categoryName={
          activeCategory?.name ??
          sortedCategories.find((c) => c.id === selectedProduct?.categoryId)?.name
        }
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
