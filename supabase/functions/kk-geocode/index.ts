import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { userIdFromBearer } from "../_shared/supabaseAuth.ts";

/**
 * Server-side Nominatim proxy — browsers cannot call nominatim.openstreetmap.org
 * (no Access-Control-Allow-Origin). Admin Branches geocode uses this instead.
 *
 * Auth: signed-in user JWT required (admin portal).
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOMINATIM = "https://nominatim.openstreetmap.org";
const PH_VIEWBOX = "116.0,4.5,127.0,21.5";
const UA = "KadoKohiAdmin/1.0 (kk-geocode; https://www.kadokohi.com; hello@kadokohi.com)";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function nominatimGet(pathAndQuery: string): Promise<Response> {
  return fetch(`${NOMINATIM}${pathAndQuery}`, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": UA,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, message: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, message: "Server misconfigured" }, 503);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const userId = await userIdFromBearer(admin, req.headers.get("Authorization"));
  if (!userId) return json({ ok: false, message: "Sign in to search locations." }, 401);

  let body: {
    mode?: string;
    q?: string;
    lat?: number | string;
    lng?: number | string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: "Invalid JSON body." }, 400);
  }

  const mode = body.mode === "reverse" ? "reverse" : "search";

  if (mode === "search") {
    const q = typeof body.q === "string" ? body.q.trim() : "";
    if (q.length < 2) return json({ ok: true, results: [] });

    const params = new URLSearchParams({
      q,
      format: "json",
      addressdetails: "1",
      countrycodes: "ph",
      limit: "12",
      viewbox: PH_VIEWBOX,
      bounded: "0",
    });
    const res = await nominatimGet(`/search?${params}`);
    if (!res.ok) {
      console.error("nominatim search failed", res.status);
      return json({ ok: false, message: "Location search is temporarily unavailable." }, 502);
    }
    const results = await res.json();
    return json({ ok: true, results: Array.isArray(results) ? results : [] });
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return json({ ok: false, message: "lat and lng are required for reverse geocode." }, 400);
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    addressdetails: "1",
    zoom: "18",
  });
  const res = await nominatimGet(`/reverse?${params}`);
  if (!res.ok) {
    console.error("nominatim reverse failed", res.status);
    return json({ ok: false, message: "Location lookup is temporarily unavailable." }, 502);
  }
  const result = await res.json();
  return json({ ok: true, result });
});
