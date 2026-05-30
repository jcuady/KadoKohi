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

  if (action === "reset_all_data") {
    const { confirmPhrase } = body;
    if (confirmPhrase !== "RESET ALL DATA") {
      return new Response(
        JSON.stringify({ error: 'Type "RESET ALL DATA" to confirm.' }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const deleted = {
      orderItems: 0,
      orders: 0,
      auditLogs: 0,
      pushSubscriptions: 0,
      promoClaims: 0,
      promoCodes: 0,
      tables: 0,
      products: 0,
      menuCategories: 0,
      branches: 0,
      users: 0,
      settingsReset: false,
    };

    const countDelete = async (table: string) => {
      const { count, error } = await adminClient
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    };

    const deleteAll = async (table: string, column = "id", sentinel = "00000000-0000-0000-0000-000000000000") => {
      const { error } = await adminClient.from(table).delete().neq(column, sentinel);
      if (error) throw error;
    };

    try {
      deleted.orderItems = await countDelete("kk_order_items");
      await deleteAll("kk_order_items");

      deleted.orders = await countDelete("kk_orders");
      await deleteAll("kk_orders");

      deleted.auditLogs = await countDelete("kk_audit_logs");
      await deleteAll("kk_audit_logs");

      deleted.pushSubscriptions = await countDelete("kk_push_subscriptions");
      await deleteAll("kk_push_subscriptions", "endpoint", "__never__");

      deleted.promoClaims = await countDelete("kk_promo_claims");
      await deleteAll("kk_promo_claims");

      deleted.promoCodes = await countDelete("kk_promo_codes");
      await deleteAll("kk_promo_codes");

      deleted.tables = await countDelete("kk_tables");
      await deleteAll("kk_tables");

      deleted.products = await countDelete("kk_products");
      await deleteAll("kk_products");

      deleted.menuCategories = await countDelete("kk_menu_categories");
      await deleteAll("kk_menu_categories");

      deleted.branches = await countDelete("kk_branches");
      await deleteAll("kk_branches");

      const defaultSiteConfig = {
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
        contactHours: "Mon – Sun: 7 AM – 11 PM",
        mapsEmbedUrl:
          "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.6!2d121.1!3d14.65!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDM5JzAwLjAiTiAxMjHCsDA2JzAwLjAiRQ!5e0!3m2!1sen!2sph!4v1234567890",
        socialInstagram: "",
        socialFacebook: "",
        socialTiktok: "",
      };
      const { error: settingsErr } = await adminClient.from("kk_app_settings").upsert({
        id: true,
        tax_rate: 0,
        gcash_qr_image: null,
        order_hours: defaultSiteConfig,
      });
      if (settingsErr) throw settingsErr;
      deleted.settingsReset = true;

      const { data: nonAdminProfiles, error: profileErr } = await adminClient
        .from("kk_profiles")
        .select("id, email, role")
        .neq("role", "admin");
      if (profileErr) throw profileErr;

      for (const profile of nonAdminProfiles ?? []) {
        if (profile.id === user.id) continue;
        const { error: authDelErr } = await adminClient.auth.admin.deleteUser(profile.id);
        if (authDelErr) {
          console.warn(`auth delete failed for ${profile.id}:`, authDelErr.message);
        }
        await adminClient.from("kk_profiles").delete().eq("id", profile.id);
        deleted.users += 1;
      }

      await adminClient
        .from("kk_profiles")
        .update({ loyalty_stamps: 0, branch_id: null })
        .eq("role", "admin");

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
