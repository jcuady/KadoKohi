import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Gift, Star, Copy, Check, Sparkles, Coffee, ShoppingBag } from 'lucide-react';
import AccountPageHeader from '../../components/account/AccountPageHeader';
import { useAuthStore } from '../../store/authStore';
import { useLoyaltyStore } from '../../store/loyaltyStore';
import { useVoucherStore } from '../../store/voucherStore';
import { useBranchStore } from '../../store/branchStore';
import { formatVoucherScopeLabel } from '../../lib/branchScope';
import type { LoyaltyReward, LoyaltyRewardType } from '../../types/domain';
import { formatPhp } from '../../lib/money';
import { useCheckoutStore } from '../../store/checkoutStore';
import { useCartStore } from '../../store/cartStore';

const REWARD_ICONS: Record<LoyaltyRewardType, typeof Gift> = {
  free_drink: Coffee,
  free_merch: ShoppingBag,
  discount_percent: Sparkles,
  discount_fixed: Gift,
  custom: Gift,
};

function rewardHint(type: LoyaltyRewardType, value?: number): string {
  switch (type) {
    case 'free_drink':
      return 'One drink discounted at checkout (cheapest drink line).';
    case 'free_merch':
      return 'Discount on your smallest merch line at checkout.';
    case 'discount_percent':
      return `${value ?? 0}% off your cart subtotal before tax.`;
    case 'discount_fixed':
      return `${formatPhp(value ?? 0)} off your cart subtotal before tax.`;
    default:
      return value != null ? `${formatPhp(value)} off when applicable.` : 'Applied at checkout when eligible.';
  }
}

export default function AccountVouchers() {
  const navigate = useNavigate();
  const setSelectedVoucherId = useCheckoutStore((s) => s.setSelectedVoucherId);
  const openCart = useCartStore((s) => s.openCart);
  const user = useAuthStore((s) => s.user);
  const branches = useBranchStore((s) => s.branches);
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name;
  const stamps = user?.loyaltyStamps ?? 0;
  const config = useLoyaltyStore((s) => s.config);
  const claimReward = useVoucherStore((s) => s.claimReward);
  const activeVouchersForCustomer = useVoucherStore((s) => s.activeVouchersForCustomer);
  const allVouchers = useVoucherStore((s) => s.vouchers);

  const [claimMsg, setClaimMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rewards = useMemo(
    () => [...config.rewards].filter((r) => r.active).sort((a, b) => a.stampsRequired - b.stampsRequired),
    [config.rewards],
  );

  const active = useMemo(
    () => (user?.id ? activeVouchersForCustomer(user.id) : []),
    [activeVouchersForCustomer, user?.id],
  );

  const history = useMemo(() => {
    if (!user?.id) return [];
    return allVouchers
      .filter((v) => v.customerId === user.id && v.status !== 'active')
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 12);
  }, [allVouchers, user?.id]);

  const nextReward = useMemo(() => {
    const locked = rewards.filter((r) => stamps < r.stampsRequired);
    if (locked.length === 0) return null;
    return locked.reduce((a, b) => (a.stampsRequired <= b.stampsRequired ? a : b));
  }, [rewards, stamps]);

  const handleClaim = async (reward: LoyaltyReward) => {
    setClaimMsg(null);
    if (!user?.id) return;
    const res = await claimReward(user.id, reward.id);
    if (res.ok === false) {
      setClaimMsg({ type: 'err', text: res.error });
      return;
    }
    const scope = formatVoucherScopeLabel(res.voucher.branchId, branchName);
    setClaimMsg({
      type: 'ok',
      text: `Voucher ${res.voucher.code} unlocked (${scope})! Pick the same branch at checkout to use it.`,
    });
  };

  const useInCart = (voucherId: string) => {
    setSelectedVoucherId(voucherId);
    navigate('/menu');
    openCart();
  };

  const copyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setClaimMsg({ type: 'err', text: 'Could not copy — select the code manually.' });
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <AccountPageHeader
        eyebrow="Kado Circle"
        title="Rewards"
        subtitle="Earn stamps on completed drinks. Claim here, then apply in your cart."
      />

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-kado-dark text-kado-cream p-5 sm:p-7 overflow-hidden relative"
      >
        <span
          className="pointer-events-none absolute -right-1 top-0 font-display text-[5rem] leading-none text-kado-cream/[0.06] select-none"
          aria-hidden
        >
          角
        </span>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-kado-red fill-kado-red" aria-hidden />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-cream/70">
                Your stamps
              </span>
            </div>
            <p className="font-display text-4xl md:text-5xl font-black tracking-tight">
              {stamps} <span className="text-kado-cream/35 text-2xl md:text-3xl font-bold">stamps</span>
            </p>
            {nextReward && (
              <p className="text-xs text-kado-cream/60 mt-3 max-w-sm">
                Next: <span className="text-kado-cream font-semibold">{nextReward.name}</span> at{' '}
                {nextReward.stampsRequired} stamps ({nextReward.stampsRequired - stamps} to go).
              </p>
            )}
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center justify-center rounded-xl bg-kado-cream text-kado-dark px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-white transition-colors shrink-0"
          >
            Order drinks
          </Link>
        </div>
      </motion.section>

      {claimMsg && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            claimMsg.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {claimMsg.text}
        </div>
      )}

      <section>
        <h2 className="font-display text-xl font-black text-kado-dark mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-kado-red" />
          Claim with stamps
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {rewards.map((reward, i) => {
            const Icon = REWARD_ICONS[reward.type];
            const canClaim = stamps >= reward.stampsRequired;
            return (
              <motion.article
                key={reward.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-2xl border p-5 flex flex-col bg-white ${
                  canClaim ? 'border-kado-red/35 shadow-[0_8px_30px_rgba(158,24,29,0.08)]' : 'border-kado-dark/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-kado-cream flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-kado-red" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-kado-dark text-kado-cream">
                    {reward.stampsRequired} stamps
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-kado-dark">{reward.name}</h3>
                {reward.description && (
                  <p className="text-xs text-kado-dark/55 mt-1 leading-relaxed">{reward.description}</p>
                )}
                <p className="text-[11px] text-kado-dark/45 mt-2 leading-relaxed">{rewardHint(reward.type, reward.value)}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-kado-dark/45 mt-2">
                  Valid at: {formatVoucherScopeLabel(reward.branchId, branchName)}
                </p>
                <div className="mt-4 pt-4 border-t border-kado-dark/8 flex items-center justify-between gap-3">
                  <span className={`text-xs font-bold ${canClaim ? 'text-emerald-700' : 'text-kado-dark/40'}`}>
                    {canClaim ? 'Ready to claim' : `${reward.stampsRequired - stamps} more stamps`}
                  </span>
                  <button
                    type="button"
                    disabled={!canClaim}
                    onClick={() => handleClaim(reward)}
                    className="rounded-xl bg-kado-red text-kado-cream px-4 py-2 text-[10px] font-black uppercase tracking-wider disabled:opacity-35 hover:bg-kado-dark transition-colors"
                  >
                    Claim
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-black text-kado-dark mb-4">Your active vouchers</h2>
        {active.length === 0 ? (
          <p className="text-sm text-kado-dark/50 rounded-xl border border-dashed border-kado-dark/15 bg-kado-offwhite/60 p-8 text-center">
            No active vouchers. Claim a reward above, then select it in your cart at checkout.
          </p>
        ) : (
          <ul className="space-y-3">
            {active.map((v) => (
              <li
                key={v.id}
                className="rounded-2xl border border-kado-red/20 bg-gradient-to-r from-kado-cream/40 to-white p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-kado-red mb-1">{v.rewardNameSnapshot}</p>
                  <p className="font-mono font-bold text-lg text-kado-dark tracking-wide">{v.code}</p>
                  <p className="text-xs text-kado-dark/50 mt-1">
                    {formatVoucherScopeLabel(v.branchId, branchName)}
                    {' · '}
                    Expires {v.expiresAt ? new Date(v.expiresAt).toLocaleDateString('en-PH') : '—'}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => useInCart(v.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-kado-red text-kado-cream px-4 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-kado-dark transition-colors"
                  >
                    Use in cart
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyCode(v.id, v.code)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-kado-dark/15 bg-white px-4 py-2.5 text-xs font-bold text-kado-dark hover:border-kado-red/40"
                  >
                    {copiedId === v.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copiedId === v.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold text-kado-dark/70 mb-3">Past vouchers</h2>
          <ul className="text-sm text-kado-dark/50 space-y-2">
            {history.map((v) => (
              <li key={v.id} className="flex justify-between border-b border-kado-dark/5 pb-2">
                <span>
                  {v.code} · {v.rewardNameSnapshot}
                </span>
                <span className="uppercase text-[10px] font-bold tracking-wider">{v.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
