import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { OrderItem, Product } from '../types/domain';
import { useMenuStore } from '../store/menuStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { useBranchStore } from '../store/branchStore';
import { formatPhp, computeOrderTotals } from '../lib/money';
import { useSettingsStore } from '../store/settingsStore';
import { newId } from '../lib/id';
import { ShoppingBag, Check } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';

type CartLine = { key: string; productId: string; qty: number; milkId?: string; temperature?: 'hot' | 'iced' };

function resolveUnit(product: Product, milkId?: string): { unit: number; milkLabel?: string } {
  let unit = product.basePrice;
  let milkLabel: string | undefined;
  if (milkId && product.milks?.length) {
    const m = product.milks.find((x) => x.id === milkId);
    if (m) { unit += m.priceDelta; milkLabel = m.label; }
  }
  return { unit, milkLabel };
}

export default function Order() {
  const user = useAuthStore((s) => s.user);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);
  const createOrder = useOrderStore((s) => s.createOrder);
  const branches = useBranchStore((s) => s.branches);

  const activeBranches = branches.filter((b) => b.status === 'active');

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );

  const [activeCat, setActiveCat] = useState(sortedCategories[0]?.id ?? '');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [branchId, setBranchId] = useState(activeBranches[0]?.id ?? '');
  const [guestName, setGuestName] = useState('');
  const [placed, setPlaced] = useState(false);

  const list = productsByCategory(activeCat || sortedCategories[0]?.id || '');

  const addToCart = (product: Product) => {
    const defaultMilk = product.milks?.[0]?.id;
    const temp: 'hot' | 'iced' = product.temperature === 'iced' ? 'iced' : 'hot';
    setCart((c) => [...c, { key: newId(), productId: product.id, qty: 1, milkId: defaultMilk, temperature: temp }]);
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
    void createOrder({
      channel: 'online',
      branchId,
      customerId: user?.id,
      guestName: user ? undefined : guestName || 'Guest',
      status: 'pending',
      items: cartTotals.lines,
      subtotal: cartTotals.subtotal,
      modifiersTotal: cartTotals.modifiers,
      tax: cartTotals.tax,
      total: cartTotals.total,
    }).then(() => {
      setCart([]);
      setPlaced(true);
    });
  };

  if (placed) {
    return (
      <div className="flex flex-col w-full bg-kado-cream font-sans min-h-screen items-center justify-center px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-kado-red/10 flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-kado-red" />
        </div>
        <h1 className="font-display text-3xl font-bold text-kado-dark mb-2">Order placed!</h1>
        <p className="text-kado-dark/65 max-w-md mb-8">
          Your order has been sent. You'll see it appear in your account dashboard and the barista board shortly.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPlaced(false)}
            className="rounded-full bg-kado-dark text-kado-cream px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors"
          >
            Order again
          </button>
          <Link to="/account" className="rounded-full border-2 border-kado-dark/15 text-kado-dark px-6 py-3 text-xs font-bold uppercase tracking-wider hover:border-kado-red hover:text-kado-red transition-colors">
            My account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-kado-cream font-sans min-h-screen">
      <section className="pt-28 pb-6 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader label="Online" title="Place an order" subtitle="Browse the menu, add to cart, and submit your order for pickup." />
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={placeOrder}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Menu area */}
              <div className="lg:col-span-2 space-y-5">
                <div className="flex flex-wrap gap-2">
                  {sortedCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCat(c.id)}
                      className={`px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                        activeCat === c.id
                          ? 'bg-kado-dark text-kado-cream border-kado-dark'
                          : 'bg-kado-offwhite border-kado-dark/10 hover:border-kado-red/40'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {list.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart(p)}
                      className="text-left rounded-2xl border border-kado-dark/10 bg-kado-offwhite p-5 hover:border-kado-red/40 hover:shadow-lg transition-all group"
                    >
                      <div className="flex justify-between gap-2 items-start">
                        <span className="font-display font-bold text-kado-dark group-hover:text-kado-red transition-colors">{p.name}</span>
                        <span className="font-display font-bold text-kado-red shrink-0">{formatPhp(p.basePrice)}</span>
                      </div>
                      {p.tags?.length ? (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-kado-dark/40 mt-1 inline-block">{p.tags.join(' · ')}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart sidebar */}
              <div className="rounded-[2rem] border border-kado-dark/10 bg-kado-offwhite p-6 h-fit sticky top-24">
                <h2 className="font-display text-lg font-bold text-kado-dark mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-kado-red" /> Cart
                </h2>

                {cart.length === 0 ? (
                  <p className="text-sm text-kado-dark/50 mb-6">Tap a product to add it.</p>
                ) : (
                  <ul className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                    {cart.map((line) => {
                      const p = products.find((x) => x.id === line.productId);
                      if (!p) return null;
                      const { unit } = resolveUnit(p, line.milkId);
                      return (
                        <li key={line.key} className="rounded-xl border border-kado-dark/10 bg-white p-3">
                          <div className="flex justify-between text-sm font-bold text-kado-dark">
                            <span>{p.name}</span>
                            <span className="text-kado-red">{formatPhp(unit)}</span>
                          </div>
                          {p.milks && p.milks.length > 0 && (
                            <select
                              value={line.milkId ?? ''}
                              onChange={(e) => setCart((c) => c.map((x) => (x.key === line.key ? { ...x, milkId: e.target.value || undefined } : x)))}
                              className="w-full mt-1 rounded border border-kado-dark/10 text-xs py-1 px-2"
                            >
                              {p.milks.map((m) => (
                                <option key={m.id} value={m.id}>{m.label} {m.priceDelta ? `+${m.priceDelta}` : ''}</option>
                              ))}
                            </select>
                          )}
                          <button
                            type="button"
                            onClick={() => setCart((c) => c.filter((x) => x.key !== line.key))}
                            className="text-[10px] text-kado-red font-bold mt-1"
                          >
                            Remove
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Branch + guest name */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-kado-dark/60 mb-1">Pickup branch</label>
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full rounded-xl border border-kado-dark/15 bg-white px-3 py-2.5 text-sm"
                      required
                    >
                      {activeBranches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  {!user && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-kado-dark/60 mb-1">Your name (guest)</label>
                        <input
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="e.g. Juan"
                          className="w-full rounded-xl border border-kado-dark/15 bg-white px-3 py-2.5 text-sm"
                        />
                      </div>
                      <p className="text-[10px] text-kado-dark/50">
                        <Link to="/auth/signup" className="font-bold text-kado-red hover:underline">Create a free account</Link>
                        {' '}to track orders & earn loyalty stamps.
                      </p>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-kado-dark/10 pt-4 space-y-1 mb-4">
                  <div className="flex justify-between text-xs text-kado-dark/55">
                    <span>Subtotal</span><span>{formatPhp(cartTotals.subtotal)}</span>
                  </div>
                  {cartTotals.modifiers > 0 && (
                    <div className="flex justify-between text-xs text-kado-dark/55">
                      <span>Modifiers</span><span>+{formatPhp(cartTotals.modifiers)}</span>
                    </div>
                  )}
                  {cartTotals.tax > 0 && (
                    <div className="flex justify-between text-xs text-kado-dark/55">
                      <span>Tax ({taxRate}%)</span><span>{formatPhp(cartTotals.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-display font-bold text-kado-dark pt-1">
                    <span>Total</span><span className="text-kado-red">{formatPhp(cartTotals.total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full rounded-2xl bg-kado-red text-kado-cream py-4 text-xs font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-kado-dark transition-colors"
                >
                  Place order
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
