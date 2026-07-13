import { Search, X } from 'lucide-react';
import type { Branch } from '../../types/domain';
import {
  CAREER_CATEGORY_LABELS,
  type CareerListingCategory,
} from '../../lib/careersPageContent';
import {
  hasActiveCareerFilters,
  type CareerCatalogFilters,
  type CareerSortKey,
} from '../../lib/careerCatalogFilters';

type Props = {
  filters: CareerCatalogFilters;
  resultCount: number;
  branches: Branch[];
  employmentTypes: string[];
  onChange: (patch: Partial<CareerCatalogFilters>) => void;
  onClear: () => void;
};

const SORT_LABELS: Record<CareerSortKey, string> = {
  recommended: 'Recommended',
  newest: 'Newest',
  title: 'Title A–Z',
};

const selectClass =
  'min-h-[40px] rounded-full border border-kado-dark/12 bg-white px-4 text-[10px] font-black uppercase tracking-wider text-kado-dark outline-none focus:border-kado-red/40';

export default function CareersToolbar({
  filters,
  resultCount,
  branches,
  employmentTypes,
  onChange,
  onClear,
}: Props) {
  const active = hasActiveCareerFilters(filters);
  const activeBranches = branches.filter((b) => b.status === 'active');

  return (
    <div className="space-y-3 border-b border-kado-dark/8 bg-kado-offwhite/95 pb-4 pt-3 backdrop-blur-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-kado-red/50" />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder="Search roles, skills, locations…"
          aria-label="Search careers"
          className="w-full min-h-[44px] rounded-full border border-kado-dark/12 bg-white py-2.5 pl-11 pr-11 text-sm font-medium text-kado-dark placeholder:text-kado-dark/40 outline-none focus:border-kado-red/40 focus:ring-2 focus:ring-kado-red/10"
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'careers', 'content-creators', 'collaborations'] as const).map((key) => {
          const activeCat = filters.category === key;
          const label = key === 'all' ? 'All' : CAREER_CATEGORY_LABELS[key as CareerListingCategory];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ category: key })}
              className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                activeCat ? 'bg-kado-red text-white' : 'bg-white text-kado-dark/65 hover:text-kado-red'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.branchId}
          onChange={(e) => onChange({ branchId: e.target.value })}
          className={selectClass}
          aria-label="Filter by location"
        >
          <option value="all">All locations</option>
          {activeBranches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={filters.employmentType}
          onChange={(e) => onChange({ employmentType: e.target.value })}
          className={selectClass}
          aria-label="Filter by employment type"
        >
          <option value="all">All types</option>
          {employmentTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as CareerSortKey })}
          className={selectClass}
          aria-label="Sort listings"
        >
          {(Object.keys(SORT_LABELS) as CareerSortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>

        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-kado-dark/45">
          {resultCount} role{resultCount === 1 ? '' : 's'}
        </span>

        {active ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-kado-dark/12 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-wider text-kado-red hover:bg-kado-red/5"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
