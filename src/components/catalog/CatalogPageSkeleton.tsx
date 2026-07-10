import Skeleton from '../ui/Skeleton';
import { PRODUCT_GRID_PAGE_SIZE } from '../ProductGridPagination';

type Variant = 'menu' | 'merch';

type Props = {
  variant: Variant;
  categoryCount?: number;
  productCount?: number;
};

function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-kado-dark/10 bg-white md:rounded-[1.25rem]">
      <Skeleton className="aspect-[4/3] w-full shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-2.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-4 w-12 shrink-0" />
        </div>
        <Skeleton className="mt-auto h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

function MenuCategoryTabsSkeleton({ count }: { count: number }) {
  return (
    <div
      className="menu-category-tabs grid grid-cols-2 gap-2 sm:gap-2.5 md:flex md:flex-wrap md:items-center md:gap-3"
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          className="min-h-[44px] rounded-2xl md:min-h-[40px] md:rounded-full md:w-36"
        />
      ))}
    </div>
  );
}

function MerchCategoryTabsSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-nowrap gap-3 overflow-hidden md:flex-wrap" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-full md:w-32" />
      ))}
    </div>
  );
}

/**
 * Skeleton for /menu and /merch — category tabs + product grid only.
 * Static page headers stay visible for perceived performance.
 */
export default function CatalogPageSkeleton({
  variant,
  categoryCount = 4,
  productCount = PRODUCT_GRID_PAGE_SIZE,
}: Props) {
  const gridClass =
    variant === 'menu'
      ? 'grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4'
      : 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5';

  const tabsSectionClass =
    variant === 'menu'
      ? 'sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[35] border-b border-kado-dark/5 bg-white/95 px-4 pb-4 pt-4 backdrop-blur-md sm:px-6 sm:pt-5 md:top-[calc(3.75rem+env(safe-area-inset-top,0px))] md:px-8 md:pb-5 md:pt-0 lg:px-16'
      : 'sticky top-14 z-[35] border-b border-kado-dark/5 bg-white/95 px-6 pb-5 pt-4 backdrop-blur-md md:top-[3.75rem] md:px-8 lg:px-16';

  const gridSectionClass =
    variant === 'menu'
      ? 'px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-16'
      : 'px-6 py-8 md:px-8 md:py-10 lg:px-16';

  return (
    <>
      <section className={tabsSectionClass} aria-busy="true" aria-label="Loading categories">
        <div className="mx-auto max-w-6xl min-w-0 space-y-3">
          <Skeleton className="h-11 w-full rounded-full md:max-w-xl" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
          {variant === 'menu' ? (
            <MenuCategoryTabsSkeleton count={categoryCount} />
          ) : (
            <MerchCategoryTabsSkeleton count={categoryCount} />
          )}
        </div>
      </section>

      <section className={gridSectionClass} aria-busy="true" aria-label="Loading products">
        <div className="mx-auto min-w-0 max-w-6xl">
          <div className={gridClass}>
            {Array.from({ length: productCount }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
