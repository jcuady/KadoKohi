import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import type { Product, PaymentMethod } from '../types/domain';
import { useMenuStore } from '../store/menuStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { useBranchStore } from '../store/branchStore';
import { clampText, formatOrderError, requireGuestName } from '../lib/validation';
import {
  cartLinesMatchMenu,
  ensureOrderReadiness,
  isOrderCatalogReady,
} from '../lib/orderReadiness';
import { buildQrCartTotals, qrLinesMatch, type QrCartLine } from '../lib/qrOrderCart';
import { useSettingsStore } from '../store/settingsStore';
import { newId } from '../lib/id';
import { clearTrackedOrder, getTrackedOrder, setTrackedOrder } from '../lib/guestOrders';
import { guestOrderCustomerId, guestOrderUsesAnonSession } from '../lib/guestOrderAuth';
import { buildTrackedOrderSnapshot } from '../lib/guestOrderSnapshot';
import QrProductSheet, { type QrCartPayload } from '../components/qr/QrProductSheet';
import QrStickyCart from '../components/qr/QrStickyCart';
import QrGuestMenuCatalog from '../components/qr/QrGuestMenuCatalog';
import QrGuestFilteredCatalog from '../components/qr/QrGuestFilteredCatalog';
import OrderTrackingPanel from '../components/order/OrderTrackingPanel';
import QrCatalogToolbar from '../components/catalog/QrCatalogToolbar';
import QrMenuSkeleton from '../components/catalog/QrMenuSkeleton';
import { startGuestPageRealtime, stopGuestPageRealtime } from '../lib/supabase/guestPageRealtime';
import { Store } from 'lucide-react';
import BrandHybridMark from '../components/BrandHybridMark';
import { guestOrderMainPadding } from '../lib/guestOrderLayout';
import { checkoutPath } from '../lib/pendingPayments';
import { qrGuestCategoryTabs, qrGuestDefaultCategoryId, qrGuestMenuSections } from '../lib/qrGuestMenu';
import {
  baseProductsForFilters,
  DEFAULT_MENU_CATALOG_FILTERS,
  filterMenuProducts,
  hasQrFilteredBrowse,
  isPromoFilterId,
  MENU_PROMO_FILTER_ID,
  type MenuCatalogFilters,
} from '../lib/menuCatalogFilters';

export default function OrderTakeout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);
  const [searchParams] = useSearchParams();
  const branchSlug = searchParams.get('b')?.trim().toLowerCase() ?? '';
  const branches = useBranchStore((s) => s.branches);
  const branch = useMemo(() => {
    const active = branches.filter((b) => b.status === 'active');
    if (branchSlug) return active.find((b) => b.slug === branchSlug) ?? null;
    return active[0] ?? null;
  }, [branches, branchSlug]);

  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const menuReady = useMenuStore((s) => s.remoteLoaded);
  const menuDataSource = useMenuStore((s) => s.dataSource);
  const hydrateError = useMenuStore((s) => s.hydrateError);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);
  const createOrder = useOrderStore((s) => s.createOrder);

  const catalogOrderable = isOrderCatalogReady();

  const categoryTabs = useMemo(
    () => qrGuestCategoryTabs(categories, products),
    [categories, products],
  );

  const sessionKey = branch ? `takeout.${branch.slug}` : `takeout.${branchSlug || 'pending'}`;

  const [activeCat, setActiveCat] = useState('');
  const [cart, setCart] = useState<QrCartLine[]>([]);
  const [pickupName, setPickupName] = useState(user?.name ?? '');
  const [cartExpanded, setCartExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [catalogFilters, setCatalogFilters] = useState<MenuCatalogFilters>(DEFAULT_MENU_CATALOG_FILTERS);
  const [filterPage, setFilterPage] = useState(1);
  const [trackedLabel, setTrackedLabel] = useState('');
  const [orderError, setOrderError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paymongo');

  useEffect(() => {
    if (!branch) return;
    const ref = getTrackedOrder(`takeout.${branch.slug}`);
    if (ref) {
      setTrackedOrderId(ref.orderId);
      setTrackedLabel(ref.label);
    }
  }, [branch]);

  useEffect(() => {
    startGuestPageRealtime();
    return () => stopGuestPageRealtime();
  }, []);

  const runSync = useCallback(async () => {
    setSyncing(true);
    setOrderError('');
    try {
      await ensureOrderReadiness();
    } catch (err) {
      setOrderError(formatOrderError(err));
    } finally {
      setSyncing(false);
      setBootstrapped(true);
    }
  }, []);

  useEffect(() => {
    void runSync();
  }, [runSync]);

  useEffect(() => {
    if (!categoryTabs.length) return;
    if (!activeCat || !categoryTabs.some((c) => c.id === activeCat)) {
      setActiveCat(qrGuestDefaultCategoryId(categoryTabs));
    }
  }, [categoryTabs, activeCat]);

  const menuSections = useMemo(
    () => qrGuestMenuSections(categories, products, productsByCategory),
    [categories, products, productsByCategory],
  );

  const filterCtx = useMemo(
    () => ({ categories, productsByCategory }),
    [categories, productsByCategory],
  );

  const promoBrowse = isPromoFilterId(activeCat);

  const filteredProducts = useMemo(() => {
    const filters: MenuCatalogFilters = {
      ...catalogFilters,
      categoryId: promoBrowse ? MENU_PROMO_FILTER_ID : 'all',
    };
    const base = baseProductsForFilters(filters, filterCtx);
    return filterMenuProducts(base, filters, filterCtx);
  }, [catalogFilters, filterCtx, promoBrowse]);

  const qrFilteredMode = hasQrFilteredBrowse(catalogFilters);
  const showPromoCatalog = promoBrowse || qrFilteredMode;

  useEffect(() => {
    setFilterPage(1);
  }, [catalogFilters, activeCat]);

  const cartCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);
  const cartTotals = useMemo(
    () => buildQrCartTotals(cart, products, taxRate),
    [cart, products, taxRate],
  );
  const cartStale = cart.length > 0 && !cartLinesMatchMenu(cart, cartTotals.lines);

  const addLine = (payload: QrCartPayload) => {
    setCart((prev) => {
      const match = prev.find((l) => qrLinesMatch(l, payload));
      if (match) {
        return prev.map((l) => (l.key === match.key ? { ...l, qty: l.qty + payload.qty } : l));
      }
      return [...prev, { ...payload, key: newId() }];
    });
  };

  const updateLineQty = (key: string, qty: number) => {
    if (qty <= 0) {
      setCart((c) => c.filter((x) => x.key !== key));
      return;
    }
    setCart((c) => c.map((x) => (x.key === key ? { ...x, qty } : x)));
  };

  const placeOrder = async () => {
    const nameErr = requireGuestName(pickupName);
    if (!branch || cartTotals.lines.length === 0 || submitting) return;
    if (!cartExpanded) {
      setCartExpanded(true);
      return;
    }
    if (nameErr) {
      setOrderError(nameErr);
      setCartExpanded(true);
      window.setTimeout(() => {
        document.getElementById('qr-takeout-guest-name')?.focus();
      }, 50);
      return;
    }
    if (cartStale) {
      setOrderError('Some items are out of date. Remove them from your cart and add drinks again.');
      return;
    }
    if (!catalogOrderable) {
      setOrderError(
        hydrateError ??
          'Menu is still syncing. Tap Try again below, or refresh the page.',
      );
      return;
    }
    setOrderError('');
    setSubmitting(true);
    try {
      await ensureOrderReadiness();
      if (!isOrderCatalogReady()) {
        throw new Error('Menu is still syncing. Tap Try again below.');
      }
      const freshTotals = buildQrCartTotals(
        cart,
        useMenuStore.getState().products,
        taxRate,
      );
      if (freshTotals.lines.length === 0) {
        throw new Error('Your cart is empty or items are unavailable.');
      }
      const order = await createOrder({
        channel: 'takeout',
        branchId: branch.id,
        customerId: guestOrderCustomerId(user),
        guestName: clampText(pickupName, 80),
        paymentMethod,
        items: freshTotals.lines,
        subtotal: freshTotals.subtotal,
        modifiersTotal: freshTotals.modifiers,
        tax: freshTotals.tax,
        total: freshTotals.total,
        guestSession: guestOrderUsesAnonSession(user),
      });
      setTrackedOrder(sessionKey, {
        orderId: order.id,
        shortCode: order.shortCode,
        label: pickupName.trim(),
        placedAt: order.createdAt,
        snapshot: buildTrackedOrderSnapshot(order, useMenuStore.getState().products),
      });
      setTrackedOrderId(order.id);
      setTrackedLabel(pickupName.trim());
      setCart([]);
      setCartExpanded(false);
      navigate(checkoutPath(order.id), {
        state: { from: `${location.pathname}${location.search}` },
      });
    } catch (err) {
      setOrderError(formatOrderError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderAgain = () => {
    clearTrackedOrder(sessionKey);
    setTrackedOrderId(null);
    setTrackedLabel('');
  };

  const mainPaddingBottom = guestOrderMainPadding(cartExpanded, cart.length > 0);

  if (!bootstrapped) {
    return (
      <div className="qr-root min-h-[100dvh] bg-[var(--qr-bg)] text-[var(--qr-text)] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--qr-border)] border-t-kado-red" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="qr-root min-h-[100dvh] bg-[var(--qr-bg)] text-[var(--qr-text)] flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-sm">
          <Store className="w-12 h-12 text-kado-red/40 mx-auto mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl font-black mb-2">
            Branch not found
          </h1>
          <p className="qr-text-muted text-sm mb-6">
            {branchSlug
              ? `No active branch matches “${branchSlug}”. Use the takeout QR from Admin → Tables & QR.`
              : 'Add ?b=your-branch-slug to the URL or scan a branch takeout QR.'}
          </p>
          <Link to="/" className="text-sm font-bold text-kado-red hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (trackedOrderId) {
    return (
      <OrderTrackingPanel
        orderId={trackedOrderId}
        sessionKey={sessionKey}
        channel="takeout"
        contextLabel={trackedLabel || pickupName || 'your order'}
        isLoggedIn={Boolean(user)}
        onOrderAgain={handleOrderAgain}
      />
    );
  }

  const placeLabel =
    paymentMethod === 'paymongo'
      ? 'Place order · pay with QR Ph'
      : paymentMethod === 'gcash-qr'
        ? 'Place order · pay with GCash'
        : 'Place order · pay cash at counter';

  return (
    <div className="qr-root customer-surface guest-order-page bg-[var(--qr-bg)] text-[var(--qr-text)] font-sans flex flex-col">
      <header className="shrink-0 sticky top-0 z-30 bg-[var(--qr-bg-header)] backdrop-blur-md border-b border-[var(--qr-border)] pt-safe-nav">
        <div className="max-w-3xl mx-auto px-[max(1rem,env(safe-area-inset-left))] sm:px-4 py-3 sm:py-5 [@media(orientation:landscape)_and_(max-height:30rem)]:py-2.5">
          <div className="flex items-center gap-3">
            <BrandHybridMark size="md" className="h-11 w-11" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-kado-red">
                Takeout · {branch.name}
              </p>
              <h1 className="font-display text-lg sm:text-xl font-black text-[var(--qr-text)] truncate">
                Grab &amp; Go
              </h1>
              <p className="text-[11px] text-[var(--qr-text-subtle)] truncate">Order ahead, pick up fresh</p>
            </div>
            {cartCount > 0 && (
              <button
                type="button"
                onClick={() => setCartExpanded(true)}
                className="shrink-0 min-w-[2rem] h-8 px-2 rounded-full bg-kado-red text-white text-xs font-black flex items-center justify-center touch-manipulation"
                aria-label="View cart"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </button>
            )}
          </div>
        </div>

        {!catalogOrderable && menuDataSource === 'seed' && (
          <div className="max-w-3xl mx-auto px-4 pb-3">
            <div className="qr-seed-banner rounded-xl px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
              <p className="text-xs flex-1">
                {hydrateError ?? 'Connecting menu to the shop…'}
              </p>
              <button
                type="button"
                onClick={() => void runSync()}
                disabled={syncing}
                className="qr-field shrink-0 min-h-[40px] rounded-lg px-3 text-[10px] font-bold uppercase tracking-wider touch-manipulation disabled:opacity-50"
              >
                {syncing ? 'Syncing…' : 'Retry sync'}
              </button>
            </div>
          </div>
        )}

        <QrCatalogToolbar
          filters={catalogFilters}
          categoryTabs={categoryTabs}
          activeCategoryId={activeCat}
          resultCount={
            showPromoCatalog
              ? filteredProducts.length
              : menuSections.reduce((n, s) => n + s.products.length, 0)
          }
          onFiltersChange={(patch) => setCatalogFilters((f) => ({ ...f, ...patch }))}
          onClearFilters={() => setCatalogFilters(DEFAULT_MENU_CATALOG_FILTERS)}
          onCategoryPillClick={(id) => {
            setActiveCat(id);
            if (isPromoFilterId(id)) return;
            window.setTimeout(() => {
              document.getElementById(`qr-cat-${id}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }, 50);
          }}
        />
      </header>

      <main className={`flex-1 max-w-3xl mx-auto w-full min-w-0 px-[max(1rem,env(safe-area-inset-left))] sm:px-4 py-2 sm:py-4 [@media(orientation:landscape)_and_(max-height:30rem)]:py-1.5 ${mainPaddingBottom}`}>
        {!menuReady ? (
          <QrMenuSkeleton />
        ) : showPromoCatalog ? (
          <QrGuestFilteredCatalog
            products={filteredProducts}
            page={filterPage}
            onPageChange={setFilterPage}
            onSelectProduct={setSelectedProduct}
            emptyMessage={
              promoBrowse && !qrFilteredMode
                ? 'No discounted drinks right now. Pick another category or check back soon.'
                : undefined
            }
          />
        ) : (
          <QrGuestMenuCatalog
            sections={menuSections}
            activeCategoryId={activeCat}
            onActiveCategoryChange={setActiveCat}
            onSelectProduct={setSelectedProduct}
          />
        )}
      </main>

      <QrStickyCart
        cart={cart}
        cartExpanded={cartExpanded}
        onCartExpandedChange={(expanded) => {
          setCartExpanded(expanded);
          if (expanded && !pickupName.trim()) {
            window.setTimeout(() => {
              document.getElementById('qr-takeout-guest-name')?.focus();
            }, 50);
          }
        }}
        cartCount={cartCount}
        cartTotals={cartTotals}
        products={products}
        taxRate={taxRate}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        onUpdateQty={updateLineQty}
        onRemoveLine={(key) => setCart((c) => c.filter((x) => x.key !== key))}
        orderError={orderError || null}
        onRetrySync={() => void runSync()}
        submitting={submitting || syncing}
        onPlaceOrder={() => void placeOrder()}
        placeDisabled={
          cart.length === 0 ||
          submitting ||
          syncing ||
          cartStale ||
          !catalogOrderable ||
          (cartExpanded && cartTotals.lines.length === 0)
        }
        placeButtonLabel={placeLabel}
        placeOrderAriaLabel="Place takeout order"
        emptyCartTitle="Your takeout bag"
        guestName={{
          value: pickupName,
          onChange: (v) => {
            setPickupName(v);
            setOrderError('');
          },
          label: 'Your name (for pickup)',
          placeholder: 'e.g. Juan',
          required: true,
          inputId: 'qr-takeout-guest-name',
        }}
      />

      <QrProductSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={addLine}
        ctaLabel="Add to order"
      />
    </div>
  );
}
