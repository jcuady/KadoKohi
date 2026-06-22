import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { verifyClerkBearer } from "../_shared/clerkAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@kadokohi.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Target {
  userId?: string;
  branchId?: string;
  roles?: string[];
}

interface Payload {
  targets: Target[];
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const caller = await verifyClerkBearer(authHeader);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (!payload.title || !payload.body || !Array.isArray(payload.targets)) {
    return new Response(JSON.stringify({ error: "Missing title, body, or targets" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Resolve target subscriptions (dedupe by endpoint).
  const endpoints = new Map<string, { endpoint: string; p256dh: string; auth: string }>();

  for (const target of payload.targets) {
    let query = admin.from("kk_push_subscriptions").select("endpoint,p256dh,auth");
    if (target.userId) query = query.eq("user_id", target.userId);
    if (target.branchId) query = query.eq("branch_id", target.branchId);
    if (target.roles && target.roles.length) query = query.in("role", target.roles);
    const { data } = await query;
    for (const row of data ?? []) {
      endpoints.set(row.endpoint, row);
    }
  }

  if (endpoints.size === 0) {
    return new Response(JSON.stringify({ sent: 0, message: "No subscriptions" }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    tag: payload.tag ?? "kado-order",
  });

  let sent = 0;
  const dead: string[] = [];

  await Promise.all(
    [...endpoints.values()].map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(sub.endpoint);
      }
    }),
  );

  // Clean up expired/unsubscribed endpoints.
  if (dead.length) {
    await admin.from("kk_push_subscriptions").delete().in("endpoint", dead);
  }

  return new Response(JSON.stringify({ sent, pruned: dead.length }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
