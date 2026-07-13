import type { Branch } from '../types/domain';
import {
  CAREER_CATEGORY_LABELS,
  careerListingLocationLabel,
  type CareerListing,
  type CareerListingCategory,
} from './careersPageContent';

export type CareerSortKey = 'recommended' | 'newest' | 'title';

export type CareerCatalogFilters = {
  query: string;
  category: 'all' | CareerListingCategory;
  branchId: 'all' | string;
  employmentType: 'all' | string;
  sort: CareerSortKey;
};

export const DEFAULT_CAREER_CATALOG_FILTERS: CareerCatalogFilters = {
  query: '',
  category: 'all',
  branchId: 'all',
  employmentType: 'all',
  sort: 'recommended',
};

const SORT_OPTIONS: CareerSortKey[] = ['recommended', 'newest', 'title'];
const CATEGORY_OPTIONS: Array<'all' | CareerListingCategory> = [
  'all',
  'careers',
  'content-creators',
  'collaborations',
];

function searchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export function matchesCareerSearch(
  listing: CareerListing,
  query: string,
  branches: Branch[],
): boolean {
  const tokens = searchTokens(query);
  if (!tokens.length) return true;

  const haystack = [
    listing.title,
    listing.description,
    listing.location ?? '',
    careerListingLocationLabel(listing, branches) ?? '',
    listing.employmentType ?? '',
    CAREER_CATEGORY_LABELS[listing.category],
  ]
    .join(' ')
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

function matchesBranch(listing: CareerListing, branchId: string, branches: Branch[]): boolean {
  if (branchId === 'all') return true;
  if (listing.branchId === branchId) return true;
  const branch = branches.find((b) => b.id === branchId);
  if (!branch) return false;
  const loc = (listing.location ?? '').toLowerCase();
  const city = branch.city.toLowerCase();
  const name = branch.name.toLowerCase();
  return loc.includes(city) || loc.includes(name) || loc.includes(branch.slug.toLowerCase());
}

function sortListings(listings: CareerListing[], sort: CareerSortKey): CareerListing[] {
  const list = [...listings];
  switch (sort) {
    case 'newest':
      return list.sort((a, b) => {
        const aT = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const bT = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        return bT - aT;
      });
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }
}

export function filterCareerListings(
  listings: CareerListing[],
  filters: CareerCatalogFilters,
  branches: Branch[],
  options?: { includeHidden?: boolean },
): CareerListing[] {
  const visible = options?.includeHidden ? listings : listings.filter((item) => item.visible);

  const filtered = visible.filter((item) => {
    if (filters.category !== 'all' && item.category !== filters.category) return false;
    if (!matchesBranch(item, filters.branchId, branches)) return false;
    if (
      filters.employmentType !== 'all' &&
      (item.employmentType ?? '').toLowerCase() !== filters.employmentType.toLowerCase()
    ) {
      return false;
    }
    if (!matchesCareerSearch(item, filters.query, branches)) return false;
    return true;
  });

  return sortListings(filtered, filters.sort);
}

export function hasActiveCareerFilters(filters: CareerCatalogFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.category !== 'all' ||
    filters.branchId !== 'all' ||
    filters.employmentType !== 'all' ||
    filters.sort !== 'recommended'
  );
}

export function parseCareerCatalogFilters(params: URLSearchParams): CareerCatalogFilters {
  const categoryRaw = params.get('category')?.trim();
  const category =
    categoryRaw === 'careers' ||
    categoryRaw === 'content-creators' ||
    categoryRaw === 'collaborations'
      ? categoryRaw
      : 'all';

  const sortRaw = params.get('sort')?.trim();
  const sort = SORT_OPTIONS.includes(sortRaw as CareerSortKey)
    ? (sortRaw as CareerSortKey)
    : 'recommended';

  return {
    query: params.get('q')?.trim() ?? '',
    category,
    branchId: params.get('branch')?.trim() || 'all',
    employmentType: params.get('type')?.trim() || 'all',
    sort,
  };
}

export function writeCareerCatalogFilters(
  params: URLSearchParams,
  filters: CareerCatalogFilters,
): URLSearchParams {
  const next = new URLSearchParams(params);
  if (filters.query.trim()) next.set('q', filters.query.trim());
  else next.delete('q');

  if (filters.category !== 'all') next.set('category', filters.category);
  else next.delete('category');

  if (filters.branchId !== 'all') next.set('branch', filters.branchId);
  else next.delete('branch');

  if (filters.employmentType !== 'all') next.set('type', filters.employmentType);
  else next.delete('type');

  if (filters.sort !== 'recommended') next.set('sort', filters.sort);
  else next.delete('sort');

  return next;
}

export function uniqueEmploymentTypes(listings: CareerListing[]): string[] {
  const set = new Set<string>();
  for (const item of listings) {
    const t = item.employmentType?.trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export { CATEGORY_OPTIONS };
