import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { OrderItem, Product } from '../types/domain';
import { useMenuStore } from '../store/menuStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { useBranchStore } from '../store/branchStore';
import { formatPhp, computeOrderTotals } from '../lib/money';
import { clampText, formatOrderError, requireGuestName } from '../lib/validation';
import { isProductInStock } from '../lib/productStock';
import { useSettingsStore } from '../store/settingsStore';
import { newId } from '../lib/id';
import { getProductImageUrl } from '../lib/productImage';
import { guestOrderMainPadding } from '../lib/guestOrderLayout';
import { ShoppingBag, Check, ChevronDown, ChevronUp } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import {
  defaultMilkId,
  defaultOrderTemperature,
  getOrderableMilks,
  resolveMilkLabel,
  resolveMilkPriceDelta,
  showMilkChoice,
} from '../lib/menuProductModifiers';
import { ensureOrderReadiness } from '../lib/orderReadiness';
import CatalogPageSkeleton from '../components/catalog/CatalogPageSkeleton';
import CatalogToolbar from '../components/catalog/CatalogToolbar';
import {
  baseProductsForFilters,
  DEFAULT_MENU_CATALOG_FILTERS,
  filterMenuProducts,
  type MenuCatalogFilters,
} from '../lib/menuCatalogFilters';

type CartLine = { key: string; productId: string; qty: number; milkId?: string; temperature?: 'hot' | 'iced' };

function resolveUnit(product: Product, milkId?: string): { unit: number; milkLabel?: string } {
  return {
    unit: product.basePrice + resolveMilkPriceDelta(product, milkId),
    milkLabel: resolveMilkLabel(product, milkId),
  };
}

export default function Order() {
  const user = useAuthStore((s) => s.user);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);
  const remoteLoaded = useMenuStore((s) => s.remoteLoaded);
  const createOrder = useOrderStore((s) => s.createOrder);
  const branches = useBranchStore((s) => s.branches);

  const activeBranches = branches.filter((b) => b.status === 'active');

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );

  const [activeCat, setActiveCat] = useState(sortedCategories[0]?.id ?? '');
  const [catalogFilters, setCatalogFilters] = useState<MenuCatalogFilters>(DEFAULT_MENU_CATALOG_FILTERS);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [branchId, setBranchId] = useState(activeBranches[0]?.id ?? '');
  const [guestName, setGuestName] = useState('');
  const [guestOrderError, setGuestOrderError] = useState('');
  const [placed, setPlaced] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  useEffect(() => {
    void ensureOrderReadiness().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!activeBranches.length) return;
    if (!branchId || !activeBranches.some((b) => b.id === branchId)) {
      setBranchId(activeBranches[0].id);
    }
  }, [activeBranches, branchId]);

  useEffect(() => {
    if (!sortedCategories.length) return;
    if (!activeCat || !sortedCategories.some((c) => c.id === activeCat)) {
      setActiveCat(sortedCategories[0].id);
    }
  }, [sortedCategories, activeCat]);

  const filterCtx = useMemo(
    () => ({ categories: sortedCategories, productsByCategory }),
    [sortedCategories, productsByCategory],
  );

  const filtersWithCategory = useMemo(
    () => ({ ...catalogFilters, categoryId: activeCat || sortedCategories[0]?.id || 'all' }),
    [catalogFilters, activeCat, sortedCategories],
  );

  const list = useMemo(() => {
    const base = baseProductsForFilters(filtersWithCategory, filterCtx);
    return filterMenuProducts(base, filtersWithCategory, filterCtx);
  }, [filtersWithCategory, filterCtx]);

  const addToCart = (product: Product) => {
    if (!isProductInStock(product)) return;
    const defaultMilk = defaultMilkId(product);
    const temp = defaultOrderTemperature(product);
    setCart((c) => [
      ...c,
      {
        key: newId(),
        productId: product.id,
        qty: 1,
        milkId: defaultMilk,
        temperature: temp,
      },
    ]);
    setMobileCartOpen(true);
  };

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let modifiers = 0;
    const lines: OrderItem[] = [];
    for (const line of cart) {
      const p = products.find((x) => x.id === line.productId);
      if (!p) continue;
      const { unit, milkLabel } = resolveUnit(p, line.milkId);
      subtotal += p.basePrice * line.qty;
      modifiers += (unit - p.basePrice) * line.qty;
      lines.push({
        id: newId(),
        productId: p.id,
        productNameSnapshot: p.name,
        milkId: line.milkId,
        milkLabelSnapshot: milkLabel,
        temperature: line.temperature,
        unitPrice: unit,
        qty: line.qty,
        lineTotal: unit * line.qty,
      });
    }
    const { tax, total } = computeOrderTotals(subtotal, modifiers, taxRate);
    return { lines, subtotal, modifiers, tax, total };
  }, [cart, products, taxRate]);

  const placeOrder = (e: FormEvent) => {
    e.preventDefault();
    if (cartTotals.lines.length === 0 || !branchId) return;
    if (!user) {
      const nameErr = requireGuestName(guestName);
      if (nameErr) {
        setGuestOrderError(nameErr);
        setMobileCartOpen(true);
        return;
      }
    }
    setGuestOrderError('');
    void createOrder({
      channel: 'online',
      branchId,
      customerId: user?.id,
      guestName: user ? undefined : clampText(guestName, 80),
      paymentMethod: 'gcash-qr',
      items: cartTotals.lines,
      subtotal: cartTotals.subtotal,
      modifiersTotal: cartTotals.modifiers,
      tax: cartTotals.tax,
      total: cartTotals.total,
    })
      .then(() => {
        setCart([]);
        setMobileCartOpen(false);
        setPlaced(true);
      })
      .catch((err) => {
        setGuestOrderError(formatOrderError(err));
        setMobileCartOpen(true);
      });
  };

  const mainPadding = guestOrderMainPadding(mobileCartOpen, cart.length > 0);

  const renderCartBody = (idPrefix: string): ReactNode => (
    <>
      {cart.length === 0 ? (
        <p className="text-sm text-kado-dark/50 mb-4">Tap a product to add it.</p>
      ) : (
        <ul className="space-y-3 mb-4 max-h-[min(36dvh,280px)] lg:max-h-60 overflow-y-auto overscroll-contain">
          {cart.map((line) => {
            const p = products.find((x) => x.id === line.productId);
            if (!p) return null;
            const { unit } = resolveUnit(p, line.milkId);
            return (
              <li key={line.key} className="rounded-xl border border-kado-dark/10 bg-white p-3">
                <div className="flex justify-between gap-2 text-sm font-bold text-kado-dark">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className="text-kado-red shrink-0">{formatPhp(unit)}</span>
                </div>
                {showMilkChoice(p) && (
                  <select
                    id={`${idPrefix}-milk-${line.key}`}
                    value={line.milkId ?? ''}
                    onChange={(e) =>
                      setCart((c) =>
                        c.map((x) => (x.key === line.key ? { ...x, milkId: e.target.value || undefined } : x)),
                      )
                    }
                    className="mt-2 w-full min-h-[44px] rounded-lg border border-kado-dark/10 bg-[#FAF7F2] text-sm py-2 px-3 touch-manipulation"
                  >
                    {getOrderableMilks(p).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} {m.priceDelta ? `+${m.priceDelta}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => setCart((c) => c.filter((x) => x.key !== line.key))}
                  className="mt-2 min-h-[40px] text-[10px] text-kado-red font-bold uppercase tracking-wider touch-manipulation"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-3 mb-4">
        <div>
          <label htmlFor={`${idPrefix}-branch`} className="block text-[10px] font-bold uppercase tracking-wider text-kado-dark/60 mb-1">
            Pickup branch
          </label>
          <select
            id={`${idPrefix}-branch`}
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full min-h-[48px] rounded-xl border border-kado-dark/15 bg-white px-3 py-2.5 text-base sm:text-sm touch-manipulation"
            required
          >
            {activeBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        {!user && (
          <div className="space-y-2">
            <div>
              <label htmlFor={`${idPrefix}-guest`} className="block text-[10px] font-bold uppercase tracking-wider text-kado-dark/60 mb-1">
                Your name (guest)
              </label>
              <input
                id={`${idPrefix}-guest`}
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  setGuestOrderError('');
                }}
                placeholder="e.g. Juan"
                maxLength={80}
                className="w-full min-h-[48px] rounded-xl border border-kado-dark/15 bg-white px-3 py-2.5 text-base sm:text-sm touch-manipulation"
              />
              {guestOrderError && <p className="mt-1 text-xs text-red-600 font-medium">{guestOrderError}</p>}
            </div>
            <p className="text-[10px] text-kado-dark/50">
              <Link to="/auth/signup" className="font-bold text-kado-red hover:underline">
                Create a free account
              </Link>{' '}
              to track orders &amp; earn loyalty stamps.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-kado-dark/10 pt-4 space-y-1 mb-4">
        <div className="flex justify-between text-xs text-kado-dark/55">
          <span>Subtotal</span>
          <span>{formatPhp(cartTotals.subtotal)}</span>
        </div>
        {cartTotals.modifiers > 0 && (
          <div className="flex justify-between text-xs text-kado-dark/55">
            <span>Modifiers</span>
            <span>+{formatPhp(cartTotals.modifiers)}</span>
          </div>
        )}
        {cartTotals.tax > 0 && (
          <div className="flex justify-between text-xs text-kado-dark/55">
            <span>Tax ({taxRate}%)</span>
            <span>{formatPhp(cartTotals.tax)}</span>
          </div>
        )}
        <div className="flex justify-between font-display font-bold text-kado-dark pt-1">
          <span>Total</span>
          <span className="text-kado-red">{formatPhp(cartTotals.total)}</span>
        </div>
      </div>
    </>
  );

  if (placed) {
    return (
      <div className="guest-order-page flex flex-col w-full bg-kado-cream font-sans items-center justify-center px-[max(1.5rem,env(safe-area-inset-left))] py-16 sm:py-24 text-center pb-safe">
        <div className="w-16 h-16 rounded-full bg-kado-red/10 flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-kado-red" />
        </div>
        <h1 className="font-display text-[clamp(1.5rem,6vw,1.875rem)] font-bold text-kado-dark mb-2">Order placed!</h1>
        <p className="text-kado-dark/65 max-w-md mb-8 text-sm sm:text-base leading-relaxed">
          Your order has been sent. You&apos;ll see it appear in your account dashboard and the barista board shortly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
          <button
            type="button"
            onClick={() => setPlaced(false)}
            className="min-h-[48px] rounded-full bg-kado-dark text-kado-cream px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors touch-manipulation"
          >
            Order again
          </button>
          <Link
            to="/account"
            className="min-h-[48px] rounded-full border-2 border-kado-dark/15 text-kado-dark px-6 py-3 text-xs font-bold uppercase tracking-wider hover:border-kado-red hover:text-kado-red transition-colors flex items-center justify-center touch-manipulation"
          >
            My account
          </Link>
        </div>
      </div>
    );
  }

  if (!remoteLoaded) {
    return (
      <div className="guest-order-page flex flex-col w-full bg-kado-cream font-sans">
        <section className="pt-20 sm:pt-24 pb-4 px-[max(1rem,env(safe-area-inset-left))] sm:px-6">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              label="Online"
              title="Place an order"
              subtitle="Browse the menu, add to cart, and submit your order for pickup."
            />
          </div>
        </section>
        <section className="px-[max(1rem,env(safe-area-inset-left))] sm:px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <CatalogPageSkeleton variant="menu" />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="guest-order-page flex flex-col w-full bg-kado-cream font-sans">
      <section className="pt-20 sm:pt-24 pb-4 px-[max(1rem,env(safe-area-inset-left))] sm:px-6 [@media(orientation:landscape)_and_(max-height:30rem)]:pt-16 [@media(orientation:landscape)_and_(max-height:30rem)]:pb-2">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            label="Online"
            title="Place an order"
            subtitle="Browse the menu, add to cart, and submit your order for pickup."
          />
        </div>
      </section>

      <section className={`px-[max(1rem,env(safe-area-inset-left))] sm:px-6 ${mainPadding} lg:pb-24`}>
        <div className="max-w-6xl mx-auto min-w-0">
          <form onSubmit={placeOrder}>
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-4 min-w-0">
                <CatalogToolbar
                  filters={catalogFilters}
                  resultCount={list.length}
                  onChange={(patch) => setCatalogFilters((f) => ({ ...f, ...patch }))}
                  onClear={() => setCatalogFilters(DEFAULT_MENU_CATALOG_FILTERS)}
                />

                <div className="guest-order-category-rail -mx-4 px-4 sm:mx-0 sm:px-0 pr-[max(1rem,env(safe-area-inset-right))] sm:pr-0">
                  {sortedCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCat(c.id)}
                      className={`shrink-0 min-h-[44px] px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all touch-manipulation ${
                        activeCat === c.id
                          ? 'bg-kado-dark text-kado-cream border-kado-dark'
                          : 'bg-kado-offwhite border-kado-dark/10 hover:border-kado-red/40'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                {list.length === 0 ? (
                  <p className="text-sm text-kado-dark/55 py-8 text-center">
                    No drinks match your search or filters. Try clearing filters above.
                  </p>
                ) : (
                <div className="guest-order-product-grid">
                  {list.map((p) => {
                    const inStock = isProductInStock(p);
                    const image = getProductImageUrl(p);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={!inStock}
                        onClick={() => addToCart(p)}
                        className={`text-left rounded-2xl border border-kado-dark/10 bg-kado-offwhite overflow-hidden transition-all group touch-manipulation flex flex-col h-full ${
                          inStock
                            ? 'hover:border-kado-red/40 hover:shadow-lg active:scale-[0.99]'
                            : 'opacity-55 cursor-not-allowed'
                        }`}
                      >
                        <div className="relative aspect-[4/3] bg-kado-dark/5 shrink-0">
                          <img
                            src={image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          {!inStock && (
                            <span className="absolute top-1.5 left-1.5 text-[7px] font-black uppercase tracking-widest bg-amber-600 text-white px-1.5 py-0.5 rounded-full">
                              Out of stock
                            </span>
                          )}
                        </div>
                        <div className="p-3 sm:p-4 flex flex-col flex-1 min-w-0">
                          <div className="flex justify-between gap-2 items-start">
                            <span className="font-display font-bold text-xs sm:text-sm text-kado-dark group-hover:text-kado-red transition-colors line-clamp-2">
                              {p.name}
                            </span>
                            <span className="font-display font-bold text-kado-red shrink-0 text-xs sm:text-sm">
                              {formatPhp(p.basePrice)}
                            </span>
                          </div>
                          {p.tags?.length ? (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-kado-dark/40 mt-1 inline-block line-clamp-1">
                              {p.tags.join(' · ')}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
                )}
              </div>

              <div className="hidden lg:block rounded-[2rem] border border-kado-dark/10 bg-kado-offwhite p-6 h-fit sticky top-24">
                <h2 className="font-display text-lg font-bold text-kado-dark mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-kado-red" /> Cart
                </h2>
                {renderCartBody('desktop')}
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full min-h-[52px] rounded-2xl bg-kado-red text-kado-cream py-4 text-xs font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-kado-dark transition-colors touch-manipulation"
                >
                  Place order
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Mobile / tablet sticky cart */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none">
        <form onSubmit={placeOrder} className="pointer-events-auto max-w-3xl mx-auto px-[max(0.75rem,env(safe-area-inset-left))] sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))]">
          <div className="rounded-2xl border border-kado-dark/10 bg-white shadow-[0_-8px_32px_rgba(25,25,25,0.14)] overflow-hidden">
            <button
              type="button"
              onClick={() => cart.length > 0 && setMobileCartOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left touch-manipulation min-h-[56px]"
              aria-expanded={mobileCartOpen}
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShoppingBag className="w-5 h-5 text-kado-red shrink-0" />
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm text-kado-dark">
                    {cart.length === 0 ? 'Your cart' : `${cart.length} item${cart.length !== 1 ? 's' : ''}`}
                  </p>
                  <p className="text-[10px] text-kado-dark/45 truncate">
                    {cart.length === 0
                      ? 'Tap a drink to add'
                      : mobileCartOpen
                        ? 'Hide cart to browse menu'
                        : `View cart · ${formatPhp(cartTotals.total)}`}
                  </p>
                </div>
              </div>
              {cart.length > 0 &&
                (mobileCartOpen ? (
                  <ChevronDown className="w-5 h-5 text-kado-dark/40 shrink-0" aria-hidden />
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-kado-dark text-kado-cream px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                    View cart
                    <ChevronUp className="w-3.5 h-3.5" />
                  </span>
                ))}
            </button>

            {mobileCartOpen && cart.length > 0 && (
              <div className="border-t border-kado-dark/8 px-4 py-3 max-h-[min(42dvh,360px)] [@media(orientation:landscape)_and_(max-height:30rem)]:max-h-[min(30dvh,200px)] overflow-y-auto overscroll-contain">
                {renderCartBody('mobile')}
              </div>
            )}

            <div className="border-t border-kado-dark/8 p-3 sm:p-4">
              {guestOrderError && !user && (
                <p className="text-xs text-red-600 font-medium mb-2 text-center">{guestOrderError}</p>
              )}
              <button
                type="submit"
                disabled={cart.length === 0}
                className="w-full min-h-[52px] rounded-2xl bg-kado-red text-kado-cream text-xs font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-kado-dark transition-colors touch-manipulation"
              >
                Place order · {formatPhp(cartTotals.total)}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
