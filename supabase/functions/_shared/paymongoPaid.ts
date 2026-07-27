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
): Promise<{ ok: boolean; alreadyPaid?: boolean; skipped?: string }> {
  if (order.payment_status === "paid") return { ok: true, alreadyPaid: true };
  // Cancel-then-pay: never revive a cancelled ticket. Ops refund via PayMongo SOP.
  if (order.status === "cancelled") {
    console.warn("markPaymongoOrderPaid skipped cancelled order", { orderId: order.id, sessionId, paymentId });
    return { ok: true, skipped: "cancelled" };
  }

  const patch: Record<string, unknown> = {
    payment_status: "paid",
    updated_at: new Date().toISOString(),
  };
  if (sessionId) patch.paymongo_checkout_session_id = sessionId;
  if (paymentId) patch.paymongo_payment_id = paymentId;
  if (order.status === "pending") patch.status = "accepted";

  // Conditional update: concurrent verify+webhook → only one writer wins.
  // Also refuse cancelled rows if status raced after the read above.
  const { data, error } = await admin
    .from("kk_orders")
    .update(patch)
    .eq("id", order.id)
    .neq("payment_status", "paid")
    .neq("status", "cancelled")
    .select("id");

  if (error) {
    console.error("markPaymongoOrderPaid failed", error);
    return { ok: false };
  }
  if (!data?.length) {
    // Re-read: either already paid or cancelled between checks.
    const { data: latest } = await admin
      .from("kk_orders")
      .select("payment_status, status")
      .eq("id", order.id)
      .maybeSingle();
    if (latest?.status === "cancelled") return { ok: true, skipped: "cancelled" };
    return { ok: true, alreadyPaid: true };
  }
  return { ok: true };
}
