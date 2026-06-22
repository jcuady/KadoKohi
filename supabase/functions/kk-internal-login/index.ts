import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { clerkClient } from "../_shared/clerkAuth.ts";
import { verifyTeamPassword } from "../_shared/teamPassword.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY") ?? "";

const INTERNAL_ROLES = ["admin", "barista", "staff"] as const;
type InternalRole = (typeof INTERNAL_ROLES)[number];

const recentByIp = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 30;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recentByIp.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recentByIp.set(ip, hits);
  return hits.length > MAX_PER_WINDOW;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (!CLERK_SECRET_KEY) {
    return json({ error: "Internal login is not configured." }, 503);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return json({ error: "Too many attempts. Please wait a few minutes." }, 429);
  }

  let body: { email?: string; password?: string; expectedRole?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const expectedRole = typeof body.expectedRole === "string" ? body.expectedRole : "";

  if (!email || !password) {
    return json({ error: "Email and password are required." }, 400);
  }
  if (!INTERNAL_ROLES.includes(expectedRole as InternalRole)) {
    return json({ error: "Select admin, barista, or staff before signing in." }, 400);
  }

  try {
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: profile } = await adminClient
      .from("kk_profiles")
      .select("id, role, clerk_user_id, team_password_hash")
      .eq("email", email)
      .maybeSingle();

    if (
      !profile ||
      !INTERNAL_ROLES.includes(profile.role as InternalRole) ||
      !profile.clerk_user_id ||
      !profile.team_password_hash
    ) {
      return json({ error: "Invalid email or password." }, 401);
    }

    const passwordOk = await verifyTeamPassword(password, profile.team_password_hash);
    if (!passwordOk) {
      return json({ error: "Invalid email or password." }, 401);
    }

    if (profile.role !== expectedRole) {
      return json({
        error: `This account is registered as ${profile.role}. Switch to the ${profile.role} tab.`,
      }, 403);
    }

    const clerk = clerkClient();
    const tokenRes = await clerk.signInTokens.createSignInToken({
      userId: profile.clerk_user_id,
      expiresInSeconds: 120,
    });

    if (!tokenRes.token) {
      return json({ error: "Could not complete sign-in. Please try again." }, 500);
    }

    return json({ ticket: tokenRes.token });
  } catch (err) {
    console.error("kk-internal-login failed:", err);
    return json({ error: "Invalid email or password." }, 401);
  }
});
