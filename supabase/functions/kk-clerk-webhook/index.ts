import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Webhook } from "npm:svix@1.37.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLERK_WEBHOOK_SECRET = Deno.env.get("CLERK_WEBHOOK_SECRET")!;

type ClerkUserEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string | null;
    last_name?: string | null;
    unsafe_metadata?: Record<string, unknown>;
    public_metadata?: Record<string, unknown>;
  };
};

function displayName(data: ClerkUserEvent["data"]): string {
  const metaName =
    typeof data.unsafe_metadata?.name === "string" ? data.unsafe_metadata.name.trim() : "";
  const parts = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  const email = data.email_addresses?.[0]?.email_address ?? "user";
  return metaName || parts || email.split("@")[0] || "User";
}

function resolveRole(data: ClerkUserEvent["data"]): string {
  const pub = data.public_metadata?.role;
  const unsafe = data.unsafe_metadata?.role;
  const role = typeof pub === "string" ? pub : typeof unsafe === "string" ? unsafe : "customer";
  return ["admin", "barista", "staff", "customer"].includes(role) ? role : "customer";
}

function resolveBranchId(data: ClerkUserEvent["data"], role: string): string | null {
  if (role === "admin" || role === "customer") return null;
  const raw = data.public_metadata?.branchId ?? data.public_metadata?.branch_id ??
    data.unsafe_metadata?.branchId ?? data.unsafe_metadata?.branch_id;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function resolvePhone(data: ClerkUserEvent["data"]): string | null {
  const raw = data.unsafe_metadata?.phone;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event: ClerkUserEvent;
  try {
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);
    event = wh.verify(payload, headers) as ClerkUserEvent;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const clerkUserId = event.data.id;
  const email = event.data.email_addresses?.[0]?.email_address ?? "";
  const name = displayName(event.data);
  const role = resolveRole(event.data);
  const branchId = resolveBranchId(event.data, role);
  const phone = resolvePhone(event.data);

  if (event.type === "user.deleted") {
    await admin.from("kk_profiles").delete().eq("clerk_user_id", clerkUserId);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const { data: existing } = await admin
      .from("kk_profiles")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (existing?.id) {
      await admin.from("kk_profiles").update({
        email,
        name,
        role,
        branch_id: role === "admin" ? null : branchId,
        phone: role === "customer" ? phone : null,
      }).eq("id", existing.id);
    } else if (email) {
      const { data: byEmail } = await admin
        .from("kk_profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

      if (byEmail?.id) {
        await admin.from("kk_profiles").update({
          clerk_user_id: clerkUserId,
          name,
          role,
          branch_id: role === "admin" ? null : branchId,
          phone: role === "customer" ? phone : null,
        }).eq("id", byEmail.id);
      } else {
        await admin.from("kk_profiles").insert({
          id: crypto.randomUUID(),
          clerk_user_id: clerkUserId,
          email,
          name,
          role,
          branch_id: role === "admin" ? null : branchId,
          phone: role === "customer" ? phone : null,
          loyalty_stamps: role === "customer" ? 0 : 0,
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, ignored: event.type }), {
    headers: { "Content-Type": "application/json" },
  });
});
