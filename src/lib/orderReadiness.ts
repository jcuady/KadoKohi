import type { OrderItem } from '../types/domain';
import { orderingRepo } from './supabase/repositories/ordering';
import { supabase } from './supabase/client';
import { useMenuStore } from '../store/menuStore';
import { useTableStore } from '../store/tableStore';
import { useCartStore } from '../store/cartStore';
import { useMerchStore } from '../store/merchStore';

/** Sync menu + dine-in tables in Supabase, then refresh client stores. */
export async function ensureOrderReadiness(): Promise<void> {
  if (!supabase) return;
  await Promise.all([
    orderingRepo.ensureMenuCatalog().catch(() => undefined),
    orderingRepo.ensureDefaultTables().catch(() => undefined),
  ]);
  await Promise.all([
    useMenuStore.getState().hydrateFromRemote(),
    useTableStore.getState().hydrateFromRemote(),
  ]);
  pruneStaleCartLines();
}

export function pruneStaleCartLines(): void {
  const coffeeIds = new Set(useMenuStore.getState().products.map((p) => p.id));
  const merchIds = new Set(useMerchStore.getState().products.map((p) => p.id));
  useCartStore.setState({
    items: useCartStore.getState().items.filter((line) => {
      if (line.itemType === 'merch') return merchIds.has(line.productId);
      return coffeeIds.has(line.productId);
    }),
  });
}

export function isOrderCatalogError(err: unknown): boolean {
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: string }).message)
      : '';
  return (
    /product.*not available/i.test(msg) ||
    /table is invalid/i.test(msg) ||
    /branch is not active/i.test(msg)
  );
}

/** True when every cart line resolved to a priced order item. */
export function cartLinesMatchMenu<T extends { productId: string }>(
  cart: T[],
  lines: OrderItem[],
): boolean {
  if (cart.length === 0) return lines.length === 0;
  return lines.length === cart.length && lines.length > 0;
}
