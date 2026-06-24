import type { BoothAddon, BoothPackage } from '../types/domain';

export function normalizeCatalog(raw: unknown): { packages: BoothPackage[]; addons: BoothAddon[] } {
  if (!raw || typeof raw !== 'object') {
    return { packages: [], addons: [] };
  }
  const row = raw as { packages?: unknown; addons?: unknown };
  const packages = Array.isArray(row.packages) ? (row.packages as BoothPackage[]) : [];
  const addons = Array.isArray(row.addons) ? (row.addons as BoothAddon[]) : [];
  return { packages, addons };
}
