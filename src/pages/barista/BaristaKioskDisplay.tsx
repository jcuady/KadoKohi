import { useMemo, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChefHat, Monitor, Moon, Package, Sun } from 'lucide-react';
import AdminKioskBranchModal from '../../components/admin/AdminKioskBranchModal';
import type { Order } from '../../types/domain';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { useTableStore } from '../../store/tableStore';
import { useKioskTheme } from '../../hooks/useKioskTheme';
import { hydrateOpsPortal } from '../../lib/bootstrapHydration';
import { kioskDisplayColumnKey, type KioskDisplayColumn } from '../../lib/orderStatus';
import { getKioskOrderTags, type KioskOrderTag } from '../../lib/orderTable';

const SYNC_POLL_MS = 45_000;

type KioskColumn = {
  id: KioskDisplayColumn;
  label: string;
  hint: string;
  empty: string;
  icon: typeof ChefHat;
  accentLight: string;
  accentDark: string;
  badgeLight: string;
  badgeDark: string;
  cardAccentLight: string;
  cardAccentDark: string;
};

const COLUMNS: KioskColumn[] = [
  {
    id: 'preparing',
    label: 'Preparing',
    hint: 'Being made now',
    empty: 'Nothing in the kitchen right now',
    icon: ChefHat,
    accentLight: 'border-t-kado-red',
    accentDark: 'border-t-kado-red',
    badgeLight: 'bg-kado-red/12 text-kado-red',
    badgeDark: 'bg-kado-red/25 text-kado-cream',
    cardAccentLight: 'border-l-kado-red',
    cardAccentDark: 'border-l-kado-red',
  },
  {
    id: 'pickup',
    label: 'Pickup',
    hint: 'Ready to collect',
    empty: 'No orders waiting — check back soon',
    icon: Package,
    accentLight: 'border-t-emerald-600',
    accentDark: 'border-t-emerald-400',
    badgeLight: 'bg-emerald-600/10 text-emerald-900',
    badgeDark: 'bg-emerald-400/15 text-emerald-200',
    cardAccentLight: 'border-l-emerald-500',
    cardAccentDark: 'border-l-emerald-400',
  },
];

const TAG_CHIP: Record<KioskOrderTag['kind'], { light: string; dark: string }> = {
  table: {
    light: 'border-violet-300 bg-violet-100 text-violet-900',
    dark: 'border-violet-400/35 bg-violet-500/20 text-violet-200',
  },
  online: {
    light: 'border-sky-300 bg-sky-100 text-sky-900',
    dark: 'border-sky-400/35 bg-sky-500/20 text-sky-200',
  },
  takeout: {
    light: 'border-amber-300 bg-amber-100 text-amber-900',
    dark: 'border-amber-400/35 bg-amber-500/20 text-amber-200',
  },
};

function KioskOrderTags({ tags, isDark }: { tags: KioskOrderTag[]; isDark: boolean }) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span
          key={tag.kind}
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-widest ${
            isDark ? TAG_CHIP[tag.kind].dark : TAG_CHIP[tag.kind].light
          }`}
        >
          {tag.label}
        </span>
      ))}
    </div>
  );
}

function KioskOrderCard({
  order,
  columnId,
  isDark,
  tags,
}: {
  order: Order;
  columnId: KioskDisplayColumn;
  isDark: boolean;
  tags: KioskOrderTag[];
}) {
  const isPickup = columnId === 'pickup';
  const cardAccent = isDark
    ? COLUMNS.find((c) => c.id === columnId)!.cardAccentDark
    : COLUMNS.find((c) => c.id === columnId)!.cardAccentLight;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border border-l-4 px-5 py-4 ${cardAccent}`}
      style={{
        background: 'var(--kiosk-order-bg)',
        borderColor: 'var(--kiosk-border-strong)',
        boxShadow: isPickup ? 'var(--kiosk-pickup-shadow)' : 'var(--kiosk-order-shadow)',
      }}
    >
      <p
        className={`font-display font-black tracking-tight text-kado-red ${
          isPickup ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'
        }`}
      >
        {order.shortCode}
      </p>
      {tags.length > 0 ? (
        <div className="mt-3">
          <KioskOrderTags tags={tags} isDark={isDark} />
        </div>
      ) : null}
    </motion.article>
  );
}

export default function BaristaKioskDisplay() {
  const { isDark, toggle } = useKioskTheme();
  const user = useAuthStore((s) => s.user);
  const orders = useOrderStore((s) => s.orders);
  const hydrateForBarista = useOrderStore((s) => s.hydrateForBarista);
  const tables = useTableStore((s) => s.tables);
  const adminPosBranchId = useBranchStore((s) => s.adminPosBranchId);
  const setAdminPosBranchId = useBranchStore((s) => s.setAdminPosBranchId);
  const branches = useBranchStore((s) => s.branches);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);
  const [searchParams, setSearchParams] = useSearchParams();
  const [branchPickerOpen, setBranchPickerOpen] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [live, setLive] = useState(false);

  const isAdmin = user?.role === 'admin';
  const branchParam = searchParams.get('branch');

  useEffect(() => {
    void hydrateBranches();
  }, [hydrateBranches]);

  useEffect(() => {
    if (!isAdmin || !branchParam) return;
    if (branches.some((b) => b.id === branchParam)) {
      setAdminPosBranchId(branchParam);
    }
  }, [isAdmin, branchParam, branches, setAdminPosBranchId]);

  const activeBranchId = useMemo(() => {
    if (user?.role === 'barista') return user.branchId ?? null;
    if (!isAdmin) return null;
    if (branchParam) {
      return branches.some((b) => b.id === branchParam) ? branchParam : null;
    }
    if (adminPosBranchId && branches.some((b) => b.id === adminPosBranchId)) {
      return adminPosBranchId;
    }
    return null;
  }, [user?.role, user?.branchId, isAdmin, branchParam, adminPosBranchId, branches]);

  const needsBranchPick = isAdmin && !activeBranchId;

  useEffect(() => {
    if (needsBranchPick) setBranchPickerOpen(true);
  }, [needsBranchPick]);

  const syncData = useCallback(async () => {
    if (activeBranchId) {
      await hydrateForBarista(activeBranchId);
    }
    setDataReady(true);
    setLive(true);
  }, [activeBranchId, hydrateForBarista]);

  useEffect(() => {
    if (!user || (user.role !== 'barista' && user.role !== 'admin')) return;
    if (!activeBranchId) return;

    void hydrateOpsPortal();

    void syncData();

    const poll = window.setInterval(() => void syncData(), SYNC_POLL_MS);
    return () => window.clearInterval(poll);
  }, [user?.id, user?.role, activeBranchId, syncData]);

  const activeBranch = branches.find((branch) => branch.id === activeBranchId);
  const activeBranchName = activeBranch?.name ?? 'Kado Kohi';

  const confirmBranch = (branchId: string) => {
    setAdminPosBranchId(branchId);
    setSearchParams({ branch: branchId }, { replace: true });
    setBranchPickerOpen(false);
    setDataReady(false);
  };

  const ordersByColumn = useMemo(() => {
    const branchOrders = orders
      .filter((order) => (activeBranchId ? order.branchId === activeBranchId : false))
      .filter((order) => kioskDisplayColumnKey(order) !== null)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

    return {
      preparing: branchOrders.filter((o) => kioskDisplayColumnKey(o) === 'preparing'),
      pickup: branchOrders.filter((o) => kioskDisplayColumnKey(o) === 'pickup'),
    };
  }, [orders, activeBranchId]);

  const totalActive = ordersByColumn.preparing.length + ordersByColumn.pickup.length;

  if (needsBranchPick) {
    return (
      <AdminKioskBranchModal
        open={branchPickerOpen}
        onClose={() => setBranchPickerOpen(false)}
        onConfirm={confirmBranch}
      />
    );
  }

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
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className={`absolute -right-24 top-0 h-72 w-72 rounded-full blur-3xl ${isDark ? 'bg-kado-red/15' : 'bg-kado-red/8'}`}
        />
        <div
          className={`absolute -left-16 bottom-0 h-64 w-64 rounded-full blur-3xl ${isDark ? 'bg-kado-cream/5' : 'bg-kado-cream/35'}`}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col p-4 md:p-6 lg:p-8">
        <header
          className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-4 md:px-6"
          style={{
            background: 'var(--kiosk-surface)',
            borderColor: 'var(--kiosk-border)',
            boxShadow: 'var(--kiosk-order-shadow)',
          }}
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-kado-red text-base font-black text-white shadow-md shadow-kado-red/25">
              角
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <img
                  src="/logo/Logo2.png"
                  alt="Kado Kohi"
                  className="h-6 w-auto object-contain object-left"
                  style={{ filter: 'var(--kiosk-logo-filter)' }}
                />
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red">Order status</span>
                {live ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Live
                  </span>
                ) : null}
              </div>
              <h1 className="font-display truncate text-xl font-bold uppercase leading-tight md:text-3xl">
                {activeBranchName}
              </h1>
              <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--kiosk-text-muted)' }}>
                {activeBranch?.city ? `${activeBranch.city} · ` : ''}
                {totalActive} active order{totalActive === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors hover:opacity-90"
              style={{
                borderColor: 'var(--kiosk-border-strong)',
                color: 'var(--kiosk-text)',
                background: 'var(--kiosk-surface-muted)',
              }}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setBranchPickerOpen(true)}
                className="inline-flex min-h-[44px] items-center rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors hover:opacity-90"
                style={{
                  borderColor: 'var(--kiosk-border-strong)',
                  color: 'var(--kiosk-text)',
                  background: 'var(--kiosk-surface-muted)',
                }}
              >
                Branch
              </button>
            ) : null}
            <button
              type="button"
              onClick={requestFullScreen}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-kado-red px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-kado-red/20 transition-colors hover:bg-kado-red-hover"
            >
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
          </div>
        </header>

        {!dataReady ? (
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="min-h-[min(72vh,720px)] animate-pulse rounded-3xl border"
                style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            {COLUMNS.map((column) => {
              const items = ordersByColumn[column.id];
              const accent = isDark ? column.accentDark : column.accentLight;
              const badge = isDark ? column.badgeDark : column.badgeLight;
              const Icon = column.icon;

              return (
                <section
                  key={column.id}
                  className={`flex min-h-[min(72vh,720px)] flex-col rounded-3xl border border-t-4 p-4 md:p-5 ${accent}`}
                  style={{
                    background: 'var(--kiosk-surface)',
                    borderColor: 'var(--kiosk-border)',
                    boxShadow: 'var(--kiosk-order-shadow)',
                  }}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${column.id === 'pickup' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-kado-red/12 text-kado-red'}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="font-display text-xl font-bold uppercase tracking-tight md:text-2xl">
                          {column.label}
                        </h2>
                        <p className="text-xs font-medium" style={{ color: 'var(--kiosk-text-muted)' }}>
                          {column.hint}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-black ${badge}`}>{items.length}</span>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                    {items.length === 0 ? (
                      <div
                        className="flex flex-1 items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center"
                        style={{
                          background: 'var(--kiosk-empty-bg)',
                          borderColor: 'var(--kiosk-border)',
                          color: 'var(--kiosk-text-subtle)',
                        }}
                      >
                        <p className="max-w-[16rem] text-sm font-semibold leading-relaxed">{column.empty}</p>
                      </div>
                    ) : (
                      items.map((order) => (
                        <div key={order.id}>
                          <KioskOrderCard
                            order={order}
                            columnId={column.id}
                            isDark={isDark}
                            tags={getKioskOrderTags(order, tables)}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <footer
          className="mt-5 text-center text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--kiosk-text-subtle)' }}
        >
          Kado Kohi
        </footer>
      </div>

      {isAdmin ? (
        <AdminKioskBranchModal
          open={branchPickerOpen && !needsBranchPick}
          onClose={() => setBranchPickerOpen(false)}
          onConfirm={confirmBranch}
          title="Switch kiosk branch"
        />
      ) : null}
    </motion.div>
  );
}
