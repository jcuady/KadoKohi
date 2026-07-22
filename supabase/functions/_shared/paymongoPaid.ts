import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

export function paidPaymentFromSessionAttrs(
  attrs: Record<string, unknown>,
): { paymentId: string | null } | null {
  const payments = attrs.payments as
    | Array<{ id?: string; attributes?: { status?: string } }>
    | undefined;
  if (!Array.isArray(payments)) return null;
  // PayMongo may mark payments paid / succeeded / consumed after capture.
  const hit = payments.find((p) => {
    const status = String(p?.attributes?.status ?? "").toLowerCase();
    return status === "paid" || status === "succeeded" || status === "consumed";
  });
  if (!hit) return null;
  return { paymentId: hit.id ?? null };
}

export async function markPaymongoOrderPaid(
  admin: SupabaseClient,
  order: { id: string; payment_status: string; status: string },
  sessionId: string | null,
  paymentId: string | null,
): Promise<{ ok: boolean; alreadyPaid?: boolean }> {
  if (order.payment_status === "paid") return { ok: true, alreadyPaid: true };

  const patch: Record<string, unknown> = {
    payment_status: "paid",
    updated_at: new Date().toISOString(),
  };
  if (sessionId) patch.paymongo_checkout_session_id = sessionId;
  if (paymentId) patch.paymongo_payment_id = paymentId;
  if (order.status === "pending") patch.status = "accepted";

  const { error } = await admin.from("kk_orders").update(patch).eq("id", order.id);
  if (error) {
    console.error("markPaymongoOrderPaid failed", error);
    return { ok: false };
  }
  return { ok: true };
}
