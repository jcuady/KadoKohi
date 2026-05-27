import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { formatPhp } from '../../lib/money';
import {
  Coffee,
  Star,
  ArrowRight,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Gift,
  TrendingUp,
  MapPin,
  CalendarHeart,
} from 'lucide-react';
import { useBoothBookingStore } from '../../store/boothBookingStore';

export default function AccountDashboard() {
  const user = useAuthStore((s) => s.user);
  const orders = useOrderStore((s) => s.orders);
  const branches = useBranchStore((s) => s.branches);

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? '';
  }, [branches]);

  const myOrders = useMemo(() => orders.filter((o) => o.customerId === user?.id), [orders, user?.id]);
  const activeOrders = useMemo(() => myOrders.filter((o) => !['completed', 'cancelled'].includes(o.status)), [myOrders]);
  const completedCount = useMemo(() => myOrders.filter((o) => o.status === 'completed').length, [myOrders]);
  const totalSpent = useMemo(() => myOrders.filter((o) => o.status === 'completed').reduce((s, o) => s + o.total, 0), [myOrders]);
  const stamps = user?.loyaltyStamps ?? 0;
  const boothBookings = useBoothBookingStore((s) => s.bookingsForCustomer);
  const myBoothCount = useMemo(
    () => (user?.id ? boothBookings(user.id).length : 0),
    [boothBookings, user?.id],
  );

  const statCards = [
    { icon: ShoppingBag, label: 'Total Orders', value: myOrders.length.toString(), color: 'text-kado-dark' },
    { icon: CheckCircle2, label: 'Completed', value: completedCount.toString(), color: 'text-emerald-600' },
    { icon: TrendingUp, label: 'Total Spent', value: formatPhp(totalSpent), color: 'text-kado-red' },
    { icon: Clock, label: 'Active Now', value: activeOrders.length.toString(), color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-8">
      {/* ─── WELCOME HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red mb-2">Dashboard</p>
          <h1 className="font-display text-3xl md:text-4xl font-black text-kado-dark tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-kado-dark/50 mt-1 font-medium">Your Kado Kohi account overview.</p>
        </div>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 bg-kado-dark text-white px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-kado-red transition-colors shadow-lg self-start sm:self-auto"
        >
          <Coffee className="w-4 h-4" /> Order Now <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ─── STAT CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="bg-white border border-kado-dark/8 rounded-2xl p-5 md:p-6 hover:shadow-[0_12px_32px_rgba(158,24,29,0.06)] hover:border-kado-red/15 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] flex items-center justify-center group-hover:bg-kado-red/10 transition-colors">
                <card.icon className={`w-4 h-4 ${card.color} group-hover:text-kado-red transition-colors`} />
              </div>
            </div>
            <p className="font-display text-2xl md:text-3xl font-black text-kado-dark tracking-tight">{card.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-kado-dark/40 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── LOYALTY CARD ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="rounded-2xl bg-kado-dark p-6 md:p-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-kado-red/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Star className="w-5 h-5 text-kado-red fill-kado-red" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red">Kado Circle — Loyalty</span>
            </div>
            {stamps >= 10 && (
              <span className="flex items-center gap-1.5 bg-kado-red text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Gift className="w-3 h-3" /> Free Cup!
              </span>
            )}
          </div>

          <p className="font-display text-3xl md:text-4xl font-black mb-1 tracking-tight">
            {stamps} <span className="text-white/40">/</span> 10
          </p>
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-5">
            Drink stamps · 1 per completed drink
          </p>

          {/* Stamp grid */}
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  i < stamps
                    ? 'bg-kado-red/20 border-2 border-kado-red text-kado-red shadow-[0_0_12px_rgba(155,43,44,0.2)]'
                    : 'bg-white/5 border border-white/10 text-white/15'
                }`}
              >
                <Coffee className="w-4 h-4" />
              </div>
            ))}
          </div>

          <p className="text-xs text-white/35 mt-4 font-medium">
            {stamps >= 10
              ? 'Congratulations! Redeem your free cup at any branch.'
              : `${10 - stamps} more drink stamp${10 - stamps !== 1 ? 's' : ''} to earn a free cup.`}
          </p>
        </div>
      </motion.div>

      {/* ─── EVENTS BOOKINGS ─── */}
      <div className="rounded-2xl border border-kado-dark/8 bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-kado-red/10 flex items-center justify-center shrink-0">
          <CalendarHeart className="w-6 h-6 text-kado-red" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-lg font-black text-kado-dark">Events Bookings</h2>
          <p className="text-xs text-kado-dark/50 mt-0.5">
            {myBoothCount > 0
              ? `${myBoothCount} booth request${myBoothCount !== 1 ? 's' : ''} — view estimates and official quotes`
              : 'Plan a celebration — submit a request and we will send a quote'}
          </p>
        </div>
        <Link
          to="/account/booth"
          className="inline-flex items-center gap-2 rounded-xl bg-kado-dark text-kado-cream px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-kado-red transition-colors shrink-0"
        >
          {myBoothCount > 0 ? 'View bookings' : 'Book booth'} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ─── ACTIVE ORDERS ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl md:text-2xl font-black text-kado-dark tracking-tight">Active Orders</h2>
          {myOrders.length > 0 && (
            <Link to="/account/orders" className="text-[10px] font-black uppercase tracking-widest text-kado-red hover:text-kado-dark transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {activeOrders.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-kado-dark/10 bg-[#FAF7F2] p-10 md:p-14 text-center">
            <ShoppingBag className="w-10 h-10 text-kado-dark/15 mx-auto mb-4" />
            <p className="text-sm font-bold text-kado-dark/50 mb-1">No active orders</p>
            <p className="text-xs text-kado-dark/35 mb-5">Place an order from the menu to get started.</p>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 bg-kado-red text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-kado-dark transition-colors"
            >
              Browse Menu <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {activeOrders.map((o, i) => (
              <motion.li
                key={o.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-kado-dark/8 bg-white p-5 flex items-center gap-4 hover:shadow-[0_8px_24px_rgba(158,24,29,0.05)] hover:border-kado-red/15 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] flex items-center justify-center shrink-0 group-hover:bg-kado-red/10 transition-colors">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-black text-kado-dark">{o.shortCode}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {o.status}
                    </span>
                  </div>
                  <p className="text-xs text-kado-dark/45 truncate font-medium">
                    {o.items.map((item) => `${item.qty}× ${item.productNameSnapshot}`).join(', ')}
                  </p>
                  {branchName(o.branchId) && (
                    <p className="text-[10px] text-kado-dark/35 flex items-center gap-0.5 mt-0.5 font-medium">
                      <MapPin className="w-3 h-3" /> {branchName(o.branchId)}
                    </p>
                  )}
                </div>
                <span className="font-display font-black text-kado-red text-lg shrink-0">{formatPhp(o.total)}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
