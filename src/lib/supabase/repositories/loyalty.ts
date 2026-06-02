import type { LoyaltyReward, LoyaltyVoucher } from '../../../types/domain';
import { supabase } from '../client';

function mapReward(row: Record<string, unknown>): LoyaltyReward {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? undefined,
    stampsRequired: Number(row.stamps_required ?? 0),
    type: row.type as LoyaltyReward['type'],
    value: row.value != null ? Number(row.value) : undefined,
    active: Boolean(row.active),
    branchId: (row.branch_id as string | null) ?? undefined,
  };
}

function mapVoucher(row: Record<string, unknown>): LoyaltyVoucher {
  return {
    id: row.id as string,
    code: row.code as string,
    customerId: row.customer_id as string,
    rewardId: row.reward_id as string,
    rewardNameSnapshot: row.reward_name_snapshot as string,
    rewardType: row.reward_type as LoyaltyVoucher['rewardType'],
    rewardValue: row.reward_value != null ? Number(row.reward_value) : undefined,
    stampsSpent: Number(row.stamps_spent ?? 0),
    branchId: (row.branch_id as string | null) ?? undefined,
    status: row.status as LoyaltyVoucher['status'],
    createdAt: row.created_at as string,
    expiresAt: (row.expires_at as string | null) ?? undefined,
    redeemedAt: (row.redeemed_at as string | null) ?? undefined,
    redeemedOrderId: (row.redeemed_order_id as string | null) ?? undefined,
  };
}

export const loyaltyRepo = {
  async fetchRewards(): Promise<LoyaltyReward[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('kk_loyalty_rewards')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('stamps_required', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => mapReward(r as Record<string, unknown>));
  },

  async upsertReward(r: LoyaltyReward): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('kk_loyalty_rewards').upsert({
      id: r.id,
      name: r.name.trim(),
      description: r.description?.trim() || null,
      stamps_required: r.stampsRequired,
      type: r.type,
      value: r.value ?? null,
      active: r.active,
      branch_id: r.branchId ?? null,
      sort_order: 0,
    });
    if (error) throw error;
  },

  async removeReward(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('kk_loyalty_rewards').delete().eq('id', id);
    if (error) throw error;
  },

  async fetchVouchersForCustomer(customerId: string): Promise<LoyaltyVoucher[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('kk_loyalty_vouchers')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => mapVoucher(r as Record<string, unknown>));
  },

  async claimReward(rewardId: string): Promise<LoyaltyVoucher> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('kk_claim_loyalty_reward', {
      p_reward_id: rewardId,
    });
    if (error) throw error;
    return mapVoucher(data as Record<string, unknown>);
  },
};
