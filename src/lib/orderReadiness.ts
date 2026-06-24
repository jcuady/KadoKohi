import { orderingRepo } from './supabase/repositories/ordering';
import { supabase } from './supabase/client';
import { useBranchStore } from '../store/branchStore';
import { useMenuStore } from '../store/menuStore';
import { useTableStore } from '../store/tableStore';
import { useCartStore } from '../store/cartStore';
import { useMerchStore } from '../store/merchStore';
import { coffeeMenuIsEmpty } from './menuCatalogSync';
import { qrCartIsStale } from './qrOrderCart';
import type { OrderItem } from '../types/domain';

/** Sync menu + dine-in tables in Supabase, then refresh client stores. */
export async function ensureOrderReadiness(): Promise<void> {
  if (!supabase) return;

  await Promise.all([
    useBranchStore.getState().hydrateFromRemote(),
    useMenuStore.getState().hydrateFromRemote(),
    useTableStore.getState().hydrateFromRemote(),
  ]);

  const menu = useMenuStore.getState();
  const menuMissing =
    !menu.remoteLoaded || menu.dataSource !== 'remote' || coffeeMenuIsEmpty(menu.categories, menu.products);

  // ponytail: only seed catalog when empty — kk_ensure_menu_catalog used to wipe uploaded images on every QR visit.
  if (menuMissing) {
    await orderingRepo.ensureMenuCatalog().catch(() => undefined);
    await useMenuStore.getState().ensureCatalogInDatabase().catch(() => undefined);
    await useMenuStore.getState().hydrateFromRemote();
  }

  await orderingRepo.ensureDefaultTables().catch(() => undefined);
  await useTableStore.getState().hydrateFromRemote();

  pruneStaleCartLines();
}

export function isOrderCatalogReady(): boolean {
  const menu = useMenuStore.getState();
  return menu.remoteLoaded && menu.dataSource === 'remote' && menu.products.length > 0;
}

/** Confirm product ids exist in Supabase before placing an order. */
export async function assertProductsOrderable(
  productIds: string[],
  extraIds: string[] = [],
): Promise<void> {
  if (!supabase || (productIds.length === 0 && extraIds.length === 0)) return;
  const unique = [...new Set([...productIds, ...extraIds])];

  const check = async () => {
    const { data, error } = await supabase!
      .from('kk_products')
      .select('id')
      .in('id', unique)
      .eq('visible', true)
      .eq('in_stock', true);
    if (error) throw error;
    return (data ?? []).length === unique.length;
  };

  if (await check()) return;

  await orderingRepo.ensureMenuCatalog();
  await useMenuStore.getState().hydrateFromRemote();

  if (!(await check())) {
    throw new Error('Menu is still syncing. Pull down to refresh or tap Try again below.');
  }
}

export function pruneStaleCartLines(): void {
  const coffeeIds = new Set(useMenuStore.getState().products.map((p) => p.id));
  const merchIds = new Set(useMerchStore.getState().products.map((p) => p.id));
  useCartStore.setState({
    items: useCartStore.getState().items.filter((line) => {
      if (line.itemType === 'merch') return merchIds.has(line.productId);
      const idsOk = coffeeIds.has(line.productId);
      const cookieOk = !line.mixMatchCookieId || coffeeIds.has(line.mixMatchCookieId);
      return idsOk && cookieOk;
    }),
  });
}

export function cartLinesMatchMenu(
  cart: { productId: string }[],
  lines: OrderItem[],
): boolean {
  return !qrCartIsStale(cart, lines);
}

/** Dine-in table must exist in Supabase before kk_place_order. */
export async function assertTableForOrder(tableId: string, branchId: string): Promise<void> {
  if (!supabase) return;

  const check = async () => {
    const { data, error } = await supabase!
      .from('kk_tables')
      .select('id')
      .eq('id', tableId)
      .eq('branch_id', branchId)
      .eq('active', true)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data?.id);
  };

  if (await check()) return;

  await orderingRepo.ensureDefaultTables().catch(() => undefined);
  await useTableStore.getState().hydrateFromRemote();

  if (!(await check())) {
    throw new Error('This table QR is not active. Ask staff for a current table code.');
  }
}

export function isOrderCatalogError(err: unknown): boolean {
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: string }).message)
      : '';
  return (
    /product.*not available/i.test(msg) ||
    /table is invalid/i.test(msg) ||
    /branch is not active/i.test(msg) ||
    /menu is still syncing/i.test(msg)
  );
}
