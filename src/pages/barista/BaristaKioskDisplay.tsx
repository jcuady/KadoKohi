import { useMemo } from 'react';
import type { OrderStatus } from '../../types/domain';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';

type KioskColumn = { status: OrderStatus; label: string };

const COLUMNS: KioskColumn[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'ready', label: 'Ready' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

export default function BaristaKioskDisplay() {
  const user = useAuthStore((s) => s.user);
  const orders = useOrderStore((s) => s.orders);
  const adminPosBranchId = useBranchStore((s) => s.adminPosBranchId);
  const branches = useBranchStore((s) => s.branches);

  const activeBranchId = user?.role === 'barista' ? user.branchId : adminPosBranchId ?? branches[0]?.id;
  const activeBranchName = branches.find((branch) => branch.id === activeBranchId)?.name ?? 'Kado Kohi';

  const filtered = useMemo(
    () =>
      orders
        .filter((order) => order.branchId === activeBranchId)
        .filter((order) => COLUMNS.some((col) => col.status === order.status))
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [orders, activeBranchId],
  );

  const requestFullScreen = async () => {
    if (document.fullscreenElement) return;
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Ignore permission errors in unsupported browsers.
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1014] text-white p-5 md:p-8">
      <div className="max-w-[1800px] mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red">Kiosk Display</p>
            <h1 className="font-display text-2xl md:text-4xl font-black uppercase">{activeBranchName}</h1>
          </div>
          <button
            type="button"
            onClick={requestFullScreen}
            className="rounded-full border border-white/20 px-5 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
          >
            Enter Fullscreen
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((column) => {
            const items = filtered.filter((order) => order.status === column.status);
            return (
              <section key={column.status} className="rounded-3xl border border-white/10 bg-white/5 min-h-[420px] p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-lg md:text-xl font-bold uppercase">{column.label}</h2>
                  <span className="text-xs font-black text-kado-red bg-kado-red/10 rounded-full px-2.5 py-1">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 text-white/45 text-sm text-center px-4 py-8">No orders</div>
                  ) : (
                    items.map((order) => (
                      <article key={order.id} className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-display text-2xl font-black tracking-wide">{order.shortCode}</p>
                          <span className="text-xs text-white/60">{timeAgo(order.createdAt)}</span>
                        </div>
                        <p className="text-sm text-white/75 line-clamp-2">
                          {order.items.map((item) => `${item.qty}× ${item.productNameSnapshot}`).join(' · ')}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
