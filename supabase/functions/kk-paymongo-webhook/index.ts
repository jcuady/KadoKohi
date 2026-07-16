import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { markPaymongoOrderPaid } from "../_shared/paymongoPaid.ts";

/**
 * PayMongo webhook — marks orders paid when checkout_session.payment.paid fires.
 * verify_JWT must be false (PayMongo cannot send a Supabase JWT).
 *
 * Auth: Paymongo-Signature HMAC-SHA256 (primary) or Basic username = webhook secret (legacy).
 */

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
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

async function isAuthorized(req: Request, rawBody: string, webhookSecret: string): Promise<boolean> {
  const signature = req.headers.get("paymongo-signature")?.trim();
  if (signature) {
    const expected = await hmacSha256Hex(webhookSecret, rawBody);
    if (timingSafeEqual(expected, signature)) return true;
  }
  const user = basicUser(req.headers.get("Authorization"));
  return user === webhookSecret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return json({ ok: false, message: "Method not allowed" }, 405);

  const webhookSecret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET")?.trim();
  if (!webhookSecret) {
    console.error("PAYMONGO_WEBHOOK_SECRET is not set");
    return json({ ok: false, message: "Webhook is not configured." }, 503);
  }

  const rawBody = await req.text();
  if (!(await isAuthorized(req, rawBody, webhookSecret))) {
    return json({ ok: false, message: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, message: "Server misconfigured" }, 503);
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, message: "Invalid JSON" }, 400);
  }

  // PayMongo v2: data.type = checkout_session.payment.paid, nested session at data.data
  const eventType =
    payload?.data?.type ??
    payload?.data?.attributes?.type ??
    payload?.type ??
    null;
  const allowed = new Set(["checkout_session.payment.paid", "payment.paid"]);
  if (!allowed.has(eventType)) {
    return json({ ok: true, ignored: true, eventType });
  }

  const eventData =
    payload?.data?.data ??
    payload?.data?.attributes?.data ??
    payload?.data ??
    null;
  const attrs = eventData?.attributes ?? {};
  const sessionId =
    eventData?.id?.startsWith?.("cs_")
      ? (eventData.id as string)
      : (attrs.checkout_session_id as string | undefined) ?? null;
  const referenceNumber =
    (attrs.reference_number as string | undefined) ||
    (attrs.metadata?.order_id as string | undefined) ||
    null;
  const payments = attrs.payments as Array<{ id?: string; attributes?: { status?: string } }> | undefined;
  const paidPayment = Array.isArray(payments)
    ? payments.find((p) => p?.attributes?.status === "paid")
    : undefined;
  const paymentId =
    paidPayment?.id ??
    (attrs.payments?.[0]?.id as string | undefined) ??
    (eventData?.id?.startsWith?.("pay_") ? (eventData.id as string) : null);

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

  const result = await markPaymongoOrderPaid(admin, order, sessionId, paymentId);
  if (!result.ok) return json({ ok: false, message: "Failed to mark paid" }, 500);

  return json({ ok: true, orderId: order.id, paymentId, alreadyPaid: result.alreadyPaid ?? false });
});
