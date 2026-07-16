import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import OnboardingBanner from '../../components/customer/OnboardingBanner';
import AccountEmptyState from '../../components/account/AccountEmptyState';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { formatPhp } from '../../lib/money';
import {
  Coffee,
  Star,
  ArrowRight,
  ShoppingBag,
  Clock,
  Gift,
  MapPin,
  CalendarHeart,
  ChevronRight,
} from 'lucide-react';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { useVoucherStore } from '../../store/voucherStore';
import { ORDER_STATUS_LABELS, orderNeedsCustomerPayment } from '../../lib/orderStatus';
import { checkoutPath } from '../../lib/pendingPayments';

function firstName(full?: string) {
  if (!full) return 'there';
  return full.trim().split(/\s+/)[0] || full;
}

export default function AccountDashboard() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const isNewUser = Boolean((location.state as { onboard?: boolean } | null)?.onboard);
  const orders = useOrderStore((s) => s.orders);
  const branches = useBranchStore((s) => s.branches);

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? '';
  }, [branches]);

  const myOrders = useMemo(() => orders.filter((o) => o.customerId === user?.id), [orders, user?.id]);
  const activeOrders = useMemo(
    () => myOrders.filter((o) => !['completed', 'cancelled'].includes(o.status)),
    [myOrders],
  );
  const stamps = user?.loyaltyStamps ?? 0;
  const boothBookings = useBoothBookingStore((s) => s.bookingsForCustomer);
  const myBoothCount = useMemo(
    () => (user?.id ? boothBookings(user.id).length : 0),
    [boothBookings, user?.id],
  );
  const activeVouchersForCustomer = useVoucherStore((s) => s.activeVouchersForCustomer);
  const activeVoucherCount = useMemo(
    () => (user?.id ? activeVouchersForCustomer(user.id).length : 0),
    [activeVouchersForCustomer, user?.id],
  );

  const stampPct = Math.min(100, (stamps / 10) * 100);

  return (
    <div className="space-y-[var(--account-section-gap,1rem)]">
      <OnboardingBanner isNewUser={isNewUser} />

      {/* Welcome + primary CTA */}
      <section className="rounded-2xl bg-kado-dark px-4 py-5 text-kado-cream relative overflow-hidden sm:px-7 sm:py-7 [@media(orientation:landscape)_and_(max-height:480px)]:py-4">
        <span
          className="pointer-events-none absolute -right-1 top-0 font-display text-[4.5rem] leading-none text-kado-cream/[0.06] select-none sm:text-[5rem]"
          aria-hidden
        >
          角
        </span>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-cream/50">
          {isNewUser ? 'Welcome' : 'Good to see you'}
        </p>
        <h1 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-3xl [@media(orientation:landscape)_and_(max-height:480px)]:text-xl">
          {firstName(user?.name)}
        </h1>
        <p className="mt-1.5 text-sm text-kado-cream/65 max-w-sm leading-relaxed line-clamp-2 sm:line-clamp-none">
          {isNewUser
            ? 'Your account is ready — order a drink and start earning stamps.'
            : 'Order, track pickup, and redeem Kado Circle rewards.'}
        </p>
        <Link
          to="/menu"
          className="mt-4 inline-flex min-h-[48px] w-full sm:mt-5 sm:w-auto items-center justify-center gap-2 rounded-full bg-kado-red px-6 text-[11px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-cream hover:text-kado-dark transition-colors touch-manipulation [@media(orientation:landscape)_and_(max-height:480px)]:mt-3 [@media(orientation:landscape)_and_(max-height:480px)]:min-h-[44px]"
        >
          <Coffee className="h-4 w-4" aria-hidden />
          Order now
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          {
            to: '/account/orders',
            label: 'Orders',
            hint: activeOrders.length ? `${activeOrders.length} active` : 'History',
            Icon: ShoppingBag,
          },
          {
            to: '/account/vouchers',
            label: 'Rewards',
            hint: activeVoucherCount ? `${activeVoucherCount} ready` : `${stamps}/10`,
            Icon: Gift,
          },
          {
            to: '/account/booth',
            label: 'Events',
            hint: myBoothCount ? `${myBoothCount} booking${myBoothCount === 1 ? '' : 's'}` : 'Book',
            Icon: CalendarHeart,
          },
        ].map(({ to, label, hint, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 rounded-2xl border border-kado-dark/8 bg-white px-2 py-4 text-center hover:border-kado-red/25 transition-colors touch-manipulation min-h-[96px]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-kado-cream text-kado-red">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-kado-dark">{label}</span>
            <span className="text-[10px] font-medium text-kado-dark/40 leading-none">{hint}</span>
          </Link>
        ))}
      </section>

      {/* Loyalty */}
      <section className="rounded-2xl border border-kado-dark/8 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-kado-red fill-kado-red" aria-hidden />
            <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/50">
              Kado Circle
            </h2>
          </div>
          <Link
            to="/account/vouchers"
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-kado-red touch-manipulation"
          >
            Rewards <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <div className="flex items-end justify-between gap-3 mb-3">
          <p className="font-display text-3xl font-black text-kado-dark tracking-tight">
            {stamps}
            <span className="text-kado-dark/25"> / 10</span>
          </p>
          <p className="text-xs text-kado-dark/45 pb-1">1 stamp per drink</p>
        </div>
        <div className="h-2.5 rounded-full bg-kado-offwhite overflow-hidden" role="progressbar" aria-valuenow={stamps} aria-valuemin={0} aria-valuemax={10}>
          <motion.div
            className="h-full rounded-full bg-kado-red"
            initial={{ width: 0 }}
            animate={{ width: `${stampPct}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-3 text-xs text-kado-dark/50 leading-relaxed">
          {stamps >= 10
            ? 'You can claim a free cup reward — open Rewards.'
            : `${10 - stamps} more stamp${10 - stamps === 1 ? '' : 's'} to a free cup.`}
        </p>
      </section>

      {/* Active orders */}
      <section>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="font-display text-lg font-black text-kado-dark">Active orders</h2>
          {myOrders.length > 0 ? (
            <Link
              to="/account/orders"
              className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-kado-red touch-manipulation"
            >
              See all <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>

        {activeOrders.length === 0 ? (
          <AccountEmptyState
            icon={ShoppingBag}
            title="No active orders"
            description="Place an order from the menu — we’ll track it here."
            actionLabel="Browse menu"
            actionTo="/menu"
          />
        ) : (
          <ul className="space-y-2.5">
            {activeOrders.map((o) => (
              <li key={o.id}>
                <div className="rounded-2xl border border-kado-dark/8 bg-white p-4 flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Clock className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-black text-kado-dark">{o.shortCode}</span>
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-800">
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-kado-dark/50 truncate">
                      {o.items.map((item) => `${item.qty}× ${item.productNameSnapshot}`).join(', ')}
                    </p>
                    {branchName(o.branchId) ? (
                      <p className="mt-0.5 flex items-center gap-0.5 text-[11px] text-kado-dark/40">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                        {branchName(o.branchId)}
                      </p>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="font-display font-black text-kado-red">{formatPhp(o.total)}</span>
                      {orderNeedsCustomerPayment(o) ? (
                        <Link
                          to={checkoutPath(o.id)}
                          className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-kado-red px-4 text-[10px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-dark touch-manipulation"
                        >
                          {o.paymentStatus === 'unpaid' ? 'Pay now' : 'View payment'}
                        </Link>
                      ) : (
                        <Link
                          to="/account/orders"
                          className="inline-flex min-h-[40px] items-center gap-1 text-[10px] font-black uppercase tracking-wider text-kado-dark/50 hover:text-kado-red touch-manipulation"
                        >
                          Details <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
