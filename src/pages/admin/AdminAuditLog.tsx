import { useEffect, useMemo, useState } from 'react';
import { useAuditStore } from '../../store/auditStore';
import { ScrollText, RefreshCw, Filter } from 'lucide-react';

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-kado-red/10 text-kado-red border-kado-red/20',
  barista: 'bg-blue-100 text-blue-800 border-blue-200',
  staff: 'bg-teal-100 text-teal-800 border-teal-200',
  customer: 'bg-amber-100 text-amber-800 border-amber-200',
};

const ACTION_LABEL: Record<string, string> = {
  'order.status_changed': 'Order status',
  'order.payment_status_changed': 'Payment status',
  'loyalty.stamps_adjusted': 'Stamp adjustment',
  'user.deleted': 'User deleted',
};

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

export default function AdminAuditLog() {
  const logs = useAuditStore((s) => s.logs);
  const loading = useAuditStore((s) => s.loading);
  const error = useAuditStore((s) => s.error);
  const refresh = useAuditStore((s) => s.refresh);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(
    () => (roleFilter === 'all' ? logs : logs.filter((l) => l.actorRole === roleFilter)),
    [logs, roleFilter],
  );

  return (
    <div className="dash-page max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading flex items-center gap-2">
            <ScrollText className="w-7 h-7 text-kado-red" /> Audit Log
          </h1>
          <p className="dash-muted text-sm mt-1">
            Every status change, payment action, and stamp adjustment by admin, staff & baristas.
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

      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 dash-muted" />
        {['all', 'admin', 'barista', 'staff', 'customer'].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRoleFilter(r)}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
              roleFilter === r ? 'bg-kado-red text-white border-kado-red' : 'dash-border dash-muted hover:bg-kado-cream'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-2xl dash-card border p-10 text-center dash-muted text-sm">
          No audit entries yet. Actions will appear here as staff process orders.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((log) => (
            <li key={log.id} className="rounded-xl dash-card border px-5 py-3.5 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm dash-heading">{ACTION_LABEL[log.action] ?? log.action}</span>
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
