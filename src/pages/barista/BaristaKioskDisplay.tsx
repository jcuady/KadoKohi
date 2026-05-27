import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { OrderStatus } from '../../types/domain';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { useKioskTheme } from '../../hooks/useKioskTheme';
import { kioskColumnStatus, ORDER_STATUS_LABELS } from '../../lib/orderStatus';

type KioskColumn = {
  status: OrderStatus;
  label: string;
  accentLight: string;
  accentDark: string;
  badgeLight: string;
  badgeDark: string;
};

const COLUMNS: KioskColumn[] = [
  {
    status: 'pending_payment',
    label: ORDER_STATUS_LABELS.pending_payment,
    accentLight: 'border-t-amber-500',
    accentDark: 'border-t-amber-400',
    badgeLight: 'bg-amber-500/15 text-amber-900',
    badgeDark: 'bg-amber-400/20 text-amber-200',
  },
  {
    status: 'paid',
    label: ORDER_STATUS_LABELS.paid,
    accentLight: 'border-t-sky-600',
    accentDark: 'border-t-sky-400',
    badgeLight: 'bg-sky-600/10 text-sky-900',
    badgeDark: 'bg-sky-400/15 text-sky-200',
  },
  {
    status: 'preparing',
    label: ORDER_STATUS_LABELS.preparing,
    accentLight: 'border-t-kado-red',
    accentDark: 'border-t-kado-red',
    badgeLight: 'bg-kado-red/12 text-kado-red',
    badgeDark: 'bg-kado-red/25 text-kado-cream',
  },
  {
    status: 'ready',
    label: ORDER_STATUS_LABELS.ready,
    accentLight: 'border-t-emerald-600',
    accentDark: 'border-t-emerald-400',
    badgeLight: 'bg-emerald-600/10 text-emerald-900',
    badgeDark: 'bg-emerald-400/15 text-emerald-200',
  },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

export default function BaristaKioskDisplay() {
  const { isDark, toggle } = useKioskTheme();
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
        .filter((order) => kioskColumnStatus(order.status) !== null)
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [orders, activeBranchId],
  );

  const requestFullScreen = async () => {
    if (document.fullscreenElement) return;
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* unsupported */
    }
  };

  return (
    <motion.div
      className={`kiosk-root min-h-screen font-sans transition-colors duration-300 ${isDark ? 'kiosk-dark' : 'kiosk-light'}`}
      style={{
        background: `linear-gradient(145deg, var(--kiosk-bg) 0%, var(--kiosk-bg-accent) 55%, var(--kiosk-bg) 100%)`,
        color: 'var(--kiosk-text)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <motion.div
          className={`absolute -right-24 top-0 h-72 w-72 rounded-full blur-3xl ${isDark ? 'bg-kado-red/15' : 'bg-kado-red/8'}`}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute -left-16 bottom-0 h-64 w-64 rounded-full blur-3xl ${isDark ? 'bg-kado-cream/5' : 'bg-kado-cream/35'}`}
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-[1800px] p-5 md:p-8">
        <header
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-4 md:px-6 md:py-5"
          style={{
            background: 'var(--kiosk-surface)',
            borderColor: 'var(--kiosk-border)',
            boxShadow: 'var(--kiosk-order-shadow)',
          }}
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-kado-red text-lg font-black text-white shadow-md shadow-kado-red/25">
              角
            </div>
            <motion.div className="min-w-0" layout>
              <div className="flex flex-wrap items-center gap-2">
                <img
                  src="/logo/Logo2.png"
                  alt="Kado Kohi"
                  className="h-6 w-auto object-contain object-left md:h-7"
                  style={{ filter: 'var(--kiosk-logo-filter)' }}
                />
                <span
                  className="hidden text-[10px] font-black uppercase tracking-[0.22em] sm:inline"
                  style={{ color: 'var(--kiosk-text-subtle)' }}
                >
                  ·
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red">Kiosk</span>
              </div>
              <h1 className="font-display truncate text-2xl font-bold uppercase leading-tight md:text-4xl">
                {activeBranchName}
              </h1>
              <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--kiosk-text-muted)' }}>
                Live order status — updated automatically
              </p>
            </motion.div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-90"
              style={{
                borderColor: 'var(--kiosk-border-strong)',
                color: 'var(--kiosk-text)',
                background: 'var(--kiosk-surface-muted)',
              }}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? 'Light' : 'Dark'}
            </button>
            <button
              type="button"
              onClick={requestFullScreen}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-kado-red px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-kado-red/20 transition-colors hover:bg-[#7d1115]"
            >
              <Monitor className="h-4 w-4" />
              Fullscreen
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const items = filtered.filter((order) => kioskColumnStatus(order.status) === column.status);
            const accent = isDark ? column.accentDark : column.accentLight;
            const badge = isDark ? column.badgeDark : column.badgeLight;

            return (
              <section
                key={column.status}
                className={`flex min-h-[420px] flex-col rounded-3xl border border-t-4 p-4 md:p-5 ${accent}`}
                style={{
                  background: 'var(--kiosk-surface)',
                  borderColor: 'var(--kiosk-border)',
                  boxShadow: 'var(--kiosk-order-shadow)',
                }}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-bold uppercase tracking-tight md:text-xl">{column.label}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${badge}`}>{items.length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                  {items.length === 0 ? (
                    <div
                      className="flex flex-1 items-center justify-center rounded-2xl border border-dashed px-4 py-10 text-center text-sm font-medium"
                      style={{
                        background: 'var(--kiosk-empty-bg)',
                        borderColor: 'var(--kiosk-border)',
                        color: 'var(--kiosk-text-subtle)',
                      }}
                    >
                      No orders in this stage
                    </div>
                  ) : (
                    items.map((order, i) => (
                      <motion.article
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.2) }}
                        className="rounded-2xl border px-4 py-3.5"
                        style={{
                          background: 'var(--kiosk-order-bg)',
                          borderColor: 'var(--kiosk-border-strong)',
                          boxShadow: 'var(--kiosk-order-shadow)',
                        }}
                      >
                        <div className="mb-2 flex items-baseline justify-between gap-2">
                          <p className="font-display text-3xl font-black tracking-wide text-kado-red md:text-4xl">
                            {order.shortCode}
                          </p>
                          <span
                            className="shrink-0 text-xs font-bold uppercase tracking-wider"
                            style={{ color: 'var(--kiosk-text-muted)' }}
                          >
                            {timeAgo(order.createdAt)}
                          </span>
                        </div>
                        <p
                          className="line-clamp-2 text-sm font-medium leading-snug"
                          style={{ color: 'var(--kiosk-text-muted)' }}
                        >
                          {order.items.map((item) => `${item.qty}× ${item.productNameSnapshot}`).join(' · ')}
                        </p>
                      </motion.article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <footer
          className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--kiosk-text-subtle)' }}
        >
          Kado Kohi · {isDark ? 'Dark display' : 'Light display'}
        </footer>
      </div>
    </motion.div>
  );
}
