import { useMemo, useState } from 'react';
import { useMenuStore } from '../../store/menuStore';
import { formatPhp } from '../../lib/money';

export default function BaristaMenu() {
  const categories = useMenuStore((s) => s.categories);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );

  const [activeCat, setActiveCat] = useState(sortedCategories[0]?.id ?? '');
  const list = productsByCategory(activeCat || sortedCategories[0]?.id || '');

  return (
    <div className="dash-page p-4 md:p-8 max-w-4xl">
      <h1 className="font-display text-2xl md:text-3xl font-bold dash-heading mb-1">Menu Reference</h1>
      <p className="dash-muted text-xs mb-6">Read-only — for quick lookups at the counter.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {sortedCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCat(c.id)}
            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
              activeCat === c.id
                ? 'bg-kado-red text-kado-cream border-kado-red'
                : 'dash-card-alt dash-border dash-muted hover:border-kado-red/40'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {list.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border dash-card p-4"
          >
            <div className="flex justify-between items-start gap-2">
              <span className="font-display font-bold text-sm dash-heading">{p.name}</span>
              <span className="font-display font-bold text-sm text-kado-red shrink-0">{formatPhp(p.basePrice)}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] dash-muted">
              <span>{p.temperature}</span>
              {p.milks.length > 0 && <span>{p.milks.map((m) => m.label).join(', ')}</span>}
              {p.tags?.map((t) => (
                <span key={t} className="bg-kado-red/15 text-kado-red px-1.5 py-0.5 rounded">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
