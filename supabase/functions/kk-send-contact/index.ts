import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INBOUND_EMAIL = Deno.env.get("KADO_INBOUND_EMAIL") ?? "kadocoffeeph@gmail.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM =
  Deno.env.get("RESEND_FROM_EMAIL") ?? "Kado Kohi <hello@kadokohi.com>";

const recentByIp = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function isSoftRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recentByIp.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recentByIp.set(ip, hits);
  return hits.length > MAX_PER_WINDOW;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Body = {
  kind?: string;
  email?: string;
  name?: string;
  message?: string;
  purpose?: string;
  listingTitle?: string;
  phone?: string;
  referenceCode?: string;
  bookingKind?: string;
  eventName?: string;
  guestCount?: number;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  quotedTotal?: number;
  customMessage?: string;
  html?: string;
};

async function sendResend(params: {
  subject: string;
  html: string;
  replyTo?: string;
  to?: string[];
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, message: "Email service not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: params.to ?? [INBOUND_EMAIL],
      reply_to: params.replyTo ?? INBOUND_EMAIL,
      subject: params.subject,
      html: params.html,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data?.message === "string" ? data.message : `Resend ${res.status}`;
    return { ok: false, message: msg };
  }
  return { ok: true, id: String(data?.id ?? "") };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (isSoftRateLimited(ip)) {
    return json({ error: "Too many requests. Please try again later." }, 429);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const kind = String(body.kind ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Valid email is required" }, 400);
  }

  if (kind === "kado_circle") {
    const subject = "[Kado Kohi] Kado Circle — Request access";
    const html = `
      <p><strong>Kado Circle access request</strong> (via homepage)</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p>Reply to this address to invite them or follow up.</p>
    `;
    const sent = await sendResend({ subject, html, replyTo: email });
    if (!sent.ok) {
      return json({ error: sent.message, emailConfigured: false }, 503);
    }
    return json({ ok: true, id: sent.id });
  }

  if (kind === "contact") {
    const name = String(body.name ?? "").trim();
    const message = String(body.message ?? "").trim();
    const purpose = String(body.purpose ?? "general").trim();

    if (name.length < 2) return json({ error: "Name is required" }, 400);
    if (message.length < 10) return json({ error: "Message is required" }, 400);

    const subject = `[Kado Kohi] ${purpose} — ${name}`;
    const html = `
      <p><strong>Contact form</strong> (via /contact)</p>
      <p><strong>Purpose:</strong> ${escapeHtml(purpose)}</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Reply-to:</strong> ${escapeHtml(email)}</p>
      <hr />
      <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
    `;
    const sent = await sendResend({ subject, html, replyTo: email });
    if (!sent.ok) {
      return json({ error: sent.message, emailConfigured: false }, 503);
    }
    return json({ ok: true, id: sent.id });
  }

  if (kind === "career_application") {
    const name = String(body.name ?? "").trim();
    const message = String(body.message ?? "").trim();
    const listingTitle = String(body.listingTitle ?? "Role").trim();
    const phone = String(body.phone ?? "").trim();

    if (name.length < 2) return json({ error: "Name is required" }, 400);
    if (message.length < 5) return json({ error: "Application details are required" }, 400);

    const subject = `[Kado Kohi] Career application — ${listingTitle} — ${name}`;
    const html = `
      <p><strong>Career application</strong> (via /careers)</p>
      <p><strong>Role:</strong> ${escapeHtml(listingTitle)}</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <hr />
      <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
    `;
    const sent = await sendResend({ subject, html, replyTo: email });
    if (!sent.ok) {
      return json({ error: sent.message, emailConfigured: false }, 503);
    }
    return json({ ok: true, id: sent.id });
  }

  if (kind === "booth_proposal") {
    const name = String(body.name ?? "").trim();
    const referenceCode = String(body.referenceCode ?? "").trim();
    const bookingKind = String(body.bookingKind ?? "coffee-cart").trim();
    const phone = String(body.phone ?? "").trim();
    const eventName = String(body.eventName ?? "").trim();
    const guestCount = Number(body.guestCount ?? 0);
    const eventDate = String(body.eventDate ?? "").trim();
    const startTime = String(body.startTime ?? "").trim();
    const endTime = String(body.endTime ?? "").trim();
    const message = String(body.message ?? "").trim();
    const htmlOverride = String(body.html ?? "").trim();

    if (name.length < 2) return json({ error: "Name is required" }, 400);
    if (!referenceCode) return json({ error: "Reference code is required" }, 400);

    const subject = `[Kado Kohi] Booth proposal ${referenceCode} — ${name}`;
    const html = htmlOverride || `
      <p><strong>New booth proposal</strong> (${escapeHtml(bookingKind)})</p>
      <p><strong>Reference:</strong> ${escapeHtml(referenceCode)}</p>
      <p><strong>Contact:</strong> ${escapeHtml(name)} · ${escapeHtml(email)} · ${escapeHtml(phone)}</p>
      <p><strong>Event:</strong> ${escapeHtml(eventName)} · ${guestCount} guests</p>
      <p><strong>Date:</strong> ${escapeHtml(eventDate)} · ${escapeHtml(startTime)}–${escapeHtml(endTime)}</p>
      ${message ? `<p><strong>Notes:</strong><br />${escapeHtml(message).replace(/\n/g, "<br />")}</p>` : ""}
      <p>Review in Admin → Event Proposals.</p>
    `;
    const sent = await sendResend({ subject, html, replyTo: email });
    if (!sent.ok) {
      return json({ error: sent.message, emailConfigured: false }, 503);
    }
    return json({ ok: true, id: sent.id });
  }

  if (kind === "booth_quote") {
    const name = String(body.name ?? "").trim();
    const referenceCode = String(body.referenceCode ?? "").trim();
    const quotedTotal = Number(body.quotedTotal ?? 0);
    const htmlOverride = String(body.html ?? "").trim();

    if (name.length < 2) return json({ error: "Name is required" }, 400);
    if (!referenceCode) return json({ error: "Reference code is required" }, 400);
    if (!htmlOverride) return json({ error: "Email body is required" }, 400);

    const subject = `Your Kado Kohi event quote — ${referenceCode}`;
    const sent = await sendResend({
      subject,
      html: htmlOverride,
      replyTo: INBOUND_EMAIL,
      to: [email],
    });
    if (!sent.ok) {
      return json({ error: sent.message, emailConfigured: false }, 503);
    }
    return json({ ok: true, id: sent.id });
  }

  return json({ error: "Unknown kind" }, 400);
});
