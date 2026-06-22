import { createClerkClient, verifyToken } from "npm:@clerk/backend@1.21.0";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

export type VerifiedClerkCaller = {
  clerkUserId: string;
  email?: string;
};

export async function verifyClerkBearer(authHeader: string | null): Promise<VerifiedClerkCaller | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const secretKey = Deno.env.get("CLERK_SECRET_KEY");
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not configured");

  try {
    const payload = await verifyToken(token, { secretKey });
    return {
      clerkUserId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

export async function profileForClerkUser(
  admin: SupabaseClient,
  clerkUserId: string,
): Promise<{ id: string; role: string } | null> {
  const { data } = await admin
    .from("kk_profiles")
    .select("id, role")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  return data ?? null;
}

export async function requireAdminCaller(
  admin: SupabaseClient,
  authHeader: string | null,
): Promise<{ profileId: string; clerkUserId: string } | null> {
  const caller = await verifyClerkBearer(authHeader);
  if (!caller) return null;
  const profile = await profileForClerkUser(admin, caller.clerkUserId);
  if (!profile || profile.role !== "admin") return null;
  return { profileId: profile.id, clerkUserId: caller.clerkUserId };
}

export function clerkClient() {
  const secretKey = Deno.env.get("CLERK_SECRET_KEY");
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not configured");
  return createClerkClient({ secretKey });
}
