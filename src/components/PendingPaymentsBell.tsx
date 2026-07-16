import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, CreditCard, QrCode, X } from 'lucide-react';
import {
  checkoutPath,
  clearPendingPayment,
  listPendingPayments,
  type PendingPaymentItem,
} from '../lib/pendingPayments';
import { formatPhp } from '../lib/money';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { awaitsGatewayPayment } from '../lib/orderStatus';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

function methodLabel(method: PendingPaymentItem['paymentMethod']): string {
  if (method === 'paymongo') return 'QR Ph';
  if (method === 'gcash-qr') return 'GCash QR';
  return 'Payment';
}

export default function PendingPaymentsBell() {
  const [open, setOpen] = useState(false);
  const [localItems, setLocalItems] = useState<PendingPaymentItem[]>(() => listPendingPayments());
  const user = useAuthStore((s) => s.user);
  const orders = useOrderStore((s) => s.orders);

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

  const accountPending = useMemo(() => {
    if (user?.role !== 'customer') return [] as PendingPaymentItem[];
    return orders
      .filter(
        (o) =>
          awaitsGatewayPayment(o) &&
          (o.paymentStatus === 'unpaid' || o.paymentStatus === 'proof_submitted'),
      )
      .map((o) => ({
        orderId: o.id,
        shortCode: o.shortCode,
        paymentMethod: o.paymentMethod ?? 'gcash-qr',
        total: o.total,
        channel: o.channel,
        placedAt: o.createdAt,
      }));
  }, [orders, user?.role]);

  const items = useMemo(() => {
    const byId = new Map<string, PendingPaymentItem>();
    for (const item of [...accountPending, ...localItems]) {
      byId.set(item.orderId, item);
    }
    return [...byId.values()].sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));
  }, [accountPending, localItems]);

  const count = items.filter((i) => i.paymentMethod === 'paymongo' || i.paymentMethod === 'gcash-qr').length;

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={count > 0 ? `Notifications — ${count} pending payments` : 'Notifications'}
        className="public-nav-icon-btn relative"
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key="notif-badge"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="absolute -top-0.5 -right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-kado-cream px-[3px] text-[9px] font-bold leading-none text-kado-dark pointer-events-none"
            >
              {count > 9 ? '9+' : count}
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
              aria-label="Pending payments"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-[380px] flex flex-col bg-white border-l border-kado-dark/10 shadow-[0_30px_60px_rgba(158,24,29,0.15)] pt-safe-nav"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-kado-dark/10 shrink-0">
                <div>
                  <p className="font-display font-bold text-lg text-kado-dark">Notifications</p>
                  <p className="text-[10px] text-kado-dark/45 uppercase tracking-wider font-bold">
                    Pending payments
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-kado-dark/8 text-kado-dark/60"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-kado-dark/15 px-4 py-10 text-center">
                    <Bell className="mx-auto h-8 w-8 text-kado-dark/20 mb-3" />
                    <p className="text-sm font-bold text-kado-dark">You&apos;re all caught up</p>
                    <p className="mt-1 text-xs text-kado-dark/50 leading-relaxed">
                      When an order needs QR Ph or GCash payment, it shows up here with a link to checkout.
                    </p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.orderId}
                      className="rounded-2xl border border-kado-dark/10 bg-kado-offwhite p-4 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-kado-red/10 text-kado-red">
                          {item.paymentMethod === 'paymongo' ? (
                            <CreditCard className="h-4 w-4" />
                          ) : (
                            <QrCode className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-kado-dark">
                            Pay {formatPhp(item.total)} · {methodLabel(item.paymentMethod)}
                          </p>
                          <p className="text-[11px] text-kado-dark/50 font-mono mt-0.5">
                            {item.shortCode}
                          </p>
                          <p className="text-[11px] text-kado-dark/45 mt-1 leading-snug">
                            {item.paymentMethod === 'paymongo'
                              ? 'Open checkout to finish QR Ph payment.'
                              : 'Open checkout to view GCash QR and upload proof.'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={checkoutPath(item.orderId)}
                          onClick={() => setOpen(false)}
                          className="flex-1 min-h-[44px] inline-flex items-center justify-center rounded-xl bg-kado-red text-kado-cream text-[10px] font-black uppercase tracking-wider"
                        >
                          Open checkout
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            clearPendingPayment(item.orderId);
                            setLocalItems(listPendingPayments());
                          }}
                          className="min-h-[44px] px-3 rounded-xl border border-kado-dark/10 text-[10px] font-bold uppercase tracking-wider text-kado-dark/50 hover:text-kado-dark"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {user?.role === 'customer' && (
                <div className="shrink-0 border-t border-kado-dark/10 px-4 py-3 pb-safe">
                  <Link
                    to="/account/orders"
                    onClick={() => setOpen(false)}
                    className="block text-center text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline"
                  >
                    View all orders
                  </Link>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
