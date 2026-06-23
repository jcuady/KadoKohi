import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const RESET_CONFIRM_PHRASE = "RESET ALL DATA";

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
  contactAddress: "J.P. Laurel St. Corner Mt. Everest, Marikina",
  contactHours: "Mon ? Sun: 7 AM ? 11 PM",
  mapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.6!2d121.1!3d14.65!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDM5JzAwLjAiTiAxMjHCsDA2JzAwLjAiRQ!5e0!3m2!1sen!2sph!4v1234567890",
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

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const callerToken = authHeader.replace("Bearer ", "");
  const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser(callerToken);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: profile } = await adminClient
    .from("kk_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return new Response(JSON.stringify({ error: "Admin role required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "create_user") {
    const { email, password, name, role, branchId } = body;
    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const allowedRoles = ["admin", "barista", "staff", "customer"] as const;
    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if ((role === "barista" || role === "staff") && !branchId) {
      return new Response(
        JSON.stringify({ error: "Branch is required for barista and staff accounts" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (role === "customer" && branchId) {
      return new Response(
        JSON.stringify({ error: "Customer accounts cannot be assigned to a branch here" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role, branch_id: branchId ?? null },
      });
    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    await adminClient.from("kk_profiles").upsert({
      id: newUser.user.id,
      email,
      name,
      role,
      branch_id: role === "admin" ? null : (branchId ?? null),
      loyalty_stamps: 0,
    });
    return new Response(JSON.stringify({ user: newUser.user }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "update_user") {
    const { userId, name, email, role, branchId } = body;
    if (!userId || typeof userId !== "string") {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!name || !email || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const allowedRoles = ["admin", "barista", "staff", "customer"] as const;
    if (!allowedRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if ((role === "barista" || role === "staff") && !branchId) {
      return new Response(JSON.stringify({ error: "Branch is required for barista and staff accounts" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: target, error: targetErr } = await adminClient
      .from("kk_profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();
    if (targetErr || !target) {
      return new Response(JSON.stringify({ error: targetErr?.message ?? "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (target.role === "admin" && role !== "admin") {
      const { count } = await adminClient
        .from("kk_profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) {
        return new Response(JSON.stringify({ error: "Cannot demote the last admin account." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
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
      return new Response(JSON.stringify({ error: profileErr.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error: authErr } = await adminClient.auth.admin.updateUserById(userId, {
      email: String(email).trim().toLowerCase(),
      user_metadata: { name: String(name).trim(), role, branch_id: resolvedBranchId },
    });
    if (authErr) {
      return new Response(JSON.stringify({ error: authErr.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, user: { id: userId } }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "delete_user") {
    const { userId } = body;
    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account while signed in." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { data: target, error: targetErr } = await adminClient
      .from("kk_profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();
    if (targetErr) {
      return new Response(JSON.stringify({ error: targetErr.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!target) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (target.role === "admin") {
      const { count, error: adminCountErr } = await adminClient
        .from("kk_profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if (adminCountErr) {
        return new Response(JSON.stringify({ error: adminCountErr.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if ((count ?? 0) <= 1) {
        return new Response(
          JSON.stringify({ error: "Cannot delete the last admin account." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    await adminClient.from("kk_push_subscriptions").delete().eq("user_id", userId);
    await adminClient.from("kk_event_registrations").delete().eq("customer_id", userId);

    const { error: authDeleteErr } = await adminClient.auth.admin.deleteUser(userId);
    if (authDeleteErr) {
      return new Response(JSON.stringify({ error: authDeleteErr.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await adminClient.from("kk_profiles").delete().eq("id", userId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "reset_password") {
    const { userId, newPassword } = body;
    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Missing userId or newPassword" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const { error: resetError } =
      await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
    if (resetError) {
      return new Response(JSON.stringify({ error: resetError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "send_password_reset") {
    const { userId } = body;
    if (!userId || typeof userId !== "string") {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { data: target } = await adminClient
      .from("kk_profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();
    if (!target?.email) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.kadokohi.com";
    const redirectTo = `${siteUrl.replace(/\/$/, "")}/auth/reset-password`;
    const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(target.email, {
      redirectTo,
    });
    if (resetErr) {
      return new Response(JSON.stringify({ error: resetErr.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "list_users") {
    const {
      data: { users },
      error: listError,
    } = await adminClient.auth.admin.listUsers();
    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { data: profiles } = await adminClient
      .from("kk_profiles")
      .select("*");
    return new Response(JSON.stringify({ users, profiles }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "reset_all_data") {
    const { confirmPhrase } = body;
    if (confirmPhrase !== RESET_CONFIRM_PHRASE) {
      return new Response(
        JSON.stringify({ error: `Type "${RESET_CONFIRM_PHRASE}" to confirm.` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
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

      for (const profile of nonAdminProfiles ?? []) {
        if (profile.id === user.id) continue;
        await adminClient.auth.admin.deleteUser(profile.id).catch((err) => {
          console.warn(`auth delete failed for ${profile.id}:`, err.message);
        });
        await adminClient.from("kk_profiles").delete().eq("id", profile.id);
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

      return new Response(JSON.stringify({ success: true, deleted }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reset failed.";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
});
