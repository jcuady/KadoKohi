import { useMemo, useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { Stamp, Search, Plus, Minus } from 'lucide-react';

export default function BaristaStamps() {
  const users = useUserStore((s) => s.users);
  const adjustLoyaltyStamps = useUserStore((s) => s.adjustLoyaltyStamps);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const customers = useMemo(
    () => users.filter((u) => u.role === 'customer'),
    [users],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 12);
    return customers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [customers, query]);

  const adjust = (id: string, name: string, delta: number) => {
    adjustLoyaltyStamps(id, delta, 'Counter adjustment (barista)');
    setFeedback(`${delta > 0 ? 'Added' : 'Removed'} ${Math.abs(delta)} stamp for ${name}.`);
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--color-dash-bg)', color: 'var(--color-dash-text)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Stamp className="w-6 h-6 text-kado-red" /> Kado Circle Stamps
        </h1>
        <p className="text-sm opacity-70 mt-1">Look up a customer to add or correct loyalty stamps. Every change is audited.</p>

        <div className="relative mt-5">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            style={{ background: 'var(--color-dash-surface)', borderColor: 'var(--color-dash-border)', color: 'var(--color-dash-text)' }}
          />
        </div>

        {feedback && (
          <p className="mt-3 text-xs font-semibold text-green-600">{feedback}</p>
        )}

        <ul className="mt-4 space-y-2">
          {results.length === 0 && (
            <li className="rounded-xl border p-6 text-center text-sm opacity-60" style={{ borderColor: 'var(--color-dash-border)' }}>
              No matching customers.
            </li>
          )}
          {results.map((u) => (
            <li
              key={u.id}
              className="rounded-xl border px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--color-dash-surface)', borderColor: 'var(--color-dash-border)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{u.name}</p>
                <p className="text-[11px] opacity-60 truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-amber-800">
                <Stamp className="w-3.5 h-3.5" />
                <span className="text-sm font-black tabular-nums">{u.loyaltyStamps ?? 0}</span>
              </div>
              <button
                type="button"
                onClick={() => adjust(u.id, u.name, -1)}
                className="rounded-lg border w-9 h-9 flex items-center justify-center hover:bg-kado-red/10"
                style={{ borderColor: 'var(--color-dash-border)' }}
                title="Remove one stamp"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => adjust(u.id, u.name, 1)}
                className="rounded-lg bg-kado-red text-white w-9 h-9 flex items-center justify-center hover:bg-kado-dark"
                title="Add one stamp"
              >
                <Plus className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
