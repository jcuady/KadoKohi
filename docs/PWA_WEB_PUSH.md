# PWA Web Push — implementation guide + Kado QA checklist

This document explains how Kado Kohi implements **Web Push** for a Vite + React PWA so another project (or an AI agent) can reproduce the same pattern, and includes the **Kado product matrix** used for QA.

Use this when you need: order alerts, payment reminders, staff “new order” buzzes, booth/event alerts, or any browser push that works after the tab is closed (installed PWA / supported mobile browsers).

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
- Guests without a `customerId` never receive **customer** pushes (staff fan-out still works).

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

Kado table: `kk_push_subscriptions` (endpoint unique; indexes on `user_id`, `branch_id`).

Companion inbox: `kk_customer_notifications` (written by `kk-send-push` for every `userId` target).

```sql
-- Conceptual shape (see migrations for exact DDL)
create table kk_push_subscriptions (
  endpoint text unique not null,
  user_id uuid,
  p256dh text not null,
  auth text not null,
  role text,
  branch_id text,
  user_agent text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

**Why `endpoint` is unique:** the same browser can re-subscribe; upsert by endpoint avoids duplicates. Prune rows when send returns HTTP 404/410 (gone).

**Targeting rules**

| Target field | Matches |
|--------------|---------|
| `userId` | `user_id = …` |
| `branchId` + `roles` | `branch_id = …` AND `role IN (…)`` |
| `roles` only | `role IN (…)` (admins often have `branch_id` null) |

Staff/barista must enable push **while signed in** so `role` + `branch_id` are stored. After a branch transfer, re-enable push (or update the row) or branch-scoped alerts miss them.

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
4. Stronger vibrate / `requireInteraction` for `new-order-*` and `proof-*` tags.

Do not put VAPID secrets in the SW.

---

## 5. Client subscribe flow

Idempotent steps (see `src/lib/push.ts`):

1. Feature-detect: `serviceWorker`, `PushManager`, `Notification`.
2. Require signed-in user (subscriptions tied to `user_id`).
3. `Notification.requestPermission()` — only after a button tap.
4. `navigator.serviceWorker.ready` → `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.
5. Persist endpoint + keys + **role** + **branchId** via `pushRepo.saveSubscription`.
6. Unsubscribe: delete DB row, then `subscription.unsubscribe()`.

UI: `usePushToggle` + sidebar **Push alerts** (admin/barista/staff), account profile, checkout prompt, Help Install.

---

## 6. Server send flow (`kk-send-push`)

**Gateway:** `verify_jwt = false` — auth is enforced **inside** the function.

**Allowed callers**

| Caller | Allowed targets |
|--------|-----------------|
| Signed-in user JWT | Any targets the product sends |
| Project **anon** JWT | Staff/branch fan-out only — **no** `userId` |
| **Service role** JWT | Any (PayMongo webhook/verify → customer paid) |

**Request body**

```json
{
  "targets": [
    { "userId": "uuid" },
    { "branchId": "branch_marikina", "roles": ["barista", "staff"] },
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

1. Authenticate (user / anon+staff-only / service role).
2. Resolve subscriptions; **dedupe by endpoint**.
3. Insert inbox rows for each `userId` (`kind`: order | payment | marketing | system).
4. `webpush.sendNotification` in parallel; prune 404/410.

Client invoke: `src/lib/supabase/repositories/push.ts` → `pushRepo.send` (best-effort).  
Server invoke: `supabase/functions/_shared/orderPushNotify.ts` → `invokeSendPush`.

---

## 7. Product wiring (`src/lib/notify.ts`)

Copy + targets live in one module. Call **after** durable writes succeed. Push is **best-effort**.

### 7.1 Order notify family

| Family | When | Copy tone | Staff deep link |
|--------|------|-----------|-----------------|
| `merch` | `channel === 'merch'` or all lines `itemType === 'merch'` | Packing / pickup | `/staff/merch` |
| `food` | Coffee, pastries, mix-match, dine-in, takeout, online drinks | Preparing / counter (no “brewing”) | `/barista` |

Pastries are **not** a separate order channel — they ride `online` / dine-in / takeout as food items and use **food** copy.

### 7.2 Customer order status matrix

Requires `customerId`. Triggered from `orderStore` on place / status / payment / proof.

| Status | Customer push | Notes |
|--------|---------------|-------|
| `pending` | Yes (if no unpaid gateway reminder path) | Place order |
| Unpaid PayMongo/GCash | `notifyCustomerPendingPayment` | Instead of / before status when awaiting pay |
| `accepted` | Yes | Also from PayMongo webhook/verify when newly paid |
| `preparing` | Yes | Food vs merch copy |
| `ready` | Yes | |
| `served` | Yes | |
| `completed` | Yes | Mentions stamps when awarded |
| `cancelled` | Yes | |

### 7.3 Staff order alerts

| Event | Targets | URL |
|-------|---------|-----|
| New order (all channels incl. merch/POS) | branch barista+staff + admins | merch → `/staff/merch`, else `/barista` |
| GCash proof (account or guest QR) | same | same |

Guest QR proof: `GuestOrderPaymentBlock` → staff only (no customer id).

### 7.4 PayMongo paid (server)

| Path | When | Who |
|------|------|-----|
| `kk-paymongo-webhook` | First transition to paid | Customer (`userId`) if present |
| `kk-paymongo-verify` | First transition to paid | Same |

Uses service role → `kk-send-push`. Skips if `alreadyPaid` to avoid duplicates.

### 7.5 Booth / event bookings

| Event | Customer | Staff/admin |
|-------|----------|-------------|
| Proposal created | `submitted` (if `customerId`) | New booking → `/staff/booth-bookings` |
| Status → under_review / quoted / awaiting_confirmation / confirmed / declined / cancelled / completed | Yes | — |
| Final quote sets status | Yes (if status changed) | — |
| Payment proof uploaded | — | Booth proof → `/staff/booth-bookings` |
| Mark paid → confirmed | Via status notify | — |

Guest booth proposals without `customerId`: staff only.

### 7.6 Event page registrations (`EventSignupModal`)

| Who | Push |
|-----|------|
| Customer (signed-in) | “You're registered” → `/events` |
| Admin | “New event registration” → `/admin/events` |

Staff are **not** targeted (no staff events console / RoleGate).

---

## 8. Kado QA checklist (principal)

### 8.1 Environment & infra

- [ ] `VITE_VAPID_PUBLIC_KEY` on Vercel production matches Edge `VAPID_PUBLIC_KEY`.
- [ ] Edge secrets: `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] `kk-send-push` deployed; gateway JWT off; custom auth in function.
- [ ] `kk-paymongo-webhook` / `kk-paymongo-verify` deployed with `orderPushNotify`.
- [ ] SW: production loads `push-sw.js` (Workbox `importScripts`).
- [ ] `kk_push_subscriptions` RLS: users manage own rows; indexes on user/branch.

### 8.2 Enable path (all roles)

- [ ] Customer: Account / checkout / Help Install → enable → row appears with `role=customer`.
- [ ] Admin: sidebar Push alerts → `role=admin`, `branch_id` null.
- [ ] Barista/staff: enable at branch → `role` + matching `branch_id`.
- [ ] Denied / unsupported states show clear copy (not a silent no-op).

### 8.3 Customer orders (coffee / pastries / mix-match)

- [ ] Place unpaid PayMongo/GCash → pending-payment push + checkout URL.
- [ ] Place paid / pay-at-store → order-received (or accepted) push.
- [ ] Staff advances: accepted → preparing → ready → served → completed; each fires customer push with food copy (no “brew”).
- [ ] Cancel → customer cancelled push.
- [ ] Completed with stamps → body mentions stamp count.
- [ ] Inbox row appears in account notifications for each `userId` send.

### 8.4 Merch

- [ ] Merch-only cart places as `channel=merch` → staff “New merch order” → `/staff/merch`.
- [ ] Customer status copy uses packing / merch pickup language.
- [ ] Proof + payment paths same as other online orders.

### 8.5 Guest QR (dine-in / takeout)

- [ ] Place order → staff new-order fan-out (anon JWT allowed).
- [ ] Anon + `userId` target → **403**.
- [ ] GCash proof → staff proof alert; no customer push without account.

### 8.6 PayMongo

- [ ] Pay on hosted checkout → webhook marks paid → customer “Order confirmed” (signed-in).
- [ ] Return URL verify path also notifies only on first paid transition.
- [ ] Guest PayMongo: staff already alerted on place; no customer push (no `customerId`).

### 8.7 Booth bookings

- [ ] Signed-in customer submits proposal → customer “proposal received” + staff/admin new booking.
- [ ] Admin quotes / confirms / declines → customer status pushes → `/account/booth`.
- [ ] Customer uploads proof → staff proof push → `/staff/booth-bookings` (admin can open staff route).

### 8.8 Event registrations

- [ ] Signed-in customer registers → customer + admin pushes.
- [ ] Deep link `/admin/events` works for admin.

### 8.9 Negative / regression

- [ ] `sent: 0` when no matching subscriptions (function still 200).
- [ ] Dead endpoints pruned on 410.
- [ ] Checkout/order flows succeed if push fails.
- [ ] Unit tests: `npx vitest run src/lib/notify.test.ts`.

### 8.10 Manual device smoke

- [ ] Chrome Android installed PWA: receive + click deep link.
- [ ] Desktop Chrome: receive while tab backgrounded.
- [ ] iOS: only after Add to Home Screen (document limitation to stakeholders).

---

## 9. Checklist to port to another project

- [ ] Generate VAPID keys; put public in frontend env, private in server secrets.
- [ ] Create `push_subscriptions` table + RLS + indexes.
- [ ] Add `push-sw.js` + wire into PWA SW (`importScripts` or custom SW).
- [ ] Implement subscribe/unsubscribe UI behind a user gesture; store role/branch.
- [ ] Deploy send endpoint with VAPID + web-push + explicit auth matrix.
- [ ] Map business events → `targets` + title/body/url/tag; keep deep links RoleGate-safe.
- [ ] Server-side paid/webhook paths must notify (do not rely on client alone).
- [ ] Test: Chrome Android PWA; deny/allow; 410 prune; click opens correct deep link.
- [ ] Document env vars in `.env.example`.

---

## 10. Kado file map

| Concern | Path |
|---------|------|
| Subscribe / status | `src/lib/push.ts` |
| DB + invoke send | `src/lib/supabase/repositories/push.ts` |
| UI toggle hook | `src/hooks/usePushToggle.ts` |
| Product copy + targeting | `src/lib/notify.ts` |
| Payload unit tests | `src/lib/notify.test.ts` |
| Order wiring | `src/store/orderStore.ts` |
| Booth wiring | `src/store/boothBookingStore.ts` |
| Event signup wiring | `src/components/events/EventSignupModal.tsx` |
| Guest proof staff alert | `src/components/qr/GuestOrderPaymentBlock.tsx` |
| Checkout prompt | `src/components/CheckoutPushPrompt.tsx` |
| Install / education | `src/pages/HelpInstall.tsx` |
| SW handlers | `public/push-sw.js` |
| Workbox import | `vite.config.ts` → `workbox.importScripts` |
| Send Edge Function | `supabase/functions/kk-send-push/index.ts` |
| PayMongo → push | `supabase/functions/_shared/orderPushNotify.ts` |
| Env template | `.env.example` (`VITE_VAPID_PUBLIC_KEY`, `VAPID_*`) |

---

## 11. Failure modes (debug quickly)

| Symptom | Likely cause |
|---------|----------------|
| Enable does nothing | Missing `VITE_VAPID_PUBLIC_KEY`, or SW not registered |
| `denied` | Browser site settings blocked notifications |
| Send returns 401 | Missing/invalid Authorization; not user/anon/service |
| Send returns 403 | Anon tried `userId` target |
| Send `sent: 0` | No rows match targets (wrong `user_id` / `branch_id` / `role`) |
| Staff miss branch orders | Subscription missing `branch_id` or stale after transfer |
| No banner on device | Not installed on iOS; or SW `push` handler not imported |
| Click goes to `/` | Payload missing `url`; check SW `notificationclick` |
| Click hits RoleGate | Deep link for wrong role (e.g. staff → `/admin/...`) |
| Paid but no customer push | Guest order (no `customerId`) or webhook not deployed |

---

## 12. Security summary

- Private VAPID key = server only.
- Prefer user-scoped subscription writes (RLS).
- Authenticate send API; anon locked to staff/branch fan-out.
- Service role only from trusted Edge Functions (webhook/verify).
- Prune dead endpoints to avoid leaking stale device metadata.

This pattern is stack-agnostic: replace Supabase with any Postgres + HTTPS API; replace vite-plugin-pwa with Workbox or a custom SW — the subscribe → store → VAPID send → SW display loop stays the same.
