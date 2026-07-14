import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Croissant, MapPin } from 'lucide-react';
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
import type { Product } from '../types/domain';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import { PASTRIES_PAGE } from '../content/pastriesPage';
import { hydratePastries } from '../lib/bootstrapHydration';
import { usePastriesContentStore } from '../store/pastriesContentStore';
import {
  DEFAULT_MENU_CATALOG_FILTERS,
  filterMenuProducts,
  hasActiveBrowseFilters,
  parseMenuCatalogFilters,
  parseMenuPage,
  shouldPaginateMenuCatalog,
  writeMenuCatalogFilters,
  type MenuCatalogFilters,
} from '../lib/menuCatalogFilters';

export default function Pastries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const remoteLoaded = useMenuStore((s) => s.remoteLoaded);
  const hydrateFromRemote = useMenuStore((s) => s.hydrateFromRemote);
  const cmsContent = usePastriesContentStore((s) => s.content);
  const pastriesHydrated = usePastriesContentStore((s) => s.hydrated);
  const [selected, setSelected] = useState<Product | null>(null);

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
  const filters: MenuCatalogFilters = useMemo(
    () => ({
      ...rawFilters,
      categoryId: pastriesCategory?.id ?? 'all',
      temperature: 'all',
    }),
    [rawFilters, pastriesCategory?.id],
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

  const filteredItems = useMemo(
    () => filterMenuProducts(pastryBase, filters, filterCtx),
    [pastryBase, filters, filterCtx],
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
      categoryId: pastriesCategory?.id ?? 'all',
      temperature: 'all' as const,
    };
    const params = writeMenuCatalogFilters(searchParams, next, 1);
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    const next = {
      ...DEFAULT_MENU_CATALOG_FILTERS,
      categoryId: pastriesCategory?.id ?? 'all',
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
  const title = `${hero.headlineTop} ${hero.headlineBottom}`.replace(/\s+/g, ' ').trim() || 'Our Pastries';
  const catalogLoading = !remoteLoaded;
  const showPoster = Boolean(poster.primaryImage?.trim() || poster.secondaryImage?.trim());

  const pastryFiltersActive = hasActiveBrowseFilters(filters);
  const pastryCategoryId = pastriesCategory?.id ?? 'all';
  const pastryCategoryItems = useMemo(
    () => [
      {
        id: pastryCategoryId,
        label: 'All pastries',
        shortLabel: 'All',
        icon: <Croissant className="h-4 w-4 shrink-0" aria-hidden />,
      },
    ],
    [pastryCategoryId],
  );

  return (
    <>
      <CatalogPageFrame ribbon="MENU" eyebrow={hero.eyebrow} title={title} subhead={hero.subhead}>
        {catalogLoading ? (
          <CatalogPageSkeleton variant="menu" />
        ) : (
          <>
            <section
              className="catalog-filter-panel sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[35] border-b border-kado-dark/8 bg-kado-offwhite/95 px-4 pb-3 pt-3 backdrop-blur-md sm:px-6 sm:pb-4 sm:pt-4 md:top-[calc(3.75rem+env(safe-area-inset-top,0px))] md:px-8 lg:px-16 [@media(orientation:landscape)_and_(max-height:30rem)]:py-2"
              aria-label="Pastries filters"
            >
              <div className="mx-auto flex min-w-0 max-w-6xl flex-col gap-3 sm:gap-3.5 md:gap-4">
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <CatalogCategoryRail
                      items={pastryCategoryItems}
                      value={pastryCategoryId}
                      onChange={() => undefined}
                      ariaLabel="Pastries catalog"
                    />
                  </div>
                  {hero.badge ? (
                    <span className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-kado-dark/12 bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-kado-dark/65 sm:px-3.5">
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
                  searchPlaceholder="Search pastries…"
                  searchAriaLabel="Search pastries"
                />
              </div>
            </section>

            <section className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-9 lg:px-16">
              <div className="mx-auto min-w-0 max-w-6xl">
                {!pastryFiltersActive && filteredItems.length > 0 ? (
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-kado-dark/45 sm:mb-5">
                    {filteredItems.length}{' '}
                    {filteredItems.length === 1 ? 'pastry' : 'pastries'} · {cta.title}
                  </p>
                ) : null}

                {paginatedItems.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-kado-dark/10 bg-kado-cream/40 px-6 py-12 text-center sm:py-14">
                    <p className="text-sm font-semibold text-kado-dark/50">
                      {pastryFiltersActive
                        ? 'No pastries match your search or filters.'
                        : 'Pastries will appear here once added in Menu Manager.'}
                    </p>
                    {pastryFiltersActive ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-4 min-h-11 rounded-full bg-kado-dark px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white touch-manipulation"
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
              <section className="px-4 sm:px-6 md:px-8 lg:px-16" aria-label="Pastries gallery">
                <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 sm:gap-4">
                  {poster.primaryImage?.trim() ? (
                    <div className="overflow-hidden rounded-[1.25rem] border border-kado-dark/10 bg-kado-cream aspect-[4/3] sm:aspect-[5/4]">
                      <img
                        src={poster.primaryImage}
                        alt="Kado Kohi pastries"
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                  {poster.secondaryImage?.trim() ? (
                    <div className="overflow-hidden rounded-[1.25rem] border border-kado-dark/10 bg-kado-cream aspect-[4/3] sm:aspect-[5/4]">
                      <img
                        src={poster.secondaryImage}
                        alt="Fresh bakes at Kado Kohi"
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
                <div className="mx-auto w-full max-w-3xl rounded-[1.25rem] border border-kado-red/20 bg-kado-red px-5 py-7 text-center text-white sm:rounded-[1.5rem] sm:px-8 sm:py-8">
                  <p className="kado-body text-white/90">{cta.body}</p>
                  <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                    <Link
                      to="/branches"
                      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-kado-cream px-6 kado-label text-kado-red touch-manipulation hover:bg-kado-offwhite sm:w-auto"
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
        categoryName={pastriesCategory?.name ?? 'Pastries'}
        onClose={() => setSelected(null)}
      />

      <PageSeoBlurb />
    </>
  );
}
