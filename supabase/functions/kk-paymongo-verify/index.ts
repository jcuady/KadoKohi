import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { userIdFromBearer } from "../_shared/supabaseAuth.ts";
import { markPaymongoOrderPaid, paidPaymentFromSessionAttrs } from "../_shared/paymongoPaid.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, message: "Method not allowed" }, 405);

  const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!secretKey || !supabaseUrl || !serviceKey) {
    return json({ ok: false, message: "PayMongo is not configured on the server." }, 503);
  }

  let body: { orderId?: string; shortCode?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: "Invalid JSON body." }, 400);
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const shortCode = typeof body.shortCode === "string" ? body.shortCode.trim().toUpperCase() : "";
  if (!orderId) return json({ ok: false, message: "orderId is required." }, 400);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: order, error: orderErr } = await admin
    .from("kk_orders")
    .select(
      "id, short_code, customer_id, payment_method, payment_status, status, paymongo_checkout_session_id",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) return json({ ok: false, message: "Order not found." }, 404);
  if (order.payment_method !== "paymongo") {
    return json({ ok: false, message: "Order is not a PayMongo order." }, 400);
  }

  const authUserId = await userIdFromBearer(admin, req.headers.get("Authorization"));
  let profileId: string | null = authUserId;
  if (authUserId) {
    const { data: profile } = await admin
      .from("kk_profiles")
      .select("id")
      .or(`id.eq.${authUserId},clerk_user_id.eq.${authUserId}`)
      .limit(1)
      .maybeSingle();
    if (profile?.id) profileId = profile.id;
  }

  if (order.customer_id) {
    if (!profileId || profileId !== order.customer_id) {
      return json({ ok: false, message: "Sign in to verify this payment." }, 401);
    }
  } else if (!shortCode || shortCode !== String(order.short_code ?? "").toUpperCase()) {
    return json({ ok: false, message: "Invalid order reference for guest verify." }, 403);
  }

  if (order.payment_status === "paid") {
    return json({ ok: true, paid: true, status: order.status, alreadyPaid: true });
  }

  const sessionId = order.paymongo_checkout_session_id as string | null;
  if (!sessionId) {
    return json({ ok: true, paid: false, message: "No PayMongo session on this order yet." });
  }

  const pmRes = await fetch(`https://api.paymongo.com/v2/checkout_sessions/${sessionId}`, {
    headers: { Authorization: `Basic ${btoa(`${secretKey}:`)}` },
  });
  const pmJson = await pmRes.json().catch(() => ({}));
  if (!pmRes.ok) {
    // Webhook may have already marked paid while PayMongo session fetch fails
    // (expired/consumed session). Re-check DB before surfacing an error.
    const { data: fresh } = await admin
      .from("kk_orders")
      .select("payment_status, status")
      .eq("id", orderId)
      .maybeSingle();
    if (fresh?.payment_status === "paid") {
      return json({
        ok: true,
        paid: true,
        status: fresh.status,
        alreadyPaid: true,
      });
    }
    console.error("paymongo verify session fetch failed", pmJson);
    const detail =
      pmJson?.errors?.[0]?.detail ||
      pmJson?.errors?.[0]?.title ||
      "Could not verify payment with PayMongo.";
    // Consumed/expired sessions often mean payment already happened — treat as pending, not hard fail.
    if (/consumed|expired|inactive/i.test(String(detail))) {
      return json({
        ok: true,
        paid: false,
        status: order.status,
        sessionStatus: "consumed",
        message: detail,
      });
    }
    return json({ ok: false, message: detail }, 502);
  }

  const attrs = (pmJson?.data?.attributes ?? {}) as Record<string, unknown>;
  const sessionStatus = String(attrs.status ?? "").toLowerCase();
  const paidHit = paidPaymentFromSessionAttrs(attrs);
  if (!paidHit) {
    return json({
      ok: true,
      paid: false,
      status: order.status,
      sessionStatus: sessionStatus || "active",
    });
  }

  const result = await markPaymongoOrderPaid(admin, order, sessionId, paidHit.paymentId);
  if (!result.ok) return json({ ok: false, message: "Failed to update order payment." }, 500);

  const nextStatus = order.status === "pending" ? "accepted" : order.status;
  return json({
    ok: true,
    paid: true,
    status: nextStatus,
    paymentId: paidHit.paymentId,
    reconciled: !result.alreadyPaid,
  });
});
