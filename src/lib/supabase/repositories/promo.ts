import type { PromoCode, PromoCodeType } from '../../../types/domain';
import { supabase } from '../client';

function mapRow(r: Record<string, unknown>): PromoCode {
  return {
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    description: (r.description as string | null) ?? undefined,
    type: r.type as PromoCodeType,
    value: Number(r.value ?? 0),
    minOrderAmount: Number(r.min_order_amount ?? 0),
    maxUses: r.max_uses != null ? Number(r.max_uses) : undefined,
    uses: Number(r.uses ?? 0),
    perCustomer: Number(r.per_customer ?? 1),
    active: Boolean(r.active),
    startsAt: (r.starts_at as string | null) ?? undefined,
    expiresAt: (r.expires_at as string | null) ?? undefined,
    branchId: (r.branch_id as string | null) ?? undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export const promoRepo = {
  /** Admin: fetch all codes with usage counts. */
  async fetchAll(): Promise<PromoCode[]> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('kk_promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  /** Public: validate one code by string (anon + authenticated). */
  async fetchByCode(code: string): Promise<PromoCode | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('kk_promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('active', true)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as Record<string, unknown>);
  },

  /** Admin: upsert a promo code. */
  async upsert(p: Omit<PromoCode, 'uses' | 'createdAt' | 'updatedAt'> & { createdBy?: string }): Promise<void> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.from('kk_promo_codes').upsert({
      id: p.id,
      code: p.code.toUpperCase().trim(),
      name: p.name.trim(),
      description: p.description?.trim() || null,
      type: p.type,
      value: p.value,
      min_order_amount: p.minOrderAmount,
      max_uses: p.maxUses ?? null,
      per_customer: p.perCustomer,
      active: p.active,
      starts_at: p.startsAt ?? null,
      expires_at: p.expiresAt ?? null,
      branch_id: p.branchId ?? null,
      created_by: p.createdBy ?? null,
    });
    if (error) throw error;
  },

  /** Admin: hard-delete a promo code. */
  async remove(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.from('kk_promo_codes').delete().eq('id', id);
    if (error) throw error;
  },

  /** How many times has a customer already used this code? */
  async customerUsageCount(promoCodeId: string, customerId: string): Promise<number> {
    if (!supabase) return 0;
    const { count } = await supabase
      .from('kk_promo_claims')
      .select('*', { count: 'exact', head: true })
      .eq('promo_code_id', promoCodeId)
      .eq('customer_id', customerId);
    return count ?? 0;
  },

  /** Record a claim and increment the usage counter. */
  async recordClaim(input: {
    promoCodeId: string;
    customerId?: string | null;
    guestEmail?: string | null;
    orderId: string;
    discountAmount: number;
  }): Promise<void> {
    if (!supabase) return;
    const { error: insertErr } = await supabase.from('kk_promo_claims').insert({
      promo_code_id: input.promoCodeId,
      customer_id: input.customerId ?? null,
      guest_email: input.guestEmail ?? null,
      order_id: input.orderId,
      discount_amount: input.discountAmount,
    });
    if (insertErr) throw insertErr;
    // Usage counter is incremented server-side by kk_place_order only.
  },

  /** Admin: fetch claims per code for analytics. */
  async fetchClaims(promoCodeId: string): Promise<{ orderId: string; discountAmount: number; claimedAt: string }[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('kk_promo_claims')
      .select('order_id, discount_amount, claimed_at')
      .eq('promo_code_id', promoCodeId)
      .order('claimed_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>) => ({
      orderId: r.order_id as string,
      discountAmount: Number(r.discount_amount),
      claimedAt: r.claimed_at as string,
    }));
  },
};
