import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * PayMongo webhook — marks orders paid when checkout_session.payment.paid fires.
 * verify_JWT must be false (PayMongo cannot send a Supabase JWT).
 *
 * Required: PAYMONGO_WEBHOOK_SECRET + Basic auth in PayMongo dashboard
 * (username = secret, empty password).
 */

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function basicUser(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(authHeader.slice(6));
    return decoded.split(":")[0] || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return json({ ok: false, message: "Method not allowed" }, 405);

  // Require Basic auth when PAYMONGO_WEBHOOK_SECRET is configured.
  // Without a secret, refuse all events — never mark orders paid from anonymous POSTs.
  const webhookSecret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET")?.trim();
  if (!webhookSecret) {
    console.error("PAYMONGO_WEBHOOK_SECRET is not set");
    return json({ ok: false, message: "Webhook is not configured." }, 503);
  }
  const user = basicUser(req.headers.get("Authorization"));
  if (user !== webhookSecret) {
    return json({ ok: false, message: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, message: "Server misconfigured" }, 503);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, message: "Invalid JSON" }, 400);
  }

  const eventType = payload?.data?.attributes?.type ?? payload?.type;
  // Hosted checkout paid event (v2) + payment.paid fallback
  const allowed = new Set([
    "checkout_session.payment.paid",
    "payment.paid",
  ]);
  if (!allowed.has(eventType)) {
    return json({ ok: true, ignored: true, eventType: eventType ?? null });
  }

  const eventData = payload?.data?.attributes?.data ?? payload?.data;
  const attrs = eventData?.attributes ?? {};
  const sessionId =
    eventData?.id?.startsWith?.("cs_")
      ? (eventData.id as string)
      : (attrs.checkout_session_id as string | undefined) ?? null;
  const referenceNumber =
    (attrs.reference_number as string | undefined) ||
    (attrs.metadata?.order_id as string | undefined) ||
    null;
  const paymentId =
    (attrs.payments?.[0]?.id as string | undefined) ||
    (eventData?.id?.startsWith?.("pay_") ? (eventData.id as string) : null) ||
    null;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let orderQuery = admin
    .from("kk_orders")
    .select("id, payment_status, status, payment_method, paymongo_checkout_session_id")
    .limit(1);

  if (referenceNumber) {
    orderQuery = orderQuery.eq("id", referenceNumber);
  } else if (sessionId) {
    orderQuery = orderQuery.eq("paymongo_checkout_session_id", sessionId);
  } else {
    return json({ ok: false, message: "No order reference in webhook" }, 400);
  }

  const { data: order, error } = await orderQuery.maybeSingle();
  if (error || !order) {
    console.error("paymongo webhook order not found", { referenceNumber, sessionId, error });
    return json({ ok: false, message: "Order not found" }, 404);
  }

  if (order.payment_method !== "paymongo") {
    return json({ ok: true, skipped: "not_paymongo" });
  }

  if (order.payment_status === "paid") {
    return json({ ok: true, alreadyPaid: true });
  }

  const patch: Record<string, unknown> = {
    payment_status: "paid",
    updated_at: new Date().toISOString(),
  };
  if (sessionId) patch.paymongo_checkout_session_id = sessionId;
  if (paymentId) patch.paymongo_payment_id = paymentId;
  // Move pending → accepted once paid (matches staff GCash verify behavior).
  if (order.status === "pending") {
    patch.status = "accepted";
  }

  const { error: updErr } = await admin.from("kk_orders").update(patch).eq("id", order.id);
  if (updErr) {
    console.error("paymongo webhook update failed", updErr);
    return json({ ok: false, message: "Failed to mark paid" }, 500);
  }

  return json({ ok: true, orderId: order.id, paymentId });
});
