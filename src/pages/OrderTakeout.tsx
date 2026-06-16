import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Product, PaymentMethod } from '../types/domain';
import { useMenuStore } from '../store/menuStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { useBranchStore } from '../store/branchStore';
import { formatPhp } from '../lib/money';
import { clampText, formatOrderError, requireGuestName } from '../lib/validation';
import {
  cartLinesMatchMenu,
  ensureOrderReadiness,
  isOrderCatalogReady,
} from '../lib/orderReadiness';
import { buildQrCartTotals, type QrCartLine } from '../lib/qrOrderCart';
import { useSettingsStore } from '../store/settingsStore';
import { getProductDescription, getProductImageUrl } from '../lib/productImage';
import { isProductInStock } from '../lib/productStock';
import { newId } from '../lib/id';
import { clearTrackedOrder, getTrackedOrder, setTrackedOrder } from '../lib/guestOrders';
import QrProductSheet, { type QrCartPayload } from '../components/qr/QrProductSheet';
import QrStickyCart from '../components/qr/QrStickyCart';
import OrderTrackingPanel from '../components/order/OrderTrackingPanel';
import { startGuestPageRealtime, stopGuestPageRealtime } from '../lib/supabase/guestPageRealtime';
import { Store } from 'lucide-react';
import { qrPillClass } from '../lib/qrGuestTheme';
import { guestOrderMainPadding } from '../lib/guestOrderLayout';
import MixMatchQrSection from '../components/mix-match/MixMatchQrSection';

export default function OrderTakeout() {
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

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );

  const sessionKey = `takeout.${branch?.slug ?? branchSlug ?? 'default'}`;

  const [activeCat, setActiveCat] = useState('');
  const [cart, setCart] = useState<QrCartLine[]>([]);
  const [pickupName, setPickupName] = useState(user?.name ?? '');
  const [cartExpanded, setCartExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [trackedLabel, setTrackedLabel] = useState('');
  const [orderError, setOrderError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash-qr');

  useEffect(() => {
    const ref = getTrackedOrder(sessionKey);
    if (ref) {
      setTrackedOrderId(ref.orderId);
      setTrackedLabel(ref.label);
    }
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
    if (!sortedCategories.length) return;
    if (!activeCat || !sortedCategories.some((c) => c.id === activeCat)) {
      setActiveCat(sortedCategories[0].id);
    }
  }, [sortedCategories, activeCat]);

  const list = useMemo(
    () => (activeCat ? productsByCategory(activeCat) : []),
    [activeCat, productsByCategory],
  );

  const cartCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);
  const cartTotals = useMemo(
    () => buildQrCartTotals(cart, products, taxRate),
    [cart, products, taxRate],
  );
  const cartStale = cart.length > 0 && !cartLinesMatchMenu(cart, cartTotals.lines);

  const addLine = (payload: QrCartPayload) => {
    setCart((prev) => {
      const match = prev.find(
        (l) =>
          l.productId === payload.productId &&
          l.milkId === payload.milkId &&
          l.temperature === payload.temperature &&
          l.mixMatchCookieId === payload.mixMatchCookieId,
      );
      if (match) {
        return prev.map((l) => (l.key === match.key ? { ...l, qty: l.qty + payload.qty } : l));
      }
      return [...prev, { ...payload, key: newId() }];
    });
    setCartExpanded(true);
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
        customerId: user?.id,
        guestName: clampText(pickupName, 80),
        paymentMethod,
        items: freshTotals.lines,
        subtotal: freshTotals.subtotal,
        modifiersTotal: freshTotals.modifiers,
        tax: freshTotals.tax,
        total: freshTotals.total,
      });
      setTrackedOrder(sessionKey, {
        orderId: order.id,
        shortCode: order.shortCode,
        label: pickupName.trim(),
        placedAt: order.createdAt,
      });
      setTrackedOrderId(order.id);
      setTrackedLabel(pickupName.trim());
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
    setTrackedLabel('');
  };

  const mainPaddingBottom = guestOrderMainPadding(cartExpanded, cart.length > 0);

  if (!menuReady || !bootstrapped) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF7F2] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kado-dark/15 border-t-kado-red" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF7F2] flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-sm">
          <Store className="w-12 h-12 text-kado-red/40 mx-auto mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl font-black text-kado-dark mb-2">
            Branch not found
          </h1>
          <p className="text-kado-dark/60 text-sm mb-6">
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
        channel="takeout"
        contextLabel={trackedLabel || pickupName || 'your order'}
        isLoggedIn={Boolean(user)}
        onOrderAgain={handleOrderAgain}
      />
    );
  }

  const placeLabel =
    paymentMethod === 'gcash-qr'
      ? 'Place order · pay with GCash'
      : 'Place order · pay cash at counter';

  return (
    <div className="qr-root guest-order-page bg-[var(--qr-bg)] text-[var(--qr-text)] font-sans flex flex-col">
      <header className="shrink-0 sticky top-0 z-30 bg-[var(--qr-bg-header)] backdrop-blur-md border-b border-[var(--qr-border)] pt-safe-nav">
        <div className="max-w-3xl mx-auto px-[max(1rem,env(safe-area-inset-left))] sm:px-4 py-3 sm:py-5 [@media(orientation:landscape)_and_(max-height:30rem)]:py-2.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-kado-red text-white flex items-center justify-center font-display font-black text-lg shrink-0">
              角
            </div>
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

        <div className="max-w-3xl mx-auto px-[max(1rem,env(safe-area-inset-left))] sm:px-4 pb-3">
          <div className="guest-order-category-rail w-full pb-0.5 pr-[max(1rem,env(safe-area-inset-right))] sm:pr-0">
            {sortedCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCat(c.id)}
                className={qrPillClass(activeCat === c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className={`flex-1 max-w-3xl mx-auto w-full min-w-0 px-[max(1rem,env(safe-area-inset-left))] sm:px-4 py-3 sm:py-6 [@media(orientation:landscape)_and_(max-height:30rem)]:py-2 ${mainPaddingBottom}`}>
        <div className="mb-4 rounded-2xl border border-kado-dark/8 bg-white p-4">
          <label className="block text-[10px] font-black uppercase tracking-widest text-kado-dark/45 mb-2">
            Your name (for pickup)
          </label>
          <input
            value={pickupName}
            onChange={(e) => {
              setPickupName(e.target.value);
              setOrderError('');
            }}
            placeholder="e.g. Juan"
            maxLength={80}
            className="w-full rounded-xl border border-kado-dark/12 bg-[#FAF7F2] px-4 py-3 text-sm min-h-[48px] focus:outline-none focus:ring-2 focus:ring-kado-red/30 touch-manipulation"
          />
        </div>

        <MixMatchQrSection categories={categories} products={products} onAdd={addLine} />

        {list.length === 0 ? (
          <p className="text-center text-sm text-kado-dark/50 py-16">
            No items in this category right now. Check another tab or ask staff.
          </p>
        ) : (
          <div className="guest-order-product-grid">
            {list.map((p, i) => {
              const image = getProductImageUrl(p);
              const tag = p.tags?.[0];
              const inStock = isProductInStock(p);
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  disabled={!inStock}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.2) }}
                  onClick={() => inStock && setSelectedProduct(p)}
                  className={`text-left bg-white border border-kado-dark/8 rounded-2xl overflow-hidden transition-all touch-manipulation flex flex-col h-full ${
                    inStock
                      ? 'hover:border-kado-red/25 hover:shadow-md'
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
                    {!inStock ? (
                      <span className="absolute top-1.5 left-1.5 text-[7px] font-black uppercase tracking-widest bg-amber-600 text-white px-1.5 py-0.5 rounded-full">
                        Out of stock
                      </span>
                    ) : (
                      tag && (
                        <span className="absolute top-1.5 left-1.5 text-[7px] font-black uppercase tracking-widest bg-kado-dark/85 text-white px-1.5 py-0.5 rounded-full">
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                  <div className="p-2.5 sm:p-3 flex flex-col flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <h3 className="font-display font-bold text-xs sm:text-sm text-kado-dark line-clamp-2 leading-snug">
                        {p.name}
                      </h3>
                      <span className="font-black text-xs sm:text-sm text-kado-red shrink-0">
                        {formatPhp(p.basePrice)}
                      </span>
                    </div>
                    <p className="text-[10px] text-kado-dark/45 line-clamp-2 leading-snug mt-auto">
                      {getProductDescription(p)}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
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
          !pickupName.trim() ||
          submitting ||
          syncing ||
          cartStale ||
          !catalogOrderable ||
          (cartExpanded && cartTotals.lines.length === 0)
        }
        placeButtonLabel={placeLabel}
        placeOrderAriaLabel="Place takeout order"
        emptyCartTitle="Your takeout bag"
        beforePlaceButton={
          cart.length > 0 && !pickupName.trim() ? (
            <p className="text-[11px] text-kado-red font-semibold text-center">
              Add your name above so we can call you for pickup.
            </p>
          ) : undefined
        }
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
