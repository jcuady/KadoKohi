/** Page numbers + ellipses for catalog grids (Menu / Merch). */

export const PRODUCT_GRID_PAGE_SIZE = 12;

export function getPaginationItems(
  current: number,
  total: number,
): (number | 'ellipsis')[] {
  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, 'ellipsis', total];
  }
  if (current >= total - 2) {
    return [1, 'ellipsis', total - 3, total - 2, total - 1, total];
  }
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

interface ProductGridPaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function paginationRangeLabel(
  page: number,
  pageSize: number,
  totalItems: number,
): string | null {
  if (totalItems <= 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return `Showing ${start}–${end} of ${totalItems}`;
}

export default function ProductGridPagination({
  page,
  totalPages,
  totalItems,
  pageSize = PRODUCT_GRID_PAGE_SIZE,
  onPageChange,
  className = '',
}: ProductGridPaginationProps) {
  if (totalPages <= 1 && !totalItems) return null;

  const items = getPaginationItems(page, totalPages);
  const rangeLabel =
    totalItems != null ? paginationRangeLabel(page, pageSize, totalItems) : null;

  return (
    <div className={`mt-8 md:mt-10 space-y-3 ${className}`}>
      {rangeLabel ? (
        <p className="text-center text-[10px] font-bold uppercase tracking-wider text-kado-dark/45">
          {rangeLabel}
        </p>
      ) : null}
      {totalPages <= 1 ? null : (
    <nav
      className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex h-11 min-h-[44px] min-w-[2.75rem] items-center justify-center rounded-full border border-kado-dark/10 text-sm text-kado-dark transition-colors hover:border-kado-dark/25 hover:bg-kado-dark/[0.04] disabled:cursor-not-allowed disabled:text-kado-dark/30 md:h-9 md:min-h-0 md:min-w-[2.25rem]"
        aria-label="Previous page"
      >
        ‹
      </button>
      {items.map((item, i) =>
        item === 'ellipsis' ? (
          <span
            key={`e-${i}`}
            className="px-1 text-kado-dark/40 font-bold text-sm select-none"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={`flex h-11 min-h-[44px] min-w-[2.75rem] items-center justify-center rounded-full px-2 text-sm font-bold transition-colors md:h-9 md:min-h-0 md:min-w-[2.25rem] ${
              page === item
                ? 'bg-kado-dark text-white shadow-md'
                : 'border border-kado-dark/10 text-kado-dark hover:border-kado-dark/30 hover:bg-kado-dark/[0.04]'
            }`}
            aria-current={page === item ? 'page' : undefined}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-11 min-h-[44px] min-w-[2.75rem] items-center justify-center rounded-full border border-kado-dark/10 text-sm text-kado-dark transition-colors hover:border-kado-dark/25 hover:bg-kado-dark/[0.04] disabled:cursor-not-allowed disabled:text-kado-dark/30 md:h-9 md:min-h-0 md:min-w-[2.25rem]"
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
      )}
    </div>
  );
}
