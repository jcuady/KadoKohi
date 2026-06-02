import { useEffect, useMemo, useState } from 'react';
import { useMenuStore } from '../../store/menuStore';
import { formatPhp } from '../../lib/money';
import MenuProductStockButton from '../../components/menu/MenuProductStockButton';
import { isProductInStock } from '../../lib/productStock';

export default function BaristaMenu() {
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const remoteLoaded = useMenuStore((s) => s.remoteLoaded);

  useEffect(() => {
    void useMenuStore.getState().hydrateFromRemote();
  }, []);

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );

  const [activeCat, setActiveCat] = useState(sortedCategories[0]?.id ?? '');

  useEffect(() => {
    if (!sortedCategories.length) return;
    if (!activeCat || !sortedCategories.some((c) => c.id === activeCat)) {
      setActiveCat(sortedCategories[0].id);
    }
  }, [sortedCategories, activeCat]);

  const list = useMemo(
    () =>
      products
        .filter((p) => p.categoryId === activeCat && p.visible)
        .sort((a, b) => a.order - b.order),
    [products, activeCat],
  );

  if (!remoteLoaded) {
    return (
      <div className="dash-page p-8 flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kado-dark/15 border-t-kado-red" />
      </div>
    );
  }

  return (
    <div className="dash-page p-4 md:p-8 max-w-4xl">
      <h1 className="font-display text-2xl md:text-3xl font-bold dash-heading mb-1">Menu</h1>
      <p className="dash-muted text-xs mb-6">
        Mark drinks out of stock when you run out — customers will still see them but cannot order.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {sortedCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCat(c.id)}
            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all touch-manipulation ${
              activeCat === c.id
                ? 'bg-kado-red text-kado-cream border-kado-red'
                : 'dash-card-alt dash-border dash-muted hover:border-kado-red/40'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {list.map((p) => {
          const inStock = isProductInStock(p);
          return (
            <div
              key={p.id}
              className={`rounded-xl border dash-card p-4 flex flex-col gap-3 ${
                inStock ? '' : 'opacity-80 border-amber-200/60 bg-amber-50/30'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <span className="font-display font-bold text-sm dash-heading block truncate">
                    {p.name}
                  </span>
                  {!inStock && (
                    <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Out of stock
                    </span>
                  )}
                </div>
                <span className="font-display font-bold text-sm text-kado-red shrink-0">
                  {formatPhp(p.basePrice)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] dash-muted">
                <span>{p.temperature}</span>
                {p.milks.length > 0 && <span>{p.milks.map((m) => m.label).join(', ')}</span>}
              </div>
              <MenuProductStockButton product={p} compact />
            </div>
          );
        })}
      </div>

      {list.length === 0 && (
        <p className="text-sm dash-muted text-center py-12">No drinks in this category.</p>
      )}
    </div>
  );
}
