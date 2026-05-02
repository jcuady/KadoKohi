import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { OrderItem, Product } from '../types/domain';
import { useMenuStore } from '../store/menuStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { useBranchStore } from '../store/branchStore';
import { formatPhp, computeOrderTotals } from '../lib/money';
import { useSettingsStore } from '../store/settingsStore';
import { newId } from '../lib/id';
import { ShoppingBag, Check } from 'lucide-react';

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

export default function OrderTakeout() {
  const user = useAuthStore((s) => s.user);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);
  const [searchParams] = useSearchParams();
  const branchSlug = searchParams.get('b') ?? '';
  const branches = useBranchStore((s) => s.branches);
  const branch = branches.find((b) => b.slug === branchSlug) ?? branches.find((b) => b.status === 'active');

  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);
  const createOrder = useOrderStore((s) => s.createOrder);

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );

  const [activeCat, setActiveCat] = useState(sortedCategories[0]?.id ?? '');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickupName, setPickupName] = useState('');
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
      lines.push({ id: newId(), productId: p.id, productNameSnapshot: p.name, milkId: line.milkId, milkLabelSnapshot: milkLabel, temperature: line.temperature, unitPrice: unit, qty: line.qty, lineTotal: unit * line.qty });
    }
    const { tax, total } = computeOrderTotals(subtotal, modifiers, taxRate);
    return { lines, subtotal, modifiers, tax, total };
  }, [cart, products, taxRate]);

  const placeOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!branch || cartTotals.lines.length === 0 || !pickupName.trim()) return;
    createOrder({
      channel: 'takeout',
      branchId: branch.id,
      customerId: user?.id,
      guestName: pickupName.trim(),
      status: 'pending',
      items: cartTotals.lines,
      subtotal: cartTotals.subtotal,
      modifiersTotal: cartTotals.modifiers,
      tax: cartTotals.tax,
      total: cartTotals.total,
    });
    setCart([]);
    setPlaced(true);
  };

  if (!branch) {
    return (
      <div className="min-h-screen bg-kado-cream flex items-center justify-center px-6 py-24 text-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-kado-dark mb-2">Branch not found</h1>
          <p className="text-kado-dark/65 mb-6">Could not resolve the branch from this QR code.</p>
          <Link to="/" className="text-sm font-bold text-kado-red hover:underline">Back to home</Link>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="min-h-screen bg-kado-cream flex items-center justify-center px-6 py-24 text-center">
        <div>
          <div className="w-16 h-16 rounded-full bg-kado-red/10 flex items-center justify-center mb-6 mx-auto">
            <Check className="w-8 h-8 text-kado-red" />
          </div>
          <h1 className="font-display text-3xl font-bold text-kado-dark mb-2">Takeout order placed!</h1>
          <p className="text-kado-dark/65 max-w-md mb-6">
            We'll call out <strong>{pickupName}</strong> when your order is ready. Stay nearby!
          </p>
          <button type="button" onClick={() => { setPlaced(false); setPickupName(''); }} className="rounded-full bg-kado-dark text-kado-cream px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors">
            Order again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kado-cream font-sans px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-kado-red">Takeout · {branch.name}</span>
          <h1 className="font-display text-2xl font-bold text-kado-dark mt-1">Grab & Go</h1>
        </div>

        <form onSubmit={placeOrder}>
          <div className="mb-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-kado-dark/60 mb-1.5">Your name (for pickup)</label>
            <input
              value={pickupName}
              onChange={(e) => setPickupName(e.target.value)}
              placeholder="e.g. Juan"
              required
              className="w-full rounded-xl border border-kado-dark/15 bg-kado-offwhite px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {sortedCategories.map((c) => (
              <button key={c.id} type="button" onClick={() => setActiveCat(c.id)} className={`px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border ${activeCat === c.id ? 'bg-kado-dark text-kado-cream border-kado-dark' : 'bg-kado-offwhite border-kado-dark/10'}`}>
                {c.name}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-2 mb-6">
            {list.map((p) => (
              <button key={p.id} type="button" onClick={() => addToCart(p)} className="text-left rounded-xl border border-kado-dark/10 bg-kado-offwhite p-4 hover:border-kado-red/40 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-display font-bold text-sm text-kado-dark">{p.name}</span>
                  <span className="font-display font-bold text-sm text-kado-red">{formatPhp(p.basePrice)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Cart */}
          <div className="rounded-2xl border border-kado-dark/10 bg-kado-offwhite p-5">
            <h2 className="font-display font-bold text-kado-dark mb-3 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-kado-red" /> Cart
            </h2>
            {cart.length === 0 ? (
              <p className="text-sm text-kado-dark/50">Tap items above to add.</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {cart.map((line) => {
                  const p = products.find((x) => x.id === line.productId);
                  if (!p) return null;
                  const { unit } = resolveUnit(p, line.milkId);
                  return (
                    <li key={line.key} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-kado-dark/5">
                      <span className="text-sm font-bold text-kado-dark">{p.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-kado-red font-bold">{formatPhp(unit)}</span>
                        <button type="button" onClick={() => setCart((c) => c.filter((x) => x.key !== line.key))} className="text-[10px] text-red-500 font-bold">×</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="space-y-1 text-xs text-kado-dark/60 border-t border-kado-dark/10 pt-3 mb-2">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPhp(cartTotals.subtotal)}</span></div>
              {cartTotals.modifiers > 0 && <div className="flex justify-between"><span>Modifiers</span><span>+{formatPhp(cartTotals.modifiers)}</span></div>}
              {cartTotals.tax > 0 && <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>{formatPhp(cartTotals.tax)}</span></div>}
            </div>
            <div className="flex justify-between font-display font-bold text-kado-dark mb-4">
              <span>Total</span><span className="text-kado-red">{formatPhp(cartTotals.total)}</span>
            </div>
            <button type="submit" disabled={cart.length === 0 || !pickupName.trim()} className="w-full rounded-2xl bg-kado-red text-kado-cream py-4 text-xs font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-kado-dark transition-colors">
              Place takeout order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
