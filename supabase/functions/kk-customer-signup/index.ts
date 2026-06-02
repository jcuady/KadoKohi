import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function normalizePhilippinePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("63")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  const e164 = "+63" + digits.slice(0, 10);
  return /^\+639\d{9}$/.test(e164) ? e164 : null;
}

/** Generous in-memory limit per edge instance (not strict — stops accidental spam only). */
const recentByIp = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 40;

function isSoftRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recentByIp.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recentByIp.set(ip, hits);
  return hits.length > MAX_PER_WINDOW;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (isSoftRateLimited(ip)) {
    return json(
      {
        error:
          "A lot of sign-ups from this connection right now. Please try again in a few minutes, or sign in if you already have an account.",
      },
      429,
    );
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();
    const phone = normalizePhilippinePhone(String(body.phone ?? ""));

    if (!email || !password || !name || !phone) {
      return json({ error: "Missing or invalid required fields" }, 400);
    }
    if (password.length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }
    if (name.length < 2) {
      return json({ error: "Name must be at least 2 characters" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Invalid email address" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: "customer", phone },
    });

    if (createError) {
      const msg = createError.message.toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists") ||
        msg.includes("duplicate")
      ) {
        return json(
          { error: "That email is already registered. Try signing in instead." },
          400,
        );
      }
      return json({ error: createError.message }, 400);
    }

    await admin.from("kk_profiles").upsert({
      id: newUser.user.id,
      email,
      name,
      role: "customer",
      branch_id: null,
      phone,
      loyalty_stamps: 0,
    });

    return json({
      ok: true,
      userId: newUser.user.id,
      needsEmailConfirmation: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign up failed";
    return json({ error: message }, 500);
  }
});
