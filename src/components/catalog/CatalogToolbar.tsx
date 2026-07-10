import { Search, X } from 'lucide-react';
import type { MenuCatalogFilters, MenuSortKey, MenuTemperatureFilter } from '../../lib/menuCatalogFilters';
import { hasActiveMenuFilters } from '../../lib/menuCatalogFilters';

type Props = {
  filters: MenuCatalogFilters;
  resultCount: number;
  onChange: (patch: Partial<MenuCatalogFilters>) => void;
  onClear: () => void;
};

const TEMP_LABELS: Record<MenuTemperatureFilter, string> = {
  all: 'All temps',
  hot: 'Hot',
  iced: 'Iced',
  both: 'Hot & iced',
};

const SORT_LABELS: Record<MenuSortKey, string> = {
  order: 'Default order',
  name: 'Name A–Z',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
};

const selectClass =
  'min-h-[44px] rounded-full border border-kado-dark/15 bg-white px-4 text-[10px] font-black uppercase tracking-wider text-kado-dark outline-none focus:border-kado-red/40 md:min-h-[40px]';

export default function CatalogToolbar({ filters, resultCount, onChange, onClear }: Props) {
  const active = hasActiveMenuFilters(filters);

  return (
    <div className="space-y-3 border-b border-kado-dark/5 bg-[#FAF7F2]/95 pb-4 pt-3 backdrop-blur-md [@media(orientation:landscape)_and_(max-height:30rem)]:space-y-2 [@media(orientation:landscape)_and_(max-height:30rem)]:pb-3 [@media(orientation:landscape)_and_(max-height:30rem)]:pt-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-kado-red/50" />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder="Search drinks, flavors, tags…"
          aria-label="Search menu"
          className="w-full min-h-[44px] rounded-full border border-kado-dark/15 bg-white py-2.5 pl-11 pr-11 text-sm font-medium text-kado-dark placeholder:text-kado-dark/40 outline-none focus:border-kado-red/40 focus:ring-2 focus:ring-kado-red/15 [@media(orientation:landscape)_and_(max-height:30rem)]:min-h-[40px]"
        />
        {filters.query ? (
          <button
            type="button"
            onClick={() => onChange({ query: '' })}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-kado-dark/50 hover:bg-kado-dark/5"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.temperature}
          onChange={(e) => onChange({ temperature: e.target.value as MenuTemperatureFilter })}
          className={selectClass}
          aria-label="Filter by temperature"
        >
          {(Object.keys(TEMP_LABELS) as MenuTemperatureFilter[]).map((key) => (
            <option key={key} value={key}>
              {TEMP_LABELS[key]}
            </option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as MenuSortKey })}
          className={selectClass}
          aria-label="Sort products"
        >
          {(Object.keys(SORT_LABELS) as MenuSortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>

        <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-kado-dark/15 bg-white px-4 text-[10px] font-black uppercase tracking-wider text-kado-dark md:min-h-[40px]">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onChange({ inStockOnly: e.target.checked })}
            className="rounded accent-kado-red"
          />
          In stock
        </label>

        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-kado-dark/50">
          {resultCount} result{resultCount === 1 ? '' : 's'}
        </span>

        {active ? (
          <button
            type="button"
            onClick={onClear}
            className="min-h-[44px] rounded-full border border-kado-red/30 px-4 text-[10px] font-black uppercase tracking-wider text-kado-red hover:bg-kado-red/5 md:min-h-[40px]"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
