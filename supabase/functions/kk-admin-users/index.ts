import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
      branch_id: branchId ?? null,
      loyalty_stamps: 0,
    });
    return new Response(JSON.stringify({ user: newUser.user }), {
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

  if (action === "reset_operational_data") {
    const { data: rpcData, error: rpcError } = await adminClient.rpc(
      "kk_reset_operational_data",
    );

    if (rpcError) {
      const code = rpcError.message ?? "";
      if (code.includes("STORE_OPEN")) {
        return new Response(
          JSON.stringify({
            error:
              "Reset is only allowed when the store is closed for online orders (outside open hours and after last order time).",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }
      if (code.includes("STORE_HOURS_INVALID")) {
        return new Response(
          JSON.stringify({
            error:
              "Store hours are misconfigured. Fix open/close times in Settings before resetting.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    const { data: adminProfiles } = await adminClient
      .from("kk_profiles")
      .select("id")
      .eq("role", "admin");
    const adminIds = new Set((adminProfiles ?? []).map((p) => p.id));

    let authDeleted = 0;
    for (const u of users ?? []) {
      if (adminIds.has(u.id)) continue;
      const { error: delErr } = await adminClient.auth.admin.deleteUser(u.id);
      if (!delErr) authDeleted += 1;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        deletedProfiles: rpcData?.deletedProfiles ?? 0,
        deletedAuthUsers: authDeleted,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
});
