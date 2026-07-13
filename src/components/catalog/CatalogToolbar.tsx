import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import type { MenuCatalogFilters, MenuSortKey, MenuTemperatureFilter } from '../../lib/menuCatalogFilters';
import { hasActiveBrowseFilters } from '../../lib/menuCatalogFilters';
import { cn } from '../../lib/utils';

const SEARCH_DEBOUNCE_MS = 280;

type Props = {
  filters: MenuCatalogFilters;
  resultCount: number;
  onChange: (patch: Partial<MenuCatalogFilters>) => void;
  onClear: () => void;
  /** Hide hot/iced control (pastries and other non-drink catalogs). */
  hideTemperature?: boolean;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
};

const TEMP_OPTIONS: { id: MenuTemperatureFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'hot', label: 'Hot' },
  { id: 'iced', label: 'Iced' },
  { id: 'both', label: 'Hot & iced' },
];

const SORT_LABELS: Record<MenuSortKey, string> = {
  order: 'Featured',
  name: 'Name A–Z',
  price_asc: 'Price ↑',
  price_desc: 'Price ↓',
};

export default function CatalogToolbar({
  filters,
  resultCount,
  onChange,
  onClear,
  hideTemperature = false,
  searchPlaceholder = 'Search the menu…',
  searchAriaLabel = 'Search menu',
}: Props) {
  const browseActive = hasActiveBrowseFilters(filters);
  const [draftQuery, setDraftQuery] = useState(filters.query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setDraftQuery(filters.query);
  }, [filters.query]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const commitQuery = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange({ query: value }), SEARCH_DEBOUNCE_MS);
  };

  const handleQueryChange = (value: string) => {
    setDraftQuery(value);
    commitQuery(value);
  };

  const clearQuery = () => {
    setDraftQuery('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onChange({ query: '' });
  };

  const handleClearAll = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setDraftQuery('');
    onClear();
  };

  return (
    <div className="catalog-toolbar space-y-3 sm:space-y-3.5 [@media(orientation:landscape)_and_(max-height:30rem)]:space-y-2">
      <div className="relative">
        <label htmlFor="catalog-search" className="sr-only">
          {searchAriaLabel}
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-kado-dark/40"
          aria-hidden
        />
        <input
          id="catalog-search"
          type="search"
          value={draftQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          autoComplete="off"
          className="w-full min-h-11 rounded-xl border border-kado-dark/12 bg-white py-2.5 pl-10 pr-10 text-sm text-kado-dark placeholder:text-kado-dark/40 outline-none transition-[border-color,box-shadow] focus:border-kado-red/40 focus:ring-2 focus:ring-kado-red/12 [@media(orientation:landscape)_and_(max-height:30rem)]:min-h-10"
        />
        {draftQuery ? (
          <button
            type="button"
            onClick={clearQuery}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-kado-dark/45 hover:bg-kado-dark/5 hover:text-kado-dark"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        {hideTemperature ? null : (
          <div
            className="catalog-temp-segment inline-flex w-full min-w-0 rounded-xl border border-kado-dark/12 bg-white p-1 sm:w-auto"
            role="group"
            aria-label="Filter by temperature"
          >
            {TEMP_OPTIONS.map((opt) => {
              const active = filters.temperature === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ temperature: opt.id })}
                  className={cn(
                    'min-h-9 flex-1 touch-manipulation rounded-lg px-2.5 text-[11px] font-semibold tracking-wide transition-colors sm:flex-none sm:px-3',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40',
                    active
                      ? 'bg-kado-dark text-kado-cream'
                      : 'text-kado-dark/65 hover:text-kado-dark',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="relative min-w-[9.5rem] flex-1 sm:flex-none">
            <label htmlFor="catalog-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="catalog-sort"
              value={filters.sort}
              onChange={(e) => onChange({ sort: e.target.value as MenuSortKey })}
              className="catalog-select min-h-11 w-full appearance-none rounded-xl border border-kado-dark/12 bg-white py-2 pl-3 pr-9 text-sm font-medium text-kado-dark outline-none transition-[border-color,box-shadow] focus:border-kado-red/40 focus:ring-2 focus:ring-kado-red/12 sm:min-w-[10.5rem]"
            >
              {(Object.keys(SORT_LABELS) as MenuSortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-kado-dark/40"
              aria-hidden
            />
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={filters.inStockOnly}
            onClick={() => onChange({ inStockOnly: !filters.inStockOnly })}
            className={cn(
              'inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40',
              filters.inStockOnly
                ? 'border-kado-red/30 bg-kado-red/8 text-kado-red'
                : 'border-kado-dark/12 bg-white text-kado-dark/70 hover:border-kado-dark/25',
            )}
          >
            <span
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded border',
                filters.inStockOnly ? 'border-kado-red bg-kado-red text-white' : 'border-kado-dark/25 bg-white',
              )}
              aria-hidden
            >
              {filters.inStockOnly ? <Check className="h-3 w-3 stroke-[3]" /> : null}
            </span>
            In stock
          </button>

          <p className="ml-auto text-xs font-medium tabular-nums text-kado-dark/50 sm:ml-0">
            <span className="font-semibold text-kado-dark/70">{resultCount}</span>
            {' '}
            {resultCount === 1 ? 'item' : 'items'}
          </p>

          {browseActive ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="min-h-11 rounded-xl px-3 text-sm font-semibold text-kado-red transition-colors hover:bg-kado-red/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
