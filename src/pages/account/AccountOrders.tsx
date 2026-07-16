import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatPhp } from '../../lib/money';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_BADGE,
  isGcashOrder,
} from '../../lib/orderStatus';
import GcashQrModal from '../../components/GcashQrModal';
import OrderPaymentPanel from '../../components/OrderPaymentPanel';
import PaymongoPaymentPanel from '../../components/PaymongoPaymentPanel';
import OrderTableBadge from '../../components/OrderTableBadge';
import { countDrinkStampsForOrder } from '../../lib/loyaltyStamps';
import {
  Search,
  Filter,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Coffee,
  ChevronDown,
  ChevronUp,
  MapPin,
  Wallet,
} from 'lucide-react';
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: ORDER_STATUS_LABELS.pending, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  accepted: { label: ORDER_STATUS_LABELS.accepted, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle2 },
  preparing: { label: ORDER_STATUS_LABELS.preparing, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: Coffee },
  ready: { label: ORDER_STATUS_LABELS.ready, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  served: { label: ORDER_STATUS_LABELS.served, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', icon: CheckCircle2 },
  completed: { label: ORDER_STATUS_LABELS.completed, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: ORDER_STATUS_LABELS.cancelled, color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

const FILTER_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Merch', value: 'merch' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function AccountOrders() {
  const user = useAuthStore((s) => s.user);
  const orders = useOrderStore((s) => s.orders);
  const updateOrderPaymentProof = useOrderStore((s) => s.updateOrderPaymentProof);
  const branches = useBranchStore((s) => s.branches);
  const gcashQrImage = useSettingsStore((s) => s.settings.gcashQrImage);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [qrModalOrderId, setQrModalOrderId] = useState<string | null>(null);

  const placedId = searchParams.get('placed');
  const paymongoStatus = searchParams.get('paymongo');
  const paymongoOrderId = searchParams.get('order');

  useEffect(() => {
    if (placedId) {
      setQrModalOrderId(placedId);
      setExpandedId(placedId);
      const next = new URLSearchParams(searchParams);
      next.delete('placed');
      setSearchParams(next, { replace: true });
    }
  }, [placedId, searchParams, setSearchParams]);

  useEffect(() => {
    if (!paymongoStatus) return;
    if (paymongoOrderId) setExpandedId(paymongoOrderId);
  }, [paymongoStatus, paymongoOrderId]);

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? '';
  }, [branches]);

  const myOrders = useMemo(() => orders.filter((o) => o.customerId === user?.id), [orders, user?.id]);

  const qrModalOrder = useMemo(() => {
    if (!qrModalOrderId) return null;
    return myOrders.find((o) => o.id === qrModalOrderId) ?? orders.find((o) => o.id === qrModalOrderId) ?? null;
  }, [myOrders, orders, qrModalOrderId]);

  const filteredOrders = useMemo(() => {
    let list = myOrders;
    if (filter === 'active') list = list.filter((o) => !['completed', 'cancelled'].includes(o.status));
    else if (filter === 'merch') list = list.filter((o) => o.channel === 'merch');
    else if (filter === 'completed') list = list.filter((o) => o.status === 'completed');
    else if (filter === 'cancelled') list = list.filter((o) => o.status === 'cancelled');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.shortCode.toLowerCase().includes(q) ||
          o.items.some((i) => i.productNameSnapshot.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [myOrders, filter, search]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red mb-2">Order History</p>
        <h1 className="font-display text-3xl md:text-4xl font-black text-kado-dark tracking-tight">My Orders</h1>
        <p className="text-sm text-kado-dark/50 mt-1 font-medium">
          Pay with QR Ph or GCash, then track preparation status.
        </p>
      </div>

      {paymongoStatus === 'success' ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Payment submitted. If the status still says unpaid, wait a few seconds — PayMongo is confirming.
        </div>
      ) : null}
      {paymongoStatus === 'cancel' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Checkout was cancelled. Open the order below and tap <strong>Pay with QR Ph</strong> to try again.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5 sm:mx-0 sm:px-0 sm:pb-0">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`min-h-[40px] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200 touch-manipulation ${
                filter === tab.value
                  ? 'bg-kado-dark text-white shadow-lg shadow-kado-dark/10'
                  : 'bg-white border border-kado-dark/10 text-kado-dark/50 hover:border-kado-red/30 hover:text-kado-red'
              }`}
            >
              <Filter className="w-3 h-3 inline mr-1.5 -mt-px" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kado-dark/30" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-kado-dark/10 bg-white text-sm font-medium text-kado-dark placeholder:text-kado-dark/30 focus:outline-none focus:border-kado-red/40 focus:ring-2 focus:ring-kado-red/10 transition-all"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-kado-dark/10 bg-kado-offwhite p-12 md:p-16 text-center">
          <ShoppingBag className="w-10 h-10 text-kado-dark/15 mx-auto mb-4" />
          <p className="text-sm font-bold text-kado-dark/50 mb-1">
            {myOrders.length === 0 ? "You haven't placed any orders yet." : 'No matching orders found.'}
          </p>
          <p className="text-xs text-kado-dark/35">
            {myOrders.length === 0 ? 'Head to the menu to place your first order.' : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredOrders.map((o, i) => {
            const cfg = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === o.id;
            const pendingStamps = countDrinkStampsForOrder(o);

            return (
              <motion.li
                key={o.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-kado-dark/8 bg-white overflow-hidden hover:shadow-[0_8px_24px_rgba(158,24,29,0.05)] hover:border-kado-red/15 transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : o.id)}
                  className="w-full p-4 sm:p-5 text-left touch-manipulation"
                >
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-kado-offwhite flex items-center justify-center shrink-0">
                      <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                        <span className="font-display font-black text-kado-dark text-base sm:text-lg">{o.shortCode}</span>
                        {isGcashOrder(o) && o.paymentStatus !== 'paid' && (
                          <span
                            className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${PAYMENT_STATUS_BADGE[o.paymentStatus]}`}
                          >
                            {PAYMENT_STATUS_LABELS[o.paymentStatus]}
                          </span>
                        )}
                        <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-kado-offwhite text-kado-dark/40 border border-kado-dark/5">
                          {o.channel}
                        </span>
                        <OrderTableBadge order={o} />
                        {o.status === 'completed' &&
                          o.loyaltyStampsAwarded !== undefined &&
                          o.loyaltyStampsAwarded > 0 && (
                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-kado-red/10 text-kado-red border border-kado-red/20">
                              +{o.loyaltyStampsAwarded} stamp{o.loyaltyStampsAwarded !== 1 ? 's' : ''}
                            </span>
                          )}
                        {o.status !== 'completed' &&
                          o.status !== 'cancelled' &&
                          pendingStamps > 0 && (
                            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-kado-offwhite text-kado-dark/45 border border-kado-dark/8">
                              {pendingStamps} stamp{pendingStamps !== 1 ? 's' : ''} when done
                            </span>
                          )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-kado-dark/40 font-medium flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 sm:flex-wrap">
                        <span>
                          {new Date(o.createdAt).toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {branchName(o.branchId) && (
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{branchName(o.branchId)}</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 pl-[52px] sm:pl-[60px]">
                    <span className="font-display font-black text-kado-red text-xl sm:text-lg">{formatPhp(o.total)}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-kado-dark/30 shrink-0" aria-hidden />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-kado-dark/30 shrink-0" aria-hidden />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-kado-dark/5">
                        <OrderPaymentPanel
                          order={o}
                          onViewQr={() => setQrModalOrderId(o.id)}
                          onUploadProof={async (dataUrl) => {
                            const err = await updateOrderPaymentProof(o.id, dataUrl);
                            if (err) throw new Error(err);
                          }}
                        />
                        <PaymongoPaymentPanel order={o} />

                        <div className="mt-4 -mx-1 overflow-x-auto">
                        <table className="w-full min-w-[280px] text-xs">
                          <thead>
                            <tr className="text-[9px] font-black uppercase tracking-widest text-kado-dark/35">
                              <th className="text-left pb-2">Item</th>
                              <th className="text-center pb-2">Qty</th>
                              <th className="text-right pb-2">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-kado-dark/5">
                            {o.items.map((item) => (
                              <tr key={item.id}>
                                <td className="py-2.5 font-bold text-kado-dark">
                                  {item.productNameSnapshot}
                                  {item.sizeLabelSnapshot && (
                                    <span className="ml-1 text-kado-dark/40 font-medium">({item.sizeLabelSnapshot})</span>
                                  )}
                                  {item.milkLabelSnapshot && (
                                    <span className="ml-1 text-kado-dark/40 font-medium">• {item.milkLabelSnapshot}</span>
                                  )}
                                  {item.temperature && (
                                    <span className="ml-1 text-kado-dark/40 font-medium">• {item.temperature}</span>
                                  )}
                                </td>
                                <td className="py-2.5 text-center text-kado-dark/60">{item.qty}</td>
                                <td className="py-2.5 text-right font-bold text-kado-dark">{formatPhp(item.lineTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-kado-dark/10">
                              <td colSpan={2} className="pt-3 text-right font-black text-kado-dark text-[10px] uppercase tracking-widest">
                                Total
                              </td>
                              <td className="pt-3 text-right font-black text-kado-red text-sm">{formatPhp(o.total)}</td>
                            </tr>
                          </tfoot>
                        </table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      )}

      <GcashQrModal
        open={qrModalOrderId !== null}
        onClose={() => setQrModalOrderId(null)}
        shortCode={qrModalOrder?.shortCode ?? '—'}
        total={qrModalOrder?.total ?? 0}
        qrImageUrl={gcashQrImage}
        actionLabel="Close"
      />
    </div>
  );
}
