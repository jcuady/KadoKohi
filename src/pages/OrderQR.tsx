import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Product, PaymentMethod } from '../types/domain';
import { useMenuStore } from '../store/menuStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { useTableStore } from '../store/tableStore';
import { useBranchStore } from '../store/branchStore';
import { useSettingsStore } from '../store/settingsStore';
import { newId } from '../lib/id';
import { clampText, formatOrderError } from '../lib/validation';
import {
  assertTableForOrder,
  cartLinesMatchMenu,
  ensureOrderReadiness,
  isOrderCatalogReady,
} from '../lib/orderReadiness';
import { buildQrCartTotals, qrLinesMatch, type QrCartLine } from '../lib/qrOrderCart';
import { clearTrackedOrder, getTrackedOrder, setTrackedOrder } from '../lib/guestOrders';
import { guestOrderCustomerId, guestOrderUsesAnonSession } from '../lib/guestOrderAuth';
import QrProductSheet, { type QrCartPayload } from '../components/qr/QrProductSheet';
import QrStickyCart from '../components/qr/QrStickyCart';
import QrGuestMenuCatalog from '../components/qr/QrGuestMenuCatalog';
import OrderTrackingPanel from '../components/order/OrderTrackingPanel';
import { startGuestPageRealtime, stopGuestPageRealtime } from '../lib/supabase/guestPageRealtime';
import { QrCode } from 'lucide-react';
import { qrPillClass } from '../lib/qrGuestTheme';
import { guestOrderMainPadding } from '../lib/guestOrderLayout';
import { qrGuestCategoryTabs, qrGuestMenuSections } from '../lib/qrGuestMenu';

export default function OrderQR() {
  const { code } = useParams<{ code: string }>();
  const user = useAuthStore((s) => s.user);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);
  const table = useTableStore((s) => s.getByCode(code ?? ''));
  const tablesHydrated = useTableStore((s) => s.hydrated);
  const branches = useBranchStore((s) => s.branches);
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const menuReady = useMenuStore((s) => s.remoteLoaded);
  const menuDataSource = useMenuStore((s) => s.dataSource);
  const hydrateError = useMenuStore((s) => s.hydrateError);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);
  const createOrder = useOrderStore((s) => s.createOrder);

  const catalogOrderable = isOrderCatalogReady();

  const branchName = useMemo(
    () => branches.find((b) => b.id === table?.branchId)?.name ?? 'Kado Kohi',
    [branches, table?.branchId],
  );

  const categoryTabs = useMemo(
    () => qrGuestCategoryTabs(categories, products),
    [categories, products],
  );

  const sessionKey = `qr.${code ?? 'unknown'}`;

  const [activeCat, setActiveCat] = useState('');
  const [cart, setCart] = useState<QrCartLine[]>([]);
  const [cartExpanded, setCartExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash-qr');
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const ref = getTrackedOrder(sessionKey);
    if (ref) setTrackedOrderId(ref.orderId);
  }, [sessionKey]);

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
      setActiveCat(categoryTabs[0].id);
    }
  }, [categoryTabs, activeCat]);

  const menuSections = useMemo(
    () => qrGuestMenuSections(categories, products, productsByCategory),
    [categories, products, productsByCategory],
  );

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
        return prev.map((l) =>
          l.key === match.key ? { ...l, qty: l.qty + payload.qty } : l,
        );
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
    const tableRow = useTableStore.getState().getByCode(code ?? '') ?? table;
    if (!tableRow || cartTotals.lines.length === 0 || submitting) return;
    if (!cartExpanded) {
      setCartExpanded(true);
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
      const refreshedTable = useTableStore.getState().getByCode(code ?? '') ?? tableRow;
      await assertTableForOrder(refreshedTable.id, refreshedTable.branchId);
      const freshTotals = buildQrCartTotals(
        cart,
        useMenuStore.getState().products,
        taxRate,
      );
      if (freshTotals.lines.length === 0) {
        throw new Error('Your cart is empty or items are unavailable.');
      }
      const order = await createOrder({
        channel: 'dine-in',
        branchId: refreshedTable.branchId,
        tableId: refreshedTable.id,
        customerId: guestOrderCustomerId(user),
        guestName: user?.name ? clampText(user.name, 80) : refreshedTable.label,
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
        label: refreshedTable.label,
        placedAt: order.createdAt,
      });
      setTrackedOrderId(order.id);
      setCart([]);
      setCartExpanded(false);
    } catch (err) {
      setOrderError(formatOrderError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderAgain = () => {
    clearTrackedOrder(sessionKey);
    setTrackedOrderId(null);
  };

  const mainPaddingBottom = guestOrderMainPadding(cartExpanded, cart.length > 0);

  if (!tablesHydrated || !menuReady || !bootstrapped) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF7F2] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kado-dark/15 border-t-kado-red" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF7F2] flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-sm">
          <QrCode className="w-12 h-12 text-kado-red/40 mx-auto mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl font-black text-kado-dark mb-2">Table not found</h1>
          <p className="text-kado-dark/60 text-sm mb-6">
            The QR code &ldquo;{code}&rdquo; doesn&apos;t match any active table.
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
        channel="dine-in"
        contextLabel={table.label}
        isLoggedIn={Boolean(user)}
        onOrderAgain={handleOrderAgain}
      />
    );
  }

  if (!table.active) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF7F2] flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-kado-dark mb-2">Table inactive</h1>
          <p className="text-kado-dark/60 text-sm mb-6">
            {table.label} is currently disabled. Please ask staff for help.
          </p>
          <Link to="/" className="text-sm font-bold text-kado-red hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const placeLabel =
    paymentMethod === 'gcash-qr'
      ? 'Place order · pay with GCash'
      : 'Place order · pay cash at counter';

  return (
    <div className="qr-root customer-surface guest-order-page bg-[var(--qr-bg)] text-[var(--qr-text)] font-sans flex flex-col">
      <header className="shrink-0 sticky top-0 z-30 bg-[var(--qr-bg-header)] backdrop-blur-md border-b border-[var(--qr-border)] pt-safe-nav">
        <div className="max-w-3xl mx-auto px-[max(1rem,env(safe-area-inset-left))] sm:px-4 py-3 sm:py-5 [@media(orientation:landscape)_and_(max-height:30rem)]:py-2.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-kado-red text-white flex items-center justify-center font-display font-black text-lg shrink-0">
              角
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-kado-red">
                Dine-in · {table.label}
              </p>
              <h1 className="font-display text-lg sm:text-xl font-black text-[var(--qr-text)] truncate">
                Order from your table
              </h1>
              <p className="text-[11px] text-[var(--qr-text-subtle)] truncate">{branchName}</p>
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
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
              <p className="text-xs text-amber-900 flex-1">
                {hydrateError ?? 'Connecting menu to the shop…'}
              </p>
              <button
                type="button"
                onClick={() => void runSync()}
                disabled={syncing}
                className="shrink-0 min-h-[40px] rounded-lg bg-white border border-amber-300 px-3 text-[10px] font-bold uppercase tracking-wider text-amber-900 touch-manipulation disabled:opacity-50"
              >
                {syncing ? 'Syncing…' : 'Retry sync'}
              </button>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-[max(1rem,env(safe-area-inset-left))] sm:px-4 pb-2">
          <div className="guest-order-category-rail w-full pb-0.5 pr-[max(1rem,env(safe-area-inset-right))] sm:pr-0">
            {categoryTabs.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveCat(c.id);
                  document.getElementById(`qr-cat-${c.id}`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
                className={qrPillClass(activeCat === c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className={`flex-1 max-w-3xl mx-auto w-full min-w-0 px-[max(1rem,env(safe-area-inset-left))] sm:px-4 py-2 sm:py-4 [@media(orientation:landscape)_and_(max-height:30rem)]:py-1.5 ${mainPaddingBottom}`}>
        <QrGuestMenuCatalog
          sections={menuSections}
          activeCategoryId={activeCat}
          onActiveCategoryChange={setActiveCat}
          onSelectProduct={setSelectedProduct}
        />
      </main>

      <QrStickyCart
        cart={cart}
        cartExpanded={cartExpanded}
        onCartExpandedChange={setCartExpanded}
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
        placeOrderAriaLabel="Place dine-in order"
        emptyCartTitle="Your table cart"
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
