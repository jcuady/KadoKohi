/** Page numbers + ellipses for catalog grids (Menu / Merch). */

export const PRODUCT_GRID_PAGE_SIZE = 8;

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
  onPageChange: (page: number) => void;
  className?: string;
}

export default function ProductGridPagination({
  page,
  totalPages,
  onPageChange,
  className = '',
}: ProductGridPaginationProps) {
  if (totalPages <= 1) return null;

  const items = getPaginationItems(page, totalPages);

  return (
    <nav
      className={`mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-1.5 md:gap-2 ${className}`}
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="min-w-[2.25rem] h-9 rounded-full border border-kado-dark/10 flex items-center justify-center text-sm text-kado-dark disabled:text-kado-dark/30 disabled:cursor-not-allowed hover:border-kado-dark/25 hover:bg-kado-dark/[0.04] transition-colors"
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
            className={`min-w-[2.25rem] h-9 px-2 rounded-full text-sm font-bold flex items-center justify-center transition-colors ${
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
        className="min-w-[2.25rem] h-9 rounded-full border border-kado-dark/10 flex items-center justify-center text-sm text-kado-dark disabled:text-kado-dark/30 disabled:cursor-not-allowed hover:border-kado-dark/25 hover:bg-kado-dark/[0.04] transition-colors"
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
