import { useMemo, useState } from 'react';
import type { OrderItem, Product } from '../../types/domain';
import { useBranchStore } from '../../store/branchStore';
import { useMenuStore } from '../../store/menuStore';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { formatPhp, computeOrderTotals } from '../../lib/money';
import { useSettingsStore } from '../../store/settingsStore';
import { newId } from '../../lib/id';
import { ShoppingBag } from 'lucide-react';

type CartLine = { key: string; productId: string; qty: number; milkId?: string; temperature?: 'hot' | 'iced' };

function resolveLineUnitPrice(product: Product, milkId?: string): { unit: number; milkLabel?: string } {
  let unit = product.basePrice;
  let milkLabel: string | undefined;
  if (milkId && product.milks?.length) {
    const m = product.milks.find((x) => x.id === milkId);
    if (m) {
      unit += m.priceDelta;
      milkLabel = m.label;
    }
  }
  return { unit, milkLabel };
}

export default function BaristaPOS() {
  const user = useAuthStore((s) => s.user);
  const branches = useBranchStore((s) => s.branches);
  const adminPosBranchId = useBranchStore((s) => s.adminPosBranchId);
  const setAdminPosBranchId = useBranchStore((s) => s.setAdminPosBranchId);

  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);
  const createOrder = useOrderStore((s) => s.createOrder);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);

  const lockedBranchId = user?.role === 'barista' ? user.branchId : null;
  const effectiveBranchId = lockedBranchId ?? adminPosBranchId ?? branches[0]?.id ?? null;

  const [activeCat, setActiveCat] = useState(() => categories[0]?.id ?? '');
  const [cart, setCart] = useState<CartLine[]>([]);

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );
  const list = productsByCategory(activeCat || sortedCategories[0]?.id || '');
  const branch = branches.find((b) => b.id === effectiveBranchId);

  const addToCart = (product: Product) => {
    const defaultMilk = product.milks?.[0]?.id;
    const defaultTemp: 'hot' | 'iced' | undefined =
      product.temperature === 'iced' ? 'iced' : product.temperature === 'hot' ? 'hot' : 'hot';
    setCart((c) => [
      ...c,
      {
        key: newId(),
        productId: product.id,
        qty: 1,
        milkId: product.milks?.length ? defaultMilk : undefined,
        temperature: product.temperature === 'both' ? defaultTemp : product.temperature === 'iced' ? 'iced' : 'hot',
      },
    ]);
  };

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let modifiers = 0;
    const lines: OrderItem[] = [];
    for (const line of cart) {
      const p = products.find((x) => x.id === line.productId);
      if (!p) continue;
      const { unit, milkLabel } = resolveLineUnitPrice(p, line.milkId);
      const base = p.basePrice;
      const mod = unit - base;
      subtotal += base * line.qty;
      modifiers += mod * line.qty;
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

  const placeOrder = () => {
    if (!branch || !user || cartTotals.lines.length === 0) return;
    createOrder({
      channel: 'pos',
      branchId: branch.id,
      staffId: user.id,
      status: 'pending',
      items: cartTotals.lines,
      subtotal: cartTotals.subtotal,
      modifiersTotal: cartTotals.modifiers,
      tax: cartTotals.tax,
      total: cartTotals.total,
    });
    setCart([]);
  };

  if (!branch) {
    return <p className="p-8 dash-muted">No branch configured.</p>;
  }

  return (
    <div className="dash-page p-4 md:p-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">POS</h1>
          <p className="dash-muted text-sm mt-1">
            {lockedBranchId ? 'Locked to your branch.' : 'Admin: pick branch (synced with Admin POS selector).'}
          </p>
        </div>
        {!lockedBranchId && (
          <select
            value={adminPosBranchId ?? ''}
            onChange={(e) => setAdminPosBranchId(e.target.value || null)}
            className="rounded-xl border dash-input px-4 py-2.5 text-sm font-semibold max-w-xs"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="rounded-[2rem] border dash-card p-4 md:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2">
              {sortedCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCat(c.id)}
                  className={`px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    activeCat === c.id ? 'bg-kado-red text-kado-cream border-kado-red' : 'dash-card-alt dash-border'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {list.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  className="text-left rounded-xl border dash-card-alt dash-border p-3 hover:border-kado-red/40"
                >
                  <div className="flex justify-between gap-2 font-display font-bold text-sm">
                    <span>{p.name}</span>
                    <span className="text-kado-red">{formatPhp(p.basePrice)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-kado-red" />
              Cart
            </h2>
            {cart.length === 0 ? (
              <p className="text-sm dash-muted">Add items.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto mb-3">
                {cart.map((line) => {
                  const p = products.find((x) => x.id === line.productId);
                  if (!p) return null;
                  const { unit } = resolveLineUnitPrice(p, line.milkId);
                  return (
                    <li key={line.key} className="text-xs rounded-lg border dash-border p-2 space-y-1">
                      <div className="font-bold">{p.name}</div>
                      {p.milks && p.milks.length > 0 && (
                        <select
                          value={line.milkId ?? ''}
                          onChange={(e) =>
                            setCart((c) =>
                              c.map((x) => (x.key === line.key ? { ...x, milkId: e.target.value || undefined } : x)),
                            )
                          }
                          className="w-full rounded border dash-input text-xs py-1"
                        >
                          {p.milks.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label} +{m.priceDelta}
                            </option>
                          ))}
                        </select>
                      )}
                      <button type="button" className="text-kado-red font-bold" onClick={() => setCart((c) => c.filter((x) => x.key !== line.key))}>
                        Remove
                      </button>
                      <div className="font-bold">{formatPhp(unit * line.qty)}</div>
                    </li>
                  );
                })}
              </ul>
            )}
            {cart.length > 0 && (
              <div className="space-y-1 text-xs dash-muted mb-3 border-t dash-border pt-2">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPhp(cartTotals.subtotal)}</span></div>
                {cartTotals.modifiers > 0 && <div className="flex justify-between"><span>Modifiers</span><span>{formatPhp(cartTotals.modifiers)}</span></div>}
                {cartTotals.tax > 0 && <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>{formatPhp(cartTotals.tax)}</span></div>}
                <div className="flex justify-between font-display font-bold dash-heading pt-1"><span>Total</span><span className="text-kado-red">{formatPhp(cartTotals.total)}</span></div>
              </div>
            )}
            <button
              type="button"
              disabled={!cart.length}
              onClick={placeOrder}
              className="w-full rounded-xl bg-kado-red text-kado-cream py-3 text-xs font-bold uppercase tracking-wider disabled:opacity-40"
            >
              Place order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
