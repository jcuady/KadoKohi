import { describe, expect, it } from 'vitest';
import { normalizeCatalog } from './boothCatalogHydration';

describe('normalizeCatalog', () => {
  it('returns empty arrays when remote is missing', () => {
    expect(normalizeCatalog(null)).toEqual({ packages: [], addons: [] });
    expect(normalizeCatalog(undefined)).toEqual({ packages: [], addons: [] });
  });

  it('returns empty arrays for empty published catalog', () => {
    expect(normalizeCatalog({ packages: [], addons: [] })).toEqual({ packages: [], addons: [] });
  });

  it('passes through remote rows', () => {
    const packages = [{ id: 'pkg_1', name: 'Basic', capacity: 12, durationHours: 3, basePrice: 1000, inclusions: [], visible: true, branchId: '', order: 0, createdAt: '', updatedAt: '' }];
    expect(normalizeCatalog({ packages, addons: [] }).packages).toHaveLength(1);
  });
});
