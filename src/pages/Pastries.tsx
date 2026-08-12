import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Cookie, MapPin, Package, Tag } from 'lucide-react';
import { useMenuStore } from '../store/menuStore';
import {
  findPastriesCategory,
  pastryHasPrice,
  pastriesProducts,
} from '../lib/pastriesCategory';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import ProductGridPagination, { PRODUCT_GRID_PAGE_SIZE } from '../components/ProductGridPagination';
import CatalogPageSkeleton from '../components/catalog/CatalogPageSkeleton';
import CatalogToolbar from '../components/catalog/CatalogToolbar';
import CatalogCategoryRail from '../components/catalog/CatalogCategoryRail';
import CatalogPageFrame from '../components/catalog/CatalogPageFrame';
import MenuProductCard from '../components/catalog/MenuProductCard';
import KukiBoxBuilder from '../components/pastries/KukiBoxBuilder';
import KukiBoxesShowcase from '../components/pastries/KukiBoxesShowcase';
import type { Product } from '../types/domain';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import { PASTRIES_PAGE } from '../content/pastriesPage';
import { hydratePastries } from '../lib/bootstrapHydration';
import { usePastriesContentStore } from '../store/pastriesContentStore';
import {
  DEFAULT_MENU_CATALOG_FILTERS,
  filterMenuProducts,
  hasActiveBrowseFilters,
  isPromoFilterId,
  MENU_PROMO_FILTER_ID,
  parseMenuCatalogFilters,
  parseMenuPage,
  shouldPaginateMenuCatalog,
  writeMenuCatalogFilters,
  type MenuCatalogFilters,
} from '../lib/menuCatalogFilters';
import { hasProductDiscount } from '../lib/productPricing';
import { KUKIDO_BLUE, KUKIDO_BLUE_DEEP, KUKI_SINGLE_PRICE, type KukiBoxSize } from '../lib/kukido';
import { formatPhp } from '../lib/money';

export default function Pastries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const remoteLoaded = useMenuStore((s) => s.remoteLoaded);
  const hydrateFromRemote = useMenuStore((s) => s.hydrateFromRemote);
  const cmsContent = usePastriesContentStore((s) => s.content);
  const pastriesHydrated = usePastriesContentStore((s) => s.hydrated);
  const [selected, setSelected] = useState<Product | null>(null);
  const [boxOpen, setBoxOpen] = useState(false);
  const [boxInitialSize, setBoxInitialSize] = useState<KukiBoxSize>(4);

  const openKukiBox = useCallback((size: KukiBoxSize = 4) => {
    setBoxInitialSize(size);
    setBoxOpen(true);
  }, []);

  const scrollToKukiBoxes = useCallback(() => {
    document.getElementById('kuki-boxes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    void hydrateFromRemote();
    void hydratePastries();
  }, [hydrateFromRemote]);

  const pastriesCategory = useMemo(() => findPastriesCategory(categories), [categories]);
  const pastryBase = useMemo(
    () => pastriesProducts(categories, products).filter((p) => pastryHasPrice(p)),
    [categories, products],
  );

  const rawFilters = useMemo(() => parseMenuCatalogFilters(searchParams), [searchParams]);
  const pastryCategoryId = pastriesCategory?.id ?? 'all';
  const filters: MenuCatalogFilters = useMemo(
    () => ({
      ...rawFilters,
      categoryId: isPromoFilterId(rawFilters.categoryId)
        ? MENU_PROMO_FILTER_ID
        : pastryCategoryId,
      temperature: 'all',
    }),
    [rawFilters, pastryCategoryId],
  );
  const page = parseMenuPage(searchParams);

  const filterCtx = useMemo(
    () => ({
      categories,
      productsByCategory: (categoryId: string) =>
        products.filter((p) => p.visible && p.categoryId === categoryId).sort((a, b) => a.order - b.order),
    }),
    [categories, products],
  );

  const pastryBaseForRail = useMemo(
    () =>
      isPromoFilterId(filters.categoryId)
        ? pastryBase.filter((p) => hasProductDiscount(p))
        : pastryBase,
    [pastryBase, filters.categoryId],
  );

  const filteredItems = useMemo(
    () =>
      filterMenuProducts(
        pastryBaseForRail,
        { ...filters, categoryId: pastryCategoryId },
        filterCtx,
      ),
    [pastryBaseForRail, filters, pastryCategoryId, filterCtx],
  );

  const shouldPaginate = shouldPaginateMenuCatalog(
    filters,
    filteredItems.length,
    PRODUCT_GRID_PAGE_SIZE,
  );
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

  const updateFilters = (patch: Partial<MenuCatalogFilters>) => {
    const next = {
      ...filters,
      ...patch,
      temperature: 'all' as const,
    };
    if (patch.categoryId === undefined && !isPromoFilterId(next.categoryId)) {
      next.categoryId = pastryCategoryId;
    }
    const params = writeMenuCatalogFilters(searchParams, next, 1);
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    const next = {
      ...DEFAULT_MENU_CATALOG_FILTERS,
      categoryId: pastryCategoryId,
    };
    const params = writeMenuCatalogFilters(searchParams, next, 1);
    setSearchParams(params, { replace: true });
  };

  const setPage = (nextPage: number) => {
    const params = writeMenuCatalogFilters(searchParams, filters, nextPage);
    setSearchParams(params, { replace: true });
  };

  const openProduct = useCallback((product: Product) => setSelected(product), []);

  const { hero, cta, poster } = pastriesHydrated ? cmsContent : PASTRIES_PAGE;
  const title = `${hero.headlineTop} ${hero.headlineBottom}`.replace(/\s+/g, ' ').trim() || 'Cookie Menu';
  const catalogLoading = !remoteLoaded;
  const showPoster = Boolean(poster.primaryImage?.trim() || poster.secondaryImage?.trim());

  const pastryFiltersActive = hasActiveBrowseFilters(filters) || isPromoFilterId(filters.categoryId);
  const pastryCategoryItems = useMemo(
    () => [
      {
        id: pastryCategoryId,
        label: 'All cookies',
        shortLabel: 'All',
        icon: <Cookie className="h-4 w-4 shrink-0" aria-hidden />,
      },
      {
        id: MENU_PROMO_FILTER_ID,
        label: 'On promo',
        shortLabel: 'Promo',
        icon: <Tag className="h-4 w-4 shrink-0" aria-hidden />,
      },
    ],
    [pastryCategoryId],
  );

  return (
    <>
      <CatalogPageFrame
        ribbon="KUKIDO"
        accent="kukido"
        eyebrow={hero.eyebrow}
        title={title}
        subhead={hero.subhead}
      >
        {catalogLoading ? (
          <CatalogPageSkeleton variant="menu" />
        ) : (
          <>
            <section
              className="catalog-filter-panel sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[35] border-b border-kado-dark/8 bg-kado-offwhite/95 px-4 pb-3 pt-3 backdrop-blur-md sm:px-6 sm:pb-4 sm:pt-4 md:top-[calc(3.75rem+env(safe-area-inset-top,0px))] md:px-8 lg:px-16 [@media(orientation:landscape)_and_(max-height:30rem)]:py-2"
              aria-label="Cookie filters"
            >
              <div className="mx-auto flex min-w-0 max-w-6xl flex-col gap-3 sm:gap-3.5 md:gap-4">
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <CatalogCategoryRail
                      items={pastryCategoryItems}
                      value={filters.categoryId}
                      onChange={(id) => updateFilters({ categoryId: id })}
                      ariaLabel="Cookie catalog"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={scrollToKukiBoxes}
                    className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[10px] font-black uppercase tracking-[0.12em] text-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation"
                    style={{ backgroundColor: KUKIDO_BLUE }}
                  >
                    <Package className="h-3.5 w-3.5" aria-hidden />
                    Kuki Boxes
                  </button>
                  {hero.badge ? (
                    <span
                      className="inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-[10px] font-bold uppercase tracking-wider sm:px-3.5"
                      style={{ borderColor: `${KUKIDO_BLUE}33`, color: KUKIDO_BLUE_DEEP, backgroundColor: '#EEF3FF' }}
                    >
                      {hero.badge}
                    </span>
                  ) : null}
                  {hero.badgeNote ? (
                    <span className="kado-subtext hidden font-semibold uppercase tracking-wider text-kado-dark/45 md:inline">
                      {hero.badgeNote}
                    </span>
                  ) : null}
                </div>
                <CatalogToolbar
                  filters={filters}
                  resultCount={filteredItems.length}
                  onChange={updateFilters}
                  onClear={clearFilters}
                  hideTemperature
                  searchPlaceholder="Search cookies…"
                  searchAriaLabel="Search cookies"
                />
              </div>
            </section>

            <KukiBoxesShowcase onBuild={openKukiBox} />

            <section className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-9 lg:px-16">
              <div className="mx-auto min-w-0 max-w-6xl">
                {!pastryFiltersActive && filteredItems.length > 0 ? (
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-kado-dark/45 sm:mb-5">
                    {filteredItems.length}{' '}
                    {filteredItems.length === 1 ? 'cookie' : 'cookies'} · {formatPhp(KUKI_SINGLE_PRICE)} each ·{' '}
                    {cta.title}
                  </p>
                ) : isPromoFilterId(filters.categoryId) && filteredItems.length > 0 ? (
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-kado-dark/45 sm:mb-5">
                    {filteredItems.length} on promo
                  </p>
                ) : null}

                {paginatedItems.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-kado-dark/10 bg-kado-cream/40 px-6 py-12 text-center sm:py-14">
                    <p className="text-sm font-semibold text-kado-dark/50">
                      {isPromoFilterId(filters.categoryId)
                        ? 'No discounted cookies right now. Check back soon or browse all cookies.'
                        : pastryFiltersActive
                          ? 'No cookies match your search or filters.'
                          : 'Cookies will appear here once added in Menu Manager.'}
                    </p>
                    {pastryFiltersActive ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-4 min-h-11 rounded-full px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white touch-manipulation"
                        style={{ backgroundColor: KUKIDO_BLUE_DEEP }}
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
                        highlight={false}
                        imagePriority={i < 4}
                        onSelect={openProduct}
                        pastriesCategoryId={pastriesCategory?.id}
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

            {showPoster ? (
              <section className="px-4 sm:px-6 md:px-8 lg:px-16" aria-label="Cookie gallery">
                <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 sm:gap-4">
                  {poster.primaryImage?.trim() ? (
                    <div className="aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-kado-dark/10 bg-kado-cream sm:aspect-[5/4]">
                      <img
                        src={poster.primaryImage}
                        alt="kukidō cookies at Kado Kohi"
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                  {poster.secondaryImage?.trim() ? (
                    <div className="aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-kado-dark/10 bg-kado-cream sm:aspect-[5/4]">
                      <img
                        src={poster.secondaryImage}
                        alt="Fresh kukidō cookie plate"
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="px-4 pb-[max(6rem,calc(5rem+env(safe-area-inset-bottom)))] sm:px-6 md:px-8 lg:px-16">
              <div className="mx-auto max-w-6xl border-t border-kado-dark/10 pt-10 sm:pt-14">
                <div
                  className="mx-auto w-full max-w-3xl rounded-[1.25rem] px-5 py-7 text-center text-white sm:rounded-[1.5rem] sm:px-8 sm:py-8"
                  style={{ backgroundColor: KUKIDO_BLUE }}
                >
                  <p className="kado-body text-white/90">{cta.body}</p>
                  <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                    <button
                      type="button"
                      onClick={() => openKukiBox(4)}
                      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-white px-6 kado-label touch-manipulation sm:w-auto"
                      style={{ color: KUKIDO_BLUE_DEEP }}
                    >
                      <Package className="h-4 w-4 shrink-0" aria-hidden />
                      Build a Kuki Box
                    </button>
                    <Link
                      to="/branches"
                      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 kado-label text-white touch-manipulation hover:bg-white/10 sm:w-auto"
                    >
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                      Find a branch
                    </Link>
                    <Link
                      to="/menu"
                      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 kado-label text-white touch-manipulation hover:bg-white/10 sm:w-auto"
                    >
                      View coffee menu
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </CatalogPageFrame>

      <ProductDetailDrawer
        product={selected}
        categoryName={pastriesCategory?.name ?? 'Cookies'}
        onClose={() => setSelected(null)}
      />

      <KukiBoxBuilder
        open={boxOpen}
        cookies={pastryBase}
        initialSize={boxInitialSize}
        onClose={() => setBoxOpen(false)}
      />

      <PageSeoBlurb />
    </>
  );
}
