import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

/** Resolve auth.users.id from a Supabase session JWT (Authorization: Bearer …). */
export async function userIdFromBearer(
  admin: SupabaseClient,
  authHeader: string | null,
): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}
