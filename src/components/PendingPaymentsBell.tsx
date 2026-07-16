import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  CreditCard,
  Gift,
  Info,
  Megaphone,
  Package,
  QrCode,
  X,
} from 'lucide-react';
import {
  checkoutPath,
  clearPendingPayment,
  listPendingPayments,
  type PendingPaymentItem,
} from '../lib/pendingPayments';
import { formatPhp } from '../lib/money';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { orderNeedsCustomerPayment } from '../lib/orderStatus';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import {
  notificationsRepo,
  type CustomerNotification,
  type CustomerNotificationKind,
} from '../lib/supabase/repositories/notifications';

type FeedItem = {
  id: string;
  kind: CustomerNotificationKind | 'payment_due';
  title: string;
  body: string;
  url: string;
  createdAt: string;
  unread: boolean;
  dismissPaymentId?: string;
};

function kindMeta(kind: FeedItem['kind']): { label: string; Icon: typeof Bell; tone: string } {
  switch (kind) {
    case 'payment':
    case 'payment_due':
      return { label: 'Payment', Icon: CreditCard, tone: 'bg-kado-red/10 text-kado-red' };
    case 'order':
      return { label: 'Order', Icon: Package, tone: 'bg-amber-50 text-amber-800' };
    case 'marketing':
      return { label: 'News', Icon: Megaphone, tone: 'bg-violet-50 text-violet-800' };
    default:
      return { label: 'Update', Icon: Info, tone: 'bg-kado-dark/6 text-kado-dark/70' };
  }
}

function methodLabel(method: PendingPaymentItem['paymentMethod']): string {
  if (method === 'paymongo') return 'QR Ph';
  if (method === 'gcash-qr') return 'GCash QR';
  return 'Payment';
}

export default function PendingPaymentsBell() {
  const [open, setOpen] = useState(false);
  const [localItems, setLocalItems] = useState<PendingPaymentItem[]>(() => listPendingPayments());
  const [inbox, setInbox] = useState<CustomerNotification[]>([]);
  const user = useAuthStore((s) => s.user);
  const orders = useOrderStore((s) => s.orders);

  const refreshInbox = useCallback(async () => {
    if (user?.role !== 'customer' || !user.id) {
      setInbox([]);
      return;
    }
    try {
      const rows = await notificationsRepo.listForCustomer(user.id);
      setInbox(rows);
    } catch {
      // Table may not exist yet on older deploys — keep payments feed.
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    const sync = () => setLocalItems(listPendingPayments());
    sync();
    window.addEventListener('kado:pending-payments', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('kado:pending-payments', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    void refreshInbox();
  }, [refreshInbox]);

  useEffect(() => {
    if (open) void refreshInbox();
  }, [open, refreshInbox]);

  const accountPending = useMemo(() => {
    if (user?.role !== 'customer') return [] as PendingPaymentItem[];
    return orders
      .filter((o) => o.status !== 'cancelled' && orderNeedsCustomerPayment(o))
      .map((o) => ({
        orderId: o.id,
        shortCode: o.shortCode,
        paymentMethod: o.paymentMethod ?? 'gcash-qr',
        total: o.total,
        channel: o.channel,
        placedAt: o.createdAt,
      }));
  }, [orders, user?.role]);

  const paymentItems = useMemo(() => {
    const byId = new Map<string, PendingPaymentItem>();
    for (const item of [...accountPending, ...localItems]) {
      byId.set(item.orderId, item);
    }
    return [...byId.values()].sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));
  }, [accountPending, localItems]);

  const feed = useMemo((): FeedItem[] => {
    const paymentFeed: FeedItem[] = paymentItems.map((item) => ({
      id: `pay-${item.orderId}`,
      kind: 'payment_due',
      title: `Pay ${formatPhp(item.total)} · ${methodLabel(item.paymentMethod)}`,
      body:
        item.paymentMethod === 'paymongo'
          ? `Order ${item.shortCode} — finish QR Ph checkout.`
          : `Order ${item.shortCode} — view GCash QR and upload proof.`,
      url: checkoutPath(item.orderId),
      createdAt: item.placedAt,
      unread: true,
      dismissPaymentId: item.orderId,
    }));

    const inboxFeed: FeedItem[] = inbox.map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      url: n.url || '/account',
      createdAt: n.createdAt,
      unread: !n.readAt,
    }));

    return [...paymentFeed, ...inboxFeed].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }, [paymentItems, inbox]);

  const unreadCount = feed.filter((i) => i.unread).length;

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const onOpenItem = async (item: FeedItem) => {
    if (item.kind !== 'payment_due' && item.unread) {
      try {
        await notificationsRepo.markRead(item.id);
        setInbox((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)),
        );
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : 'Notifications'}
        className="public-nav-icon-btn relative"
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="absolute -top-0.5 -right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-kado-cream px-[3px] text-[9px] font-bold leading-none text-kado-dark pointer-events-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close notifications"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-kado-dark/45"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Notifications"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-[201] flex w-full max-w-[min(100vw,400px)] flex-col border-l border-kado-dark/10 bg-white pt-safe-nav shadow-[0_30px_60px_rgba(158,24,29,0.15)]"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-kado-dark/10 px-4 py-3 sm:px-5 sm:py-4">
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold text-kado-dark">Notifications</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-kado-dark/45">
                    Orders · payments · news
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {user?.role === 'customer' && inbox.some((n) => !n.readAt) ? (
                    <button
                      type="button"
                      onClick={() => {
                        void notificationsRepo.markAllRead(user.id).then(() => refreshInbox());
                      }}
                      className="min-h-[44px] rounded-full px-3 text-[10px] font-bold uppercase tracking-wider text-kado-red touch-manipulation"
                    >
                      Mark read
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-kado-dark/60 hover:bg-kado-dark/8 touch-manipulation"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
                {feed.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-kado-dark/15 px-4 py-10 text-center">
                    <Bell className="mx-auto mb-3 h-8 w-8 text-kado-dark/20" />
                    <p className="text-sm font-bold text-kado-dark">You&apos;re all caught up</p>
                    <p className="mt-1 text-xs leading-relaxed text-kado-dark/50">
                      Order updates, payment reminders, and Kado news show up here. Enable push in Profile so you never
                      miss a brew.
                    </p>
                    {user?.role === 'customer' ? (
                      <Link
                        to="/account/profile"
                        onClick={() => setOpen(false)}
                        className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-kado-red px-5 text-[10px] font-black uppercase tracking-wider text-kado-cream"
                      >
                        Notification settings
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  feed.map((item) => {
                    const { label, Icon, tone } = kindMeta(item.kind);
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-3.5 sm:p-4 ${
                          item.unread
                            ? 'border-kado-red/15 bg-kado-cream/40'
                            : 'border-kado-dark/8 bg-kado-offwhite'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}>
                            {item.kind === 'payment_due' && item.body.includes('GCash') ? (
                              <QrCode className="h-4 w-4" />
                            ) : item.kind === 'marketing' ? (
                              <Gift className="h-4 w-4" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase tracking-wider text-kado-dark/40">
                                {label}
                              </span>
                              {item.unread ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-kado-red" aria-label="Unread" />
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-sm font-bold leading-snug text-kado-dark">{item.title}</p>
                            <p className="mt-1 text-[11px] leading-snug text-kado-dark/55">{item.body}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Link
                                to={item.url}
                                onClick={() => void onOpenItem(item)}
                                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-kado-red px-3 text-[10px] font-black uppercase tracking-wider text-kado-cream touch-manipulation sm:flex-none sm:px-4"
                              >
                                Open
                              </Link>
                              {item.dismissPaymentId ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    clearPendingPayment(item.dismissPaymentId!);
                                    setLocalItems(listPendingPayments());
                                  }}
                                  className="min-h-[44px] rounded-xl border border-kado-dark/10 px-3 text-[10px] font-bold uppercase tracking-wider text-kado-dark/50 touch-manipulation"
                                >
                                  Dismiss
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {user?.role === 'customer' ? (
                <div className="shrink-0 border-t border-kado-dark/10 px-4 py-3 pb-safe">
                  <div className="flex gap-3 justify-center text-[10px] font-bold uppercase tracking-wider">
                    <Link
                      to="/account/orders"
                      onClick={() => setOpen(false)}
                      className="text-kado-red hover:underline"
                    >
                      Orders
                    </Link>
                    <span className="text-kado-dark/20">·</span>
                    <Link
                      to="/account/profile"
                      onClick={() => setOpen(false)}
                      className="text-kado-dark/50 hover:text-kado-red"
                    >
                      Push settings
                    </Link>
                  </div>
                </div>
              ) : null}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
