import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { MenuCatalogFilters, MenuSortKey, MenuTemperatureFilter } from '../../lib/menuCatalogFilters';
import { hasQrFilteredBrowse } from '../../lib/menuCatalogFilters';
import { qrPillClass } from '../../lib/qrGuestTheme';

type CategoryTab = { id: string; name: string };

type Props = {
  filters: MenuCatalogFilters;
  categoryTabs: CategoryTab[];
  activeCategoryId: string;
  resultCount: number;
  onFiltersChange: (patch: Partial<MenuCatalogFilters>) => void;
  onClearFilters: () => void;
  onCategoryPillClick: (categoryId: string) => void;
};

const selectClass =
  'qr-field min-h-[44px] flex-1 rounded-full px-3 text-[9px] font-black uppercase tracking-wider outline-none focus:border-kado-red/40 focus:ring-2 focus:ring-kado-red/10 [@media(orientation:landscape)_and_(max-height:30rem)]:min-h-[40px]';

export default function QrCatalogToolbar({
  filters,
  categoryTabs,
  activeCategoryId,
  resultCount,
  onFiltersChange,
  onClearFilters,
  onCategoryPillClick,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filteredMode = hasQrFilteredBrowse(filters);

  return (
    <div className="qr-toolbar-panel space-y-2.5 border-b px-3 py-2.5 backdrop-blur-md sm:px-4 [@media(orientation:landscape)_and_(max-height:30rem)]:space-y-2 [@media(orientation:landscape)_and_(max-height:30rem)]:py-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kado-red/60" />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => onFiltersChange({ query: e.target.value })}
          placeholder="Search drinks, flavors, tags…"
          aria-label="Search menu"
          className="qr-field w-full min-h-[44px] rounded-full py-2 pl-10 pr-10 text-sm font-medium outline-none focus:border-kado-red/40 focus:ring-2 focus:ring-kado-red/10 [@media(orientation:landscape)_and_(max-height:30rem)]:min-h-[40px]"
        />
        {filters.query ? (
          <button
            type="button"
            onClick={() => onFiltersChange({ query: '' })}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full qr-text-subtle hover:bg-[var(--qr-image-placeholder)] touch-manipulation"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 text-[9px] font-black uppercase tracking-wider touch-manipulation [@media(orientation:landscape)_and_(max-height:30rem)]:min-h-[40px] ${
            filteredMode
              ? 'border-kado-red/40 bg-kado-red/10 text-kado-red'
              : 'qr-payment-idle border'
          }`}
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>
        <span className="qr-text-subtle text-[9px] font-bold uppercase tracking-[0.12em]">
          {resultCount} item{resultCount === 1 ? '' : 's'}
        </span>
        {filteredMode ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="ml-auto min-h-[44px] rounded-full border border-kado-red/25 px-3.5 text-[9px] font-black uppercase tracking-wider text-kado-red touch-manipulation [@media(orientation:landscape)_and_(max-height:30rem)]:min-h-[40px]"
          >
            Clear
          </button>
        ) : null}
      </div>

      {filtersOpen ? (
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.temperature}
            onChange={(e) => onFiltersChange({ temperature: e.target.value as MenuTemperatureFilter })}
            className={selectClass}
            aria-label="Temperature filter"
          >
            <option value="all">All temps</option>
            <option value="hot">Hot</option>
            <option value="iced">Iced</option>
            <option value="both">Hot & iced</option>
          </select>
          <select
            value={filters.sort}
            onChange={(e) => onFiltersChange({ sort: e.target.value as MenuSortKey })}
            className={selectClass}
            aria-label="Sort"
          >
            <option value="order">Default</option>
            <option value="name">Name A–Z</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
          <label className="qr-field inline-flex min-h-[44px] flex-1 cursor-pointer items-center gap-2 rounded-full px-3 text-[9px] font-black uppercase tracking-wider [@media(orientation:landscape)_and_(max-height:30rem)]:min-h-[40px]">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) => onFiltersChange({ inStockOnly: e.target.checked })}
              className="rounded accent-kado-red"
            />
            In stock
          </label>
        </div>
      ) : null}

      {!filteredMode ? (
        <div className="guest-order-category-rail -mx-1 flex gap-2 overflow-x-auto pb-0.5">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onCategoryPillClick(tab.id)}
              className={qrPillClass(activeCategoryId === tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="qr-text-subtle text-[9px] font-bold uppercase tracking-[0.12em] px-0.5">
          Clear filters to return to full menu browse
        </p>
      )}
    </div>
  );
}
