import { useEffect, useMemo, useState } from 'react';
import { useAuditStore } from '../../store/auditStore';
import { isInternalRole } from '../../lib/roles';
import { ScrollText, RefreshCw, Filter, Search } from 'lucide-react';
import type { AuditLogRow } from '../../lib/supabase/repositories/audit';

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-kado-red/10 text-kado-red border-kado-red/20',
  barista: 'bg-blue-100 text-blue-800 border-blue-200',
  staff: 'bg-teal-100 text-teal-800 border-teal-200',
  customer: 'bg-amber-100 text-amber-800 border-amber-200',
  guest: 'bg-gray-100 text-gray-700 border-gray-200',
};

const ACTION_LABEL: Record<string, string> = {
  'order.created': 'Order placed',
  'order.status_changed': 'Order status',
  'order.payment_status_changed': 'Payment status',
  'order.proof_submitted': 'Payment proof',
  'order.cancelled_by_guest': 'Guest cancellation',
  'order.payment_switched_to_cash': 'Switched to cash',
  'order.deleted': 'Order deleted',
  'loyalty.stamps_adjusted': 'Stamp adjustment',
  'user.created': 'User created',
  'user.updated': 'User updated',
  'user.deleted': 'User deleted',
  'menu.product_created': 'Menu product created',
  'menu.product_updated': 'Menu product updated',
  'menu.product_deleted': 'Menu product deleted',
  'menu.category_created': 'Menu category created',
  'menu.category_updated': 'Menu category updated',
  'menu.category_deleted': 'Menu category deleted',
  'menu.stock_changed': 'Stock changed',
  'settings.updated': 'Settings updated',
  'branch.created': 'Branch created',
  'branch.updated': 'Branch updated',
  'branch.deleted': 'Branch deleted',
  'table.created': 'Table created',
  'table.updated': 'Table updated',
  'table.deleted': 'Table deleted',
  'table.toggled': 'Table toggled',
  'promo.created': 'Promo created',
  'promo.updated': 'Promo updated',
  'promo.toggled': 'Promo toggled',
  'promo.deleted': 'Promo deleted',
};

type RoleFilter = 'team' | 'admin' | 'barista' | 'staff' | 'customer' | 'all';

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function channelBadge(metadata: Record<string, unknown> | undefined): string | null {
  const channel = metadata?.channel;
  if (typeof channel !== 'string') return null;
  if (channel === 'pos') return 'POS';
  if (channel === 'dine-in') return 'Dine-in';
  if (channel === 'takeout') return 'Takeout';
  return channel;
}

function matchesAuditSearch(log: AuditLogRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    log.summary,
    log.actorEmail,
    log.action,
    log.entityType,
    log.entityId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export default function AdminAuditLog() {
  const logs = useAuditStore((s) => s.logs);
  const loading = useAuditStore((s) => s.loading);
  const error = useAuditStore((s) => s.error);
  const refresh = useAuditStore((s) => s.refresh);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('team');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim();
    let list = logs;

    if (q) {
      list = list.filter((l) => matchesAuditSearch(l, q));
    } else if (roleFilter === 'team') {
      list = list.filter((l) => isInternalRole(l.actorRole));
    } else if (roleFilter !== 'all') {
      list = list.filter((l) => l.actorRole === roleFilter);
    }

    return list;
  }, [logs, roleFilter, search]);

  const rolePills: { id: RoleFilter; label: string }[] = [
    { id: 'team', label: 'Team' },
    { id: 'admin', label: 'Admin' },
    { id: 'barista', label: 'Barista' },
    { id: 'staff', label: 'Staff' },
    { id: 'customer', label: 'Customer' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="dash-page max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading flex items-center gap-2">
            <ScrollText className="w-7 h-7 text-kado-red" /> Audit Log
          </h1>
          <p className="dash-muted text-sm mt-1">
            Team actions by default. Customer activity appears when you search or choose the Customer filter.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-xl bg-kado-dark text-kado-cream px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="rounded-2xl dash-card border dash-border p-4 mb-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dash-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search summary, email, action…"
            className="w-full rounded-xl dash-input pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 dash-muted shrink-0" />
          {rolePills.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setRoleFilter(id)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                roleFilter === id ? 'bg-kado-red text-white border-kado-red' : 'dash-border dash-muted hover:bg-kado-cream'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-2xl dash-card border p-10 text-center dash-muted text-sm">
          {search.trim()
            ? 'No audit entries match your search.'
            : roleFilter === 'customer'
              ? 'No customer actions logged yet.'
              : 'No team audit entries yet. Actions appear here as staff process orders.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((log) => (
            <li key={log.id} className="rounded-xl dash-card border px-5 py-3.5 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm dash-heading">{ACTION_LABEL[log.action] ?? log.action}</span>
                  {channelBadge(log.metadata) && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-kado-cream text-kado-dark border-kado-dark/15">
                      {channelBadge(log.metadata)}
                    </span>
                  )}
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      ROLE_BADGE[log.actorRole ?? ''] ?? 'dash-card-alt dash-muted dash-border'
                    }`}
                  >
                    {log.actorRole ?? 'system'}
                  </span>
                </div>
                <p className="text-xs dash-heading mt-1">{log.summary ?? '—'}</p>
                <p className="text-[10px] dash-muted mt-0.5">
                  {log.actorEmail ?? 'unknown'} · {timeAgo(log.createdAt)}
                </p>
                {Object.keys(log.metadata ?? {}).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpandedId((id) => (id === log.id ? null : log.id))}
                    className="mt-1 text-[10px] font-semibold text-kado-red hover:underline"
                  >
                    {expandedId === log.id ? 'Hide details' : 'Show details'}
                  </button>
                )}
                {expandedId === log.id && (
                  <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-black/5 p-2 text-[10px] dash-muted whitespace-pre-wrap break-all">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
