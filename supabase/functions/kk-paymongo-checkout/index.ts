import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { userIdFromBearer } from "../_shared/supabaseAuth.ts";

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

function phpToCentavos(pesos: number): number {
  if (!Number.isFinite(pesos) || pesos < 0) return 0;
  return Math.round(pesos * 100);
}

function siteBaseUrl(): string {
  const raw =
    Deno.env.get("SITE_URL")?.trim() ||
    Deno.env.get("VITE_SITE_URL")?.trim() ||
    "https://www.kadokohi.com";
  return raw.replace(/\/$/, "");
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

  let body: {
    orderId?: string;
    shortCode?: string;
    successUrl?: string;
    cancelUrl?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: "Invalid JSON body." }, 400);
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const shortCode = typeof body.shortCode === "string" ? body.shortCode.trim().toUpperCase() : "";
  if (!orderId) return json({ ok: false, message: "orderId is required." }, 400);

  const base = siteBaseUrl();
  const allowUrl = (raw: string | undefined, fallback: string): string => {
    const u = typeof raw === "string" ? raw.trim() : "";
    if (!u) return fallback;
    try {
      const parsed = new URL(u);
      const allowed = new URL(base);
      const okOrigin =
        parsed.origin === allowed.origin ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "localhost";
      if (!okOrigin) return fallback;
      return parsed.toString();
    } catch {
      return fallback;
    }
  };

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: order, error: orderErr } = await admin
    .from("kk_orders")
    .select(
      "id, short_code, customer_id, guest_name, payment_method, payment_status, status, total, channel",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return json({ ok: false, message: "Order not found." }, 404);
  }

  if (order.status === "cancelled") {
    return json({ ok: false, message: "This order was cancelled." }, 400);
  }
  if (order.payment_status === "paid") {
    return json({
      ok: true,
      alreadyPaid: true,
      paid: true,
      message: "This order is already paid.",
    });
  }
  if (order.payment_method !== "paymongo") {
    return json({ ok: false, message: "Order is not set to PayMongo." }, 400);
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
      return json({ ok: false, message: "Sign in to pay for this order." }, 401);
    }
  } else {
    // Guest QR / takeout: require short code proof.
    if (!shortCode || shortCode !== String(order.short_code ?? "").toUpperCase()) {
      return json({ ok: false, message: "Invalid order reference for guest checkout." }, 403);
    }
  }

  const amount = phpToCentavos(Number(order.total ?? 0));
  if (amount < 100) {
    return json({ ok: false, message: "Order total is too low for PayMongo (min ₱1.00)." }, 400);
  }

  const defaultSuccess = `${base}/checkout/${encodeURIComponent(order.id)}?paymongo=success`;
  const defaultCancel = `${base}/checkout/${encodeURIComponent(order.id)}?paymongo=cancel`;
  const successUrl = allowUrl(body.successUrl, defaultSuccess);
  const cancelUrl = allowUrl(body.cancelUrl, defaultCancel);

  const auth = btoa(`${secretKey}:`);
  const pmRes = await fetch("https://api.paymongo.com/v2/checkout_sessions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          // Merchant absorbs fee — do NOT pass fees to the customer.
          // Docs: https://docs.paymongo.com/docs/payment-channels-hosted-checkout
          pass_on_fees: false,
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          description: `Kado Kohi order ${order.short_code}`,
          reference_number: order.id,
          line_items: [
            {
              name: `Kado Kohi · ${order.short_code}`,
              amount,
              currency: "PHP",
              quantity: 1,
              description: `${order.channel} order`,
            },
          ],
          // Only QR Ph is enabled on this merchant account by default.
          payment_method_types: ["qrph"],
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            order_id: order.id,
            short_code: String(order.short_code ?? ""),
            channel: String(order.channel ?? ""),
          },
        },
      },
    }),
  });

  const pmJson = await pmRes.json().catch(() => ({}));
  if (!pmRes.ok) {
    const detail =
      pmJson?.errors?.[0]?.detail ||
      pmJson?.errors?.[0]?.title ||
      `PayMongo error (${pmRes.status})`;
    console.error("paymongo checkout create failed", pmJson);
    return json({ ok: false, message: detail }, 502);
  }

  const checkoutSessionId = pmJson?.data?.id as string | undefined;
  const checkoutUrl = pmJson?.data?.attributes?.checkout_url as string | undefined;
  if (!checkoutSessionId || !checkoutUrl) {
    return json({ ok: false, message: "PayMongo returned an incomplete checkout session." }, 502);
  }

  const { error: updErr } = await admin
    .from("kk_orders")
    .update({
      paymongo_checkout_session_id: checkoutSessionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updErr) {
    console.error("failed to store checkout session id", updErr);
    // Still return URL — payment can be reconciled via reference_number webhook.
  }

  return json({
    ok: true,
    checkoutUrl,
    checkoutSessionId,
  });
});
