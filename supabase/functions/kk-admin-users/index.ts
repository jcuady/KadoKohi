import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const VALID_RESET_SCOPES: Record<string, string> = {
  all: "RESET ALL DATA",
  transactional: "RESET TRANSACTIONAL DATA",
  orders: "RESET ORDERS",
  bookings: "RESET BOOKINGS",
  loyalty_activity: "RESET LOYALTY",
  customers: "RESET CUSTOMERS",
};

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

  // Legacy alias — forward to reset_scope
  if (action === "reset_all_data") {
    body.action = "reset_scope";
    body.scope = "all";
  }

  if (action === "reset_scope" || body.action === "reset_scope") {
    const scope: string = body.scope ?? "all";
    const confirmPhrase: string = body.confirmPhrase ?? "";

    const expectedPhrase = VALID_RESET_SCOPES[scope];
    if (!expectedPhrase) {
      return json({ error: `Unknown reset scope: ${scope}` }, 400);
    }
    if (confirmPhrase !== expectedPhrase) {
      return json({ error: `Type "${expectedPhrase}" to confirm.` }, 400);
    }

    try {
      // Scopes that delete non-admin users need auth.users cleanup beforehand.
      // Collect non-admin user IDs so we can delete them from auth after the RPC.
      let usersRemoved = 0;
      const deletesUsers = ["all", "transactional", "customers"].includes(scope);

      if (deletesUsers) {
        const { data: nonAdminProfiles } = await adminClient
          .from("kk_profiles")
          .select("id")
          .neq("role", "admin");

        for (const row of nonAdminProfiles ?? []) {
          if (row.id === user.id) continue;
          await adminClient.auth.admin.deleteUser(row.id).catch((err: Error) => {
            console.warn(`auth delete failed for ${row.id}:`, err.message);
          });
          usersRemoved++;
        }
      }

      // Call the atomic RPC — handles all table deletes in one transaction
      const { data: rpcResult, error: rpcErr } = await adminClient.rpc(
        "kk_admin_reset_data",
        { p_scope: scope, p_confirm_phrase: confirmPhrase },
      );
      if (rpcErr) throw rpcErr;

      const result = (rpcResult as Record<string, unknown>) ?? {};
      if (deletesUsers) {
        result.usersRemoved = usersRemoved;
      }

      return json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reset failed.";
      return json({ error: message }, 500);
    }
  }

  return json({ error: "Unknown action" }, 400);
});
