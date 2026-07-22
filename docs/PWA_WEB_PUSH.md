# PWA Web Push — generalized implementation guide

This document explains how Kado Kohi implements **Web Push** for a Vite + React PWA so another project (or an AI agent) can reproduce the same pattern without Kado-specific assumptions.

Use this when you need: order alerts, payment reminders, staff “new order” buzzes, or any browser push that works after the tab is closed (installed PWA / supported mobile browsers).

---

## 1. Mental model (what must be true)

Web Push is three cooperating pieces:

| Layer | Responsibility |
|-------|----------------|
| **Browser / Service Worker** | Holds a `PushSubscription`, shows notifications, handles clicks |
| **App backend** | Stores subscriptions; signs and sends push messages with **VAPID** keys |
| **Product logic** | Decides *when* to notify and *who* (user id, role, branch, etc.) |

```
[User taps “Enable notifications”]
        → Notification.requestPermission()
        → pushManager.subscribe(applicationServerKey = VAPID public)
        → POST subscription {endpoint, p256dh, auth} → your DB

[Business event: order paid / status change]
        → Server looks up matching subscriptions
        → web-push library signs payload with VAPID private key
        → Push service (FCM / Mozilla / Apple) delivers to device
        → Service Worker `push` event → showNotification()
        → User clicks → SW opens/focuses your URL
```

**Hard constraints**

- HTTPS (or localhost) required.
- iOS Safari needs “Add to Home Screen” for reliable push; Android Chrome is the smoothest path.
- You cannot send push without a prior user gesture granting permission.
- Secret VAPID private key must **never** ship to the browser.

---

## 2. Keys (VAPID)

Generate once per project:

```bash
npx web-push generate-vapid-keys
```

Store:

| Key | Where |
|-----|--------|
| Public | Client env, e.g. `VITE_VAPID_PUBLIC_KEY` (safe to expose) |
| Private | Server / Edge Function secrets only (`VAPID_PRIVATE_KEY`) |
| Subject | `mailto:you@domain.com` or `https://your-domain` (`VAPID_SUBJECT`) |

Public client key and server public key must be the **same pair**.

---

## 3. Database: subscription store

Minimal schema (adapt names):

```sql
create table push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  role text,              -- optional targeting
  branch_id uuid,         -- optional targeting
  user_agent text,
  created_at timestamptz default now()
);

-- RLS: users upsert/delete only their own rows
```

**Why `endpoint` is the primary key:** the same browser can re-subscribe; upsert by endpoint avoids duplicates. Prune rows when send returns HTTP 404/410 (gone).

Optional companion table: in-app notification inbox (same event written for signed-in users even if push fails).

---

## 4. Service worker (receive + click)

Keep push handlers **dependency-free** in a static file imported by your PWA SW.

**Vite PWA (vite-plugin-pwa) pattern used here:**

```ts
// vite.config.ts
VitePWA({
  workbox: {
    importScripts: ['/push-sw.js'], // public/push-sw.js
  },
})
```

**`public/push-sw.js` responsibilities**

1. `push` — parse JSON payload `{ title, body, url, tag, icon? }` → `registration.showNotification(...)`.
2. `notificationclick` — close notification; focus an open client or `openWindow(url)`.
3. Use `tag` + `renotify` so status updates replace older alerts for the same order.

Do not put VAPID secrets in the SW.

---

## 5. Client subscribe flow

Idempotent steps (see `src/lib/push.ts` in this repo):

1. Feature-detect: `serviceWorker`, `PushManager`, `Notification`.
2. Require signed-in user if subscriptions are tied to `user_id` (recommended).
3. `Notification.requestPermission()` — only after a button tap.
4. `navigator.serviceWorker.ready` → `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.
5. Convert VAPID public key from URL-safe base64 → `Uint8Array`.
6. Persist `subscription.toJSON()` keys + endpoint to your API/DB.
7. Unsubscribe: delete DB row, then `subscription.unsubscribe()`.

UI helper pattern: a small hook (`usePushToggle`) that exposes `status: unsupported | denied | idle | subscribed`, `enable()`, `disable()`, and human-readable error reasons.

Surface enable CTAs on: install help page, account settings, checkout (payment reminders).

---

## 6. Server send flow (Edge Function / API)

This repo: `supabase/functions/kk-send-push`.

**Request body (generic contract)**

```json
{
  "targets": [
    { "userId": "uuid" },
    { "branchId": "uuid", "roles": ["barista", "staff"] },
    { "roles": ["admin"] }
  ],
  "title": "Ready for pickup",
  "body": "Order KK-1234 is ready.",
  "url": "/account/orders",
  "tag": "order-uuid",
  "kind": "order"
}
```

**Server steps**

1. Authenticate the caller (signed-in user JWT).  
   - Optional: allow this project’s **anon JWT** only for **staff fan-out** targets (no `userId`) so guest QR checkouts can alert baristas without a customer login. Never allow anon to push arbitrary users.
   - If the platform gateway enforces JWT (`verify_jwt: true`), guest anon calls get **401 before your code runs**. For this pattern, disable gateway JWT on the send function and enforce auth inside the function (user JWT **or** project anon JWT + staff-only targets).
2. Resolve subscriptions with OR semantics across targets; **dedupe by endpoint**.
3. Optionally insert inbox rows for each `userId`.
4. `webpush.setVapidDetails(subject, publicKey, privateKey)`.
5. `webpush.sendNotification(subscription, JSON.stringify(payload))` in parallel.
6. Delete endpoints that return 404/410.

**Library:** `web-push` (Node) or `npm:web-push` on Deno Deploy / Supabase Edge.

**Auth note:** Signed-in customers use their access token. Guest QR clients invoke with the anon key; the send function must recognize the project’s anon JWT and restrict targets to branch/role fan-out.

---

## 7. Product wiring (when to notify)

Keep copy and targeting in one module (this repo: `src/lib/notify.ts`):

| Event | Typical targets | Tag prefix |
|-------|-----------------|------------|
| New order | branch staff + admins | `new-order-` |
| Status change | customer `userId` | `order-` |
| Payment due | customer | `pay-` |
| Proof uploaded | staff + customer | `proof-` |

Call notify **after** the durable write succeeds (order placed / status updated). Treat push as **best-effort** — never fail checkout because push failed.

---

## 8. Checklist to port to another project

- [ ] Generate VAPID keys; put public in frontend env, private in server secrets.
- [ ] Create `push_subscriptions` table + RLS.
- [ ] Add `push-sw.js` + wire into PWA SW (`importScripts` or custom SW).
- [ ] Implement subscribe/unsubscribe UI behind a user gesture.
- [ ] Deploy send endpoint with VAPID + web-push.
- [ ] Map business events → `targets` + title/body/url/tag.
- [ ] Test: Chrome Android installed PWA; deny/allow paths; 410 prune; click opens correct deep link.
- [ ] Document env vars in `.env.example`.

---

## 9. Kado Kohi file map (concrete reference)

| Concern | Path |
|---------|------|
| Subscribe / status | `src/lib/push.ts` |
| DB + invoke send | `src/lib/supabase/repositories/push.ts` |
| UI toggle hook | `src/hooks/usePushToggle.ts` |
| Event copy + targeting | `src/lib/notify.ts` |
| Checkout prompt | `src/components/CheckoutPushPrompt.tsx` |
| Install / education | `src/pages/HelpInstall.tsx` |
| SW handlers | `public/push-sw.js` |
| Workbox import | `vite.config.ts` → `workbox.importScripts` |
| Send Edge Function | `supabase/functions/kk-send-push/index.ts` |
| Env template | `.env.example` (`VITE_VAPID_PUBLIC_KEY`, `VAPID_*`) |

---

## 10. Failure modes (debug quickly)

| Symptom | Likely cause |
|---------|----------------|
| Enable does nothing | Missing `VITE_VAPID_PUBLIC_KEY`, or SW not registered |
| `denied` | Browser site settings blocked notifications |
| Send returns 401 | Edge Function expects user JWT; guest used anon key only |
| Send `sent: 0` | No rows match targets (wrong `user_id` / `branch_id` / `role`) |
| No banner on device | Not installed on iOS; or SW `push` handler not imported |
| Click goes to `/` | Payload missing `url`; check SW `notificationclick` |

---

## 11. Security summary

- Private VAPID key = server only.
- Prefer user-scoped subscription writes (RLS).
- Authenticate send API; rate-limit if public.
- If allowing anon send for ops alerts, lock targets to staff/branch fan-out only.
- Prune dead endpoints to avoid leaking stale device metadata.

This pattern is stack-agnostic: replace Supabase with any Postgres + HTTPS API; replace vite-plugin-pwa with Workbox or a custom SW — the subscribe → store → VAPID send → SW display loop stays the same.
