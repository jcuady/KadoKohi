import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const RESET_CONFIRM_PHRASE = "RESET ALL DATA";

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

const DEFAULT_SITE_CONFIG = {
  defaultOpenTime: "07:00",
  defaultCloseTime: "23:00",
  brandMode: "light",
  shopName: "Kado Kohi",
  currency: "PHP",
  boothContactPhone: "+63 917 123 4567",
  boothContactName: "Kado Kohi Events",
  contactEmail: "kadocoffeeph@gmail.com",
  contactPhone: "+63 920 948 2934",
  contactAddress: "J.P. Laurel St. corner Mt. Everest, Marikina City, Philippines 1807",
  contactHours: "Mon – Sun: 7 AM – 11 PM",
  mapsEmbedUrl:
    "https://maps.google.com/maps?q=Kado%20Coffee%2C%20J.P.%20Laurel%20St.%20corner%20Mt.%20Everest%2C%20Marikina%20City%2C%20Philippines%201807&hl=en&z=18&iwloc=near&output=embed",
  socialInstagram: "",
  socialFacebook: "",
  socialTiktok: "",
};

/** Tables wiped on reset ? order respects foreign keys (children before parents). */
const RESET_DELETE_TABLES: Array<{ table: string; column?: string; sentinel?: string }> = [
  { table: "kk_order_items" },
  { table: "kk_orders" },
  { table: "kk_audit_logs" },
  { table: "kk_push_subscriptions", column: "endpoint", sentinel: "__never__" },
  { table: "kk_promo_claims" },
  { table: "kk_promo_codes" },
  { table: "kk_tables" },
  { table: "kk_products" },
  { table: "kk_menu_categories" },
  { table: "kk_branches" },
];

async function detachUserReferences(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
) {
  await adminClient.from("kk_push_subscriptions").delete().eq("user_id", userId);
  await adminClient.from("kk_event_registrations").delete().eq("customer_id", userId);
  await adminClient.from("kk_orders").update({ customer_id: null }).eq("customer_id", userId);
  await adminClient.from("kk_booth_bookings").update({ customer_id: null }).eq("customer_id", userId);
  await adminClient
    .from("kk_booth_bookings")
    .update({ assigned_staff_id: null })
    .eq("assigned_staff_id", userId);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Missing authorization" }, 401);
  }

  const callerToken = authHeader.replace("Bearer ", "");
  const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser(callerToken);
  if (userError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: profile } = await adminClient
    .from("kk_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return json({ error: "Admin role required" }, 403);
  }

  const body = await req.json();
  const { action } = body;

  if (action === "create_user") {
    const { email, password, name, role, branchId } = body;
    if (!email || !password || !name || !role) {
      return json({ error: "Missing required fields" }, 400);
    }
    if (password.length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }
    const allowedRoles = ["admin", "barista", "staff", "customer"] as const;
    if (!allowedRoles.includes(role)) {
      return json({ error: "Invalid role" }, 400);
    }
    if ((role === "barista" || role === "staff") && !branchId) {
      return json({ error: "Branch is required for barista and staff accounts" }, 400);
    }
    if (role === "customer" && branchId) {
      return json({ error: "Customer accounts cannot be assigned to a branch here" }, 400);
    }
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role, branch_id: branchId ?? null },
      });
    if (createError) {
      return json({ error: createError.message }, 400);
    }
    await adminClient.from("kk_profiles").upsert({
      id: newUser.user.id,
      email,
      name,
      role,
      branch_id: role === "admin" ? null : (branchId ?? null),
      loyalty_stamps: 0,
    });
    return json({ user: newUser.user });
  }

  if (action === "update_user") {
    const { userId, name, email, role, branchId } = body;
    if (!userId || typeof userId !== "string") {
      return json({ error: "Missing userId" }, 400);
    }
    if (!name || !email || !role) {
      return json({ error: "Missing required fields" }, 400);
    }
    const allowedRoles = ["admin", "barista", "staff", "customer"] as const;
    if (!allowedRoles.includes(role)) {
      return json({ error: "Invalid role" }, 400);
    }
    if ((role === "barista" || role === "staff") && !branchId) {
      return json({ error: "Branch is required for barista and staff accounts" }, 400);
    }

    const { data: target, error: targetErr } = await adminClient
      .from("kk_profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();
    if (targetErr || !target) {
      return json({ error: targetErr?.message ?? "User not found" }, 404);
    }

    if (target.role === "admin" && role !== "admin") {
      const { count } = await adminClient
        .from("kk_profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) {
        return json({ error: "Cannot demote the last admin account." }, 400);
      }
    }

    const resolvedBranchId = role === "admin" || role === "customer" ? null : String(branchId);
    const { error: profileErr } = await adminClient
      .from("kk_profiles")
      .update({
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        role,
        branch_id: resolvedBranchId,
      })
      .eq("id", userId);
    if (profileErr) {
      return json({ error: profileErr.message }, 400);
    }

    const { error: authErr } = await adminClient.auth.admin.updateUserById(userId, {
      email: String(email).trim().toLowerCase(),
      user_metadata: { name: String(name).trim(), role, branch_id: resolvedBranchId },
    });
    if (authErr) {
      return json({ error: authErr.message }, 400);
    }

    return json({ success: true, user: { id: userId } });
  }

  if (action === "delete_user") {
    const { userId } = body;
    if (!userId || typeof userId !== "string") {
      return json({ error: "Missing userId" }, 400);
    }
    if (userId === user.id) {
      return json({ error: "You cannot delete your own account while signed in." }, 400);
    }

    const { data: target, error: targetErr } = await adminClient
      .from("kk_profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();
    if (targetErr) {
      return json({ error: targetErr.message }, 400);
    }
    if (!target) {
      return json({ error: "User not found" }, 404);
    }

    if (target.role === "admin") {
      const { count, error: adminCountErr } = await adminClient
        .from("kk_profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if (adminCountErr) {
        return json({ error: adminCountErr.message }, 400);
      }
      if ((count ?? 0) <= 1) {
        return json({ error: "Cannot delete the last admin account." }, 400);
      }
    }

    await detachUserReferences(adminClient, userId);

    const { error: authDeleteErr } = await adminClient.auth.admin.deleteUser(userId);
    if (authDeleteErr) {
      return json({ error: authDeleteErr.message }, 400);
    }

    await adminClient.from("kk_profiles").delete().eq("id", userId);

    return json({ success: true });
  }

  if (action === "reset_password") {
    const { userId, newPassword } = body;
    if (!userId || !newPassword) {
      return json({ error: "Missing userId or newPassword" }, 400);
    }
    if (newPassword.length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }
    const { error: resetError } =
      await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
    if (resetError) {
      return json({ error: resetError.message }, 400);
    }
    return json({ success: true });
  }

  if (action === "send_password_reset") {
    const { userId } = body;
    if (!userId || typeof userId !== "string") {
      return json({ error: "Missing userId" }, 400);
    }
    const { data: target } = await adminClient
      .from("kk_profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();
    if (!target?.email) {
      return json({ error: "User not found" }, 404);
    }
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.kadokohi.com";
    const redirectTo = `${siteUrl.replace(/\/$/, "")}/auth/reset-password`;
    const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(target.email, {
      redirectTo,
    });
    if (resetErr) {
      return json({ error: resetErr.message }, 400);
    }
    return json({ success: true });
  }

  if (action === "list_users") {
    const {
      data: { users },
      error: listError,
    } = await adminClient.auth.admin.listUsers();
    if (listError) {
      return json({ error: listError.message }, 400);
    }
    const { data: profiles } = await adminClient
      .from("kk_profiles")
      .select("*");
    return json({ users, profiles });
  }

  if (action === "reset_all_data") {
    const { confirmPhrase } = body;
    if (confirmPhrase !== RESET_CONFIRM_PHRASE) {
      return json({ error: `Type "${RESET_CONFIRM_PHRASE}" to confirm.` }, 400);
    }

    const deleted: Record<string, number | boolean> = {
      settingsReset: false,
      adminsPreserved: 0,
      usersRemoved: 0,
    };

    const countRows = async (table: string) => {
      const { count, error } = await adminClient
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    };

    const deleteAllRows = async (
      table: string,
      column = "id",
      sentinel = "00000000-0000-0000-0000-000000000000",
    ) => {
      const { error } = await adminClient.from(table).delete().neq(column, sentinel);
      if (error) throw error;
    };

    try {
      for (const { table, column, sentinel } of RESET_DELETE_TABLES) {
        deleted[table] = await countRows(table);
        await deleteAllRows(table, column, sentinel);
      }

      const { error: settingsErr } = await adminClient.from("kk_app_settings").upsert({
        id: true,
        tax_rate: 0,
        gcash_qr_image: null,
        order_hours: DEFAULT_SITE_CONFIG,
      });
      if (settingsErr) throw settingsErr;
      deleted.settingsReset = true;

      const { data: nonAdminProfiles, error: profileErr } = await adminClient
        .from("kk_profiles")
        .select("id")
        .neq("role", "admin");
      if (profileErr) throw profileErr;

      for (const profileRow of nonAdminProfiles ?? []) {
        if (profileRow.id === user.id) continue;
        await detachUserReferences(adminClient, profileRow.id);
        await adminClient.auth.admin.deleteUser(profileRow.id).catch((err) => {
          console.warn(`auth delete failed for ${profileRow.id}:`, err.message);
        });
        await adminClient.from("kk_profiles").delete().eq("id", profileRow.id);
        deleted.usersRemoved = (deleted.usersRemoved as number) + 1;
      }

      const { data: adminProfiles, error: adminErr } = await adminClient
        .from("kk_profiles")
        .select("id")
        .eq("role", "admin");
      if (adminErr) throw adminErr;

      await adminClient
        .from("kk_profiles")
        .update({ loyalty_stamps: 0, branch_id: null })
        .eq("role", "admin");
      deleted.adminsPreserved = adminProfiles?.length ?? 0;

      return json({ success: true, deleted });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reset failed.";
      return json({ error: message }, 500);
    }
  }

  return json({ error: "Unknown action" }, 400);
});
