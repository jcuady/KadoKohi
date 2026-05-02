import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { formatPhp } from '../../lib/money';
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
} from 'lucide-react';
import type { OrderStatus } from '../../types/domain';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:    { label: 'Pending',    color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: Clock },
  accepted:   { label: 'Accepted',   color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: CheckCircle2 },
  preparing:  { label: 'Preparing',  color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200',   icon: Coffee },
  ready:      { label: 'Ready',      color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  served:     { label: 'Served',     color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200',       icon: CheckCircle2 },
  completed:  { label: 'Completed',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',     bg: 'bg-red-50 border-red-200',         icon: XCircle },
};

const FILTER_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function AccountOrders() {
  const user = useAuthStore((s) => s.user);
  const orders = useOrderStore((s) => s.orders);
  const branches = useBranchStore((s) => s.branches);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? '';
  }, [branches]);

  const myOrders = useMemo(() => orders.filter((o) => o.customerId === user?.id), [orders, user?.id]);

  const filteredOrders = useMemo(() => {
    let list = myOrders;
    if (filter === 'active') list = list.filter((o) => !['completed', 'cancelled'].includes(o.status));
    else if (filter === 'completed') list = list.filter((o) => o.status === 'completed');
    else if (filter === 'cancelled') list = list.filter((o) => o.status === 'cancelled');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        o.shortCode.toLowerCase().includes(q) ||
        o.items.some((i) => i.productNameSnapshot.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [myOrders, filter, search]);

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red mb-2">Order History</p>
        <h1 className="font-display text-3xl md:text-4xl font-black text-kado-dark tracking-tight">
          My Orders
        </h1>
        <p className="text-sm text-kado-dark/50 mt-1 font-medium">Full history of all your orders.</p>
      </div>

      {/* ─── FILTERS + SEARCH ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200 ${
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

      {/* ─── ORDER LIST ─── */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-kado-dark/10 bg-[#FAF7F2] p-12 md:p-16 text-center">
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
                  className="w-full p-5 flex items-center gap-4 text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] flex items-center justify-center shrink-0">
                    <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-display font-black text-kado-dark">{o.shortCode}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FAF7F2] text-kado-dark/40 border border-kado-dark/5">
                        {o.channel}
                      </span>
                    </div>
                    <p className="text-xs text-kado-dark/40 font-medium flex items-center gap-1.5 flex-wrap">
                      <span>{new Date(o.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {branchName(o.branchId) && (
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {branchName(o.branchId)}
                        </span>
                      )}
                    </p>
                  </div>

                  <span className="font-display font-black text-kado-red text-lg shrink-0">{formatPhp(o.total)}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-kado-dark/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-kado-dark/30 shrink-0" />}
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
                      <div className="px-5 pb-5 pt-0 border-t border-kado-dark/5">
                        <table className="w-full mt-4 text-xs">
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
                                  {item.sizeLabelSnapshot && <span className="ml-1 text-kado-dark/40 font-medium">({item.sizeLabelSnapshot})</span>}
                                  {item.milkLabelSnapshot && <span className="ml-1 text-kado-dark/40 font-medium">• {item.milkLabelSnapshot}</span>}
                                  {item.temperature && <span className="ml-1 text-kado-dark/40 font-medium">• {item.temperature}</span>}
                                </td>
                                <td className="py-2.5 text-center text-kado-dark/60">{item.qty}</td>
                                <td className="py-2.5 text-right font-bold text-kado-dark">{formatPhp(item.lineTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-kado-dark/10">
                              <td colSpan={2} className="pt-3 text-right font-black text-kado-dark text-[10px] uppercase tracking-widest">Total</td>
                              <td className="pt-3 text-right font-black text-kado-red text-sm">{formatPhp(o.total)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
