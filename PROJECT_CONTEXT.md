# Kado Kohi — Full Project Context (AI Reference)

> **Purpose:** Single source of truth for AI agents working on this codebase. Read this file first before implementing features, debugging flows, or answering architecture questions.
>
> **Last synced with codebase:** June 2026  
> **Ground truth priority:** `src/App.tsx` → `src/types/domain.ts` → `supabase/migrations/` → git log → this file.  
> **Stale docs:** `PROJECT_PLAN.md`, `README.md`, and `BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md` §3 were written during earlier phases (mock Zustand-only). The live app uses **Supabase production auth, Postgres, Storage, Realtime, and Edge Functions**.

---

## 1. What This Project Is

Kado Kohi is a **multi-role specialty coffee platform** for a Philippine café brand (**Marikina** and **Greenhills Mall** branches active in production). It is **not** a simple landing page — it is a full-stack operations suite:

| Surface | URL prefix | Who uses it |
|---------|------------|-------------|
| Public marketing + commerce | `/`, `/menu`, `/merch`, `/events`, `/book/booth` | Guests and customers |
| Customer account | `/account/*` | Logged-in customers |
| Internal login (hidden) | `/management-portal` | Admin, barista, staff |
| Admin SaaS | `/admin/*` | Owner / super-admin |
| Barista kiosk | `/barista/*`, `/barista/kiosk` | In-store baristas |
| Staff portal | `/staff/*` | Merch + booth fulfillment staff |
| Standalone QR ordering | `/order/qr/:code`, `/order/takeout` | Guests at table or counter (no marketing nav) |

**Business identity:** Japanese-inspired urban "tambayan" — premium craft coffee + community.  
**Production domain:** `kadokohi.com` (canonical QR URLs). Legacy: `kado-kohi.vercel.app`.  
**Default contact:** `kadocoffeeph@gmail.com` (admin-configurable in settings).

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 6, React Router 7 |
| Styling | Tailwind CSS v4 (`@theme` tokens: `kado-cream`, `kado-red`, `kado-dark`, `kado-offwhite`) |
| Animation | `motion/react`, GSAP (select sections) |
| Client state | Zustand (caches synced to Supabase — **not** local-only mock) |
| Backend | Supabase: Auth, Postgres (`kk_*` tables), Storage, Realtime, RPCs |
| Edge functions | `kk-customer-signup`, `kk-admin-users`, `kk-send-contact`, `kk-send-push` |
| Email | Resend (contact form, Kado Circle signups) |
| PWA | `vite-plugin-pwa`, service worker, push scaffold |
| E2E | Playwright (`e2e/*.spec.ts`) |
| Lint | `tsc --noEmit` via `npm run lint` |

**Key files:**
- Routes: `src/App.tsx`
- Bootstrap/hydration: `src/main.tsx`
- Domain types: `src/types/domain.ts`
- Auth: `src/store/authStore.ts`, `src/lib/supabase/repositories/auth.ts`
- Orders: `src/store/orderStore.ts`, `src/lib/supabase/repositories/ordering.ts`
- Route guard: `src/components/RoleGate.tsx`
- Roles: `src/lib/roles.ts`

---

## 3. Roles & Permissions

| Role | Auth entry | `RoleGate` routes | Branch scope | Primary responsibilities |
|------|------------|-------------------|--------------|--------------------------|
| **guest** | None | Public routes only | N/A | Browse, QR/takeout order, event signup, booth inquiry |
| **customer** | `/auth/login`, `/auth/signup` | `/account/*` (+ admin can also access account) | None | Orders, loyalty stamps, vouchers, profile, booth bookings |
| **barista** | `/management-portal` (barista tab) | `/barista/*` | **Single branch** (`branchId` required) | Order board, queue, POS, menu stock, stamp redemption |
| **staff** | `/management-portal` (staff tab) | `/staff/*` | Optional branch | Merch orders, booth bookings, all-orders view |
| **admin** | `/management-portal` (admin tab) | `/admin/*` (+ barista routes) | **All branches** (no `branchId`) | Full CRUD, users, settings, cross-branch POS, kiosk launcher |

**Super admin:** `admin@kadokohi.com` (`SUPER_ADMIN_EMAIL` in `src/lib/roles.ts`).

**Auth enforcement (`RoleGate.tsx`):**
- Shows spinner while `authStore.loading` (avoids flash redirect on refresh).
- Unauthenticated internal routes → `/management-portal`.
- Unauthenticated customer routes → `/auth/login` (preserves `state.from`).
- Customer login at `/auth/login` does **not** expose admin/barista/staff tabs (per `kado-kohi-revisions.md`).
- Internal login at `/management-portal` validates role matches selected tab; mismatched role logs out immediately.

**Session:** Supabase Auth JWT in localStorage. Profile resolved from `kk_profiles` via `orderingRepo.fetchUserById` / `ensureMyProfile`.

---

## 4. Complete Route Map

### Public (with marketing nav/footer — `PublicLayout`)
| Route | Page | Notes |
|-------|------|-------|
| `/` | Home | Hero slider, featured drinks, events, reviews, Kado Circle |
| `/menu` | Menu | Data-driven from Supabase menu catalog |
| `/about` | About | |
| `/contact` | Contact | Resend email + mailto fallback |
| `/branches` | Branches | Marikina + Greenhills (both active) |
| `/events` | Events | Admin CRUD, signup modals, schema markup |
| `/order` | Online order (legacy page) | Guest name + simplified cart; primary online flow is **CartDrawer** on menu/merch |
| `/merch` | Merch catalog | Separate merch channel at checkout |
| `/book/booth` | Booth booking wizard | Estimate → admin quote workflow |
| `/legal/terms` | Terms of Service | Signup consent links here |
| `/legal/privacy` | Privacy Policy | |

### Auth (standalone, no layout)
| Route | Page |
|-------|------|
| `/auth/login` | Customer sign-in |
| `/auth/signup` | Customer sign-up (phone required, legal consent) |
| `/management-portal` | Internal sign-in (admin / barista / staff tabs) |

### Standalone (no marketing chrome)
| Route | Page |
|-------|------|
| `/order/qr/:code` | Dine-in QR ordering |
| `/order/takeout?b=<branchSlug>` | Takeout QR ordering |
| `/help/install` | PWA install help |

### Customer (`RoleGate`: customer, admin)
| Route | Page |
|-------|------|
| `/account` | Dashboard (active order, loyalty, recent) |
| `/account/orders` | Order history |
| `/account/booth` | Booth bookings |
| `/account/vouchers` | Loyalty vouchers |
| `/account/profile` | Profile + phone |

### Barista (`RoleGate`: barista, admin)
| Route | Page |
|-------|------|
| `/barista` | Order board (kanban) |
| `/barista/queue` | Full queue list |
| `/barista/pos` | In-store POS |
| `/barista/menu` | Menu reference + in-stock toggle |
| `/barista/stamps` | Loyalty stamp redemption |
| `/barista/settings` | Password change |
| `/barista/kiosk` | Fullscreen kiosk display (branch-scoped) |

### Staff (`RoleGate`: staff, admin)
| Route | Page |
|-------|------|
| `/staff/booth-bookings` | Booth booking pipeline |
| `/staff/merch-orders` | Merch fulfillment |
| `/staff/orders` | All orders view |
| `/staff/settings` | Password change |

### Admin (`RoleGate`: admin only)
| Route | Page |
|-------|------|
| `/admin` | Dashboard KPIs |
| `/admin/branches` | Branch CRUD |
| `/admin/pos` | Cross-branch POS |
| `/admin/orders` | All orders (filterable) |
| `/admin/menu` | Menu CRUD + in-stock |
| `/admin/merch` | Merch catalog CRUD |
| `/admin/loyalty` | Kado Circle rewards config |
| `/admin/vouchers` | Voucher management |
| `/admin/booth-bookings` | Booth booking admin |
| `/admin/booth-catalog` | Booth packages + addons |
| `/admin/booth-content` | Booth showcase media |
| `/admin/events` | Kado Events CRUD + form builder |
| `/admin/tables` | Tables + QR generator |
| `/admin/sections` | Custom landing sections |
| `/admin/landing` | Homepage CMS (hero slides, copy) |
| `/admin/users` | Users + roles (edge function) |
| `/admin/audit` | Audit log |
| `/admin/settings` | Tax, hours, GCash QR, site config |

---

## 5. Application Bootstrap & Data Sync

On app load (`src/main.tsx`):

1. `recoverStaleAuthSession()` — clears invalid refresh tokens.
2. `authStore.initFromSupabase()` — restores session, resolves profile, starts role-appropriate sync.
3. Parallel hydration from Supabase:
   - branches, menu, tables, orders, settings, users, merch, events, event forms, booth bookings, landing content, loyalty.
4. PWA service worker registration.

**After login (`authStore`):**
- **Internal roles** (`admin`, `barista`, `staff`): `startOperationsRealtime()` + `refreshOperationsData()` — live order/menu/settings sync.
- **Customers**: hydrate own orders, loyalty stamps, branch-scoped vouchers.

**Zustand stores (22 total):** Client caches with `hydrateFromRemote()`. Orders are **not** persisted to localStorage (prevents stale boards). Auth is **not** Zustand-persisted (Supabase session is source of truth).

---

## 6. Order Channels

| Channel | How created | Required fields | Payment typical | Visible to |
|---------|-------------|-----------------|-----------------|------------|
| `dine-in` | Scan table QR → `/order/qr/:code` | `tableId`, `branchId` | GCash QR or pay-at-store | Barista (branch), Admin |
| `takeout` | Scan takeout QR → `/order/takeout?b=` | `guestName` (pickup name), `branchId` | GCash QR or pay-at-store | Barista (branch), Admin |
| `online` | CartDrawer on menu (logged-in customer) | `customerId`, `branchId` | GCash QR | Admin, Staff (all orders) |
| `pos` | Barista/Admin POS | `staffId`, `branchId` | Pay at counter (`paid` immediately) | Barista, Admin |
| `merch` | CartDrawer with merch items only | `customerId`, `branchId` | GCash QR | Staff, Admin |

**Barista board** shows all five channels for the branch (admin sees all branches).  
**Online orders** do not use the legacy `/order` page for the primary logged-in flow — customers order via global **CartDrawer** from `/menu`.

---

## 7. Transactional Flows (In Depth)

### 7.1 Shared order pipeline

All order inserts go through **`kk_place_order` RPC** (never direct client INSERT). Server validates:
- Product exists and `in_stock = true`
- Prices computed server-side (`kk_compute_unit_price`, promo logic)
- Table exists (dine-in)
- Promo code rules (if provided)
- Loyalty voucher discount (if provided)

**Client flow (`orderStore.createOrder`):**
1. Build optimistic `Order` object locally.
2. `ensureOrderReadiness()` — menu + tables hydrated; auto-bootstrap KADO MENU V2 if empty.
3. `assertProductsOrderable()` — all line items in stock.
4. `orderingRepo.placeOrder()` → `kk_place_order` RPC.
5. On success: update local store, `notifyBaristasNewOrder()`, customer push if applicable.
6. On failure: rollback optimistic order, throw formatted error.

**Guest order tracking:** `kk_track_order` RPC (unguessable order UUID). Used by `OrderTrackingPanel` after QR placement.

---

### 7.2 Dine-in (QR table) — full transaction flow

```
Guest scans table QR
  → GET /order/qr/:code
  → Resolve table from tableStore (code → branchId, tableId, label)
  → If table inactive/missing: error screen
  → startGuestPageRealtime() for live status updates
  → ensureOrderReadiness() syncs menu + tables from Supabase

Browse menu (category tabs)
  → Tap product → QrProductSheet (size, temp, milk modifiers)
  → Add to local cart (QrCartLine[])
  → buildQrCartTotals() computes subtotal, modifiers, tax, total

Checkout (QrStickyCart expanded)
  → Select payment: gcash-qr (default) | pay-at-store
  → placeOrder():
      channel: 'dine-in'
      tableId, branchId
      guestName: logged-in user name OR table label
      customerId: optional if logged in
      paymentMethod
      items from fresh cart totals

  → kk_place_order RPC persists order
  → sessionStorage tracks order (guestOrders.setTrackedOrder)
  → UI switches to OrderTrackingPanel

If paymentMethod = gcash-qr:
  → paymentStatus: 'unpaid', status: 'pending'
  → GuestOrderPaymentBlock shows shop GCash QR (from admin settings / Storage)
  → Guest uploads screenshot → compressPaymentProof → kk_submit_guest_payment_proof RPC
  → paymentStatus: 'proof_submitted'
  → notifyBaristasProofSubmitted()
  → Barista verifies proof → marks paymentStatus: 'paid'
  → Kitchen flow can advance (see §8)

If paymentMethod = pay-at-store:
  → paymentStatus: 'paid' immediately (defaultFieldsForNewOrder)
  → Barista board: "Paid · queue" column
  → Guest pays cash at counter; staff advances status

Guest can "Order again" → clears tracked session, returns to menu
```

**Key files:** `src/pages/OrderQR.tsx`, `src/components/qr/*`, `src/lib/qrOrderCart.ts`, `src/lib/guestOrders.ts`

---

### 7.3 Takeout — full transaction flow

```
Guest scans branch takeout QR
  → GET /order/takeout?b=<branchSlug>
  → Resolve branch from slug
  → Guest enters pickup name (required)
  → Same cart/checkout UX as dine-in (guest-themed, no marketing nav)
  → placeOrder():
      channel: 'takeout'
      branchId
      guestName: pickup name
      NO tableId

Payment + tracking: identical to dine-in (GCash proof or pay-at-store)
OrderTrackingPanel shows pickup context instead of table label
```

**Key files:** `src/pages/OrderTakeout.tsx`

---

### 7.4 Online order (customer, CartDrawer) — full transaction flow

```
Customer browses /menu (or featured products on home)
  → Add to cart (cartStore) with modifiers
  → Open CartDrawer (global, slide-over)

Preconditions (canOrder):
  → User role = 'customer' (must be logged in)
  → orderHours.isOpen (10 min before close cutoff — onlineOrderHours.ts)
  → branch selected (active branches only)
  → cart not empty
  → voucher eligibility if voucher selected

Optional discounts (mutually exclusive):
  → Loyalty voucher (checkoutStore.selectedVoucherId)
  → OR promo code (promoStore.validateCode)

placeOrder():
  → channel: 'online' if cart has coffee; 'merch' if merch-only
  → customerId required
  → paymentMethod: 'gcash-qr' (fixed in CartDrawer)
  → paymentStatus: 'unpaid'
  → loyalty voucher fields if applied
  → promoCode passed to kk_place_order

  → redeemVoucher() if voucher used
  → navigate to /account/orders?placed=<orderId>
  → Customer uploads GCash proof from account orders view
```

**Online hours:** Controlled by admin settings (`openTime`/`closeTime`) with `ONLINE_ORDER_CUTOFF_MINUTES = 10`.

**Legacy `/order` page:** Still exists for guest-name simplified ordering without CartDrawer; less featured than main cart flow.

**Key files:** `src/components/CartDrawer.tsx`, `src/store/cartStore.ts`, `src/store/checkoutStore.ts`, `src/hooks/useOnlineOrderHours.ts`

---

### 7.5 In-store POS — full transaction flow

```
Barista or Admin opens /barista/pos or /admin/pos
  → Touch tile menu by category
  → PosVariantModal for size/temp/milk
  → Cart drawer (right/bottom)
  → "Pay & Place"

placeOrder():
  → channel: 'pos'
  → staffId: current user id
  → branchId: barista's branch OR admin-selected branch
  → paymentMethod: pay-at-store (implicit)
  → paymentStatus: 'paid' immediately
  → status: 'pending' → appears on board in "Paid · queue"

No GCash proof step. Barista advances kitchen status directly.
```

**Key files:** `src/pages/barista/BaristaPOS.tsx`, `src/pages/admin/AdminPOS.tsx`

---

### 7.6 Merch order — full transaction flow

```
Customer browses /merch
  → Add merch items with variant groups (size, color, etc.)
  → CartDrawer detects hasMerch / !hasCoffee
  → channel forced to 'merch'
  → Same GCash checkout as online
  → Fulfillment via Staff portal (/staff/merch-orders)
```

**Key files:** `src/pages/Merch.tsx`, `src/pages/staff/StaffMerchOrders.tsx`, `src/store/merchStore.ts`

---

### 7.7 Payment proof upload (GCash)

Two paths:

| Actor | Method | Storage |
|-------|--------|---------|
| Guest (QR/takeout) | `kk_submit_guest_payment_proof` RPC with compressed data URL | Supabase Storage via RPC |
| Logged-in customer | `orderingRepo.uploadPaymentProof()` | `payment-proofs` bucket, path `customers/{userId}/{orderId}` |

Proofs stored as `proof-storage:` refs (not expiring signed URLs).  
Admin/barista preview via `usePaymentProofDisplayUrl` hook.  
Images compressed client-side (`compressPaymentProof.ts`) before upload to avoid RPC size limits.

**Admin GCash receive QR:** Uploaded to Storage, URL in `kk_app_settings` (`0026_gcash_qr_storage_and_settings.sql`).

---

## 8. Order Status & Fulfillment State Machines

### Payment status (`PaymentStatus`)
| Value | Meaning |
|-------|---------|
| `unpaid` | GCash order placed, no proof yet |
| `proof_submitted` | Guest/customer uploaded screenshot; awaiting staff verification |
| `paid` | Payment confirmed (staff action or pay-at-store/POS default) |
| `refunded` | Refund processed |

### Kitchen / fulfillment status (`OrderStatus`)
```
pending → accepted → preparing → ready → served → completed
                                              ↘ cancelled (any stage)
```

**GCash orders** skip `served` in auto-advance flow (`GCASH_FULFILLMENT_FLOW`).  
**Pay-at-store / POS** use full flow including `served` for dine-in.

### Barista board columns (`kioskColumnKey`)
| Column | Orders in this bucket |
|--------|----------------------|
| Awaiting payment | `paymentStatus` = unpaid OR proof_submitted |
| Paid · queue | `paymentStatus` = paid, status before preparing |
| Preparing | status = preparing |
| Ready | status = ready |

**Staff cannot advance kitchen status until GCash payment is `paid`** (`nextStatusInFlow` in `orderStatus.ts`).

### Loyalty stamps on completion
When status → `completed`: `applyLoyaltyStampsForCompletedOrder()` awards drink stamps to `customerId` (coffee items only). Persisted via `loyaltyStampsAwarded` on order row.

---

## 9. Role-by-Role User Journeys

### 9.1 Guest

**Goals:** Discover brand, order drinks, browse events, book booth, join Kado Circle.

**Typical paths:**
1. Land on `/` → hero slider → featured coffees → menu CTA.
2. `/menu` → browse → (must sign up to use CartDrawer for online order).
3. Scan QR → dine-in or takeout flow (no account required).
4. `/events` → view → signup modal if `signupEnabled`.
5. `/book/booth` → wizard (package, addons, date, contact) → `submitted` status.
6. Kado Circle CTA → email capture → Resend to `kadocoffeeph@gmail.com`.
7. `/contact` → form → Resend.

**Cannot access:** `/account`, `/admin`, `/barista`, `/staff`, `/management-portal` (without credentials).

---

### 9.2 Customer

**Signup (`/auth/signup`):**
1. Name, email, Philippine phone (+639…), password.
2. Legal consent checkbox (terms + privacy).
3. `kk-customer-signup` edge function (bypasses Auth rate limits).
4. May require email confirmation → sign in after.

**Login (`/auth/login`):**
1. Supabase `signInWithPassword`.
2. Profile from `kk_profiles`.
3. Redirect: `/account` (or `state.from` if account route).

**Account dashboard (`/account`):**
- Active order status (if any).
- Loyalty stamp count.
- Recent orders link.
- Vouchers link.

**Loyalty (Kado Circle):**
1. Earn stamps on completed drink orders (auto).
2. Admin defines rewards (stamps required, type, branch scope).
3. Customer claims reward → spends stamps → receives `LoyaltyVoucher`.
4. Apply voucher at CartDrawer checkout (branch-scoped).
5. Barista can redeem stamps in-store at `/barista/stamps`.

**Order history (`/account/orders`):**
- List all customer orders.
- Upload GCash proof for unpaid online/merch orders.
- Track status via realtime + notifications.

---

### 9.3 Barista

**Login:** `/management-portal` → Barista tab → must match `role: barista`.

**Daily workflow:**
1. **Board (`/barista`):** Kanban — verify GCash proofs, advance paid orders through kitchen.
2. **Queue (`/barista/queue`):** List view of same orders.
3. **POS (`/barista/pos`):** Walk-in counter orders.
4. **Menu (`/barista/menu`):** Toggle `inStock` for products (branch menu).
5. **Stamps (`/barista/stamps`):** Manual stamp earn/redeem for in-store loyalty.
6. **Kiosk (`/barista/kiosk`):** Fullscreen customer-facing display (admin can launch with branch picker).

**Scope:** `branchId` on profile — only sees orders for assigned branch (unless admin impersonation).

**Realtime:** Orders appear instantly via `operationsRealtime` subscription.

---

### 9.4 Staff

**Login:** `/management-portal` → Staff tab.

**Workflow:**
1. **Merch orders:** Fulfill merch channel orders (packaging, handoff).
2. **Booth bookings:** Review submissions, update status (`under_review` → `quoted` → `confirmed` etc.).
3. **All orders:** Read-only/cross-channel visibility for support.

**Does not:** Manage menu CRUD, users, or table QR generation (admin only).

---

### 9.5 Admin

**Login:** `/management-portal` → Admin tab. Super admin: `admin@kadokohi.com`.

**Operational loop:**
1. Monitor `/admin` dashboard.
2. Manage catalog: menu, merch, events, booth packages.
3. Process orders: `/admin/orders` (all channels, all branches).
4. Configure: settings (tax, hours, GCash QR), loyalty rewards, promo codes, vouchers.
5. Content: `/admin/landing` homepage CMS, `/admin/sections`, `/admin/booth-content`.
6. Operations: tables/QR generation, user management, audit log.
7. Launch kiosk: branch picker modal → `/barista/kiosk?branch=…`.

**User management:** `kk-admin-users` edge function — create internal users, reset passwords, assign roles/branches.

**Tables & QR:** Per-table globally unique `code` (e.g. `mar-t01`, `gre-t01`) → URL `https://kadokohi.com/order/qr/{code}`. Takeout QR per branch: `/order/takeout?b={slug}`.

**Branch CRUD (`/admin/branches`):** `branchStore.addBranch` upserts `kk_branches`, seeds 4 dine-in tables, rollback on failure. Slug uniqueness enforced client + DB (`kk_branches_slug_key`). Delete blocked if orders reference branch. Probe: `scripts/probe_branch_crud.py`.

---

## 10. Non-Order Features

### Events (Kado Events)
- Admin CRUD at `/admin/events`.
- Dynamic registration forms (`kk_event_forms`, migration `0032`).
- Signup windows: `signupOpensAt`, `signupClosesAt`, `maxSignups`.
- Public `/events` with signup modal, schema.org markup.
- `highlight` flag → "Next Massive Event" on landing.

### Booth booking
- Public wizard: `/book/booth`.
- Packages + addons from admin catalog.
- Estimate snapshot at submission; admin sends `finalQuote`.
- Status pipeline: `submitted` → `under_review` → `quoted` → `awaiting_confirmation` → `confirmed` / `declined` / `cancelled` / `completed`.
- Customer views at `/account/booth`.

### Landing CMS (`/admin/landing`)
- Hero slides (images, CTAs).
- Featured product IDs.
- Section copy: ordering carousel, schedule, events, testimonials, branches strip, Kado Circle.
- Preview iframe before publish.

### Promo codes
- Types: `percent`, `fixed`, `free_drink`, `bogo_drink`.
- Validated server-side in `kk_place_order`.
- Admin CRUD (via settings/promo store).

### Audit log
- Staff actions logged (`logAudit`) — order status changes, etc.
- View at `/admin/audit`.

### SEO
- `RouteSeo`, `PageSeoBlurb`, dynamic schema (events, products).
- Google reviews sync script (`npm run sync:google-reviews`).
- Sitemap generator (`npm run generate:sitemap`).
- Local keywords: "Kado Coffee", Marikina.

### PWA & push
- Install prompt, `/help/install`.
- Push notification scaffold (`kk-send-push`, `public/push-sw.js`).

---

## 11. Supabase Backend Summary

**35+ migrations** in `supabase/migrations/` (latest: `0050_greenhills_branch.sql`). Key tables (prefix `kk_`):
- `kk_profiles` — users, roles, branchId, loyalty stamps, phone
- `kk_branches`, `kk_menu_categories`, `kk_products`
- `kk_tables`, `kk_orders`, `kk_order_items`
- `kk_events`, `kk_event_registrations`, `kk_event_forms`
- `kk_merch_*`, `kk_booth_*`, `kk_loyalty_*`, `kk_vouchers`
- `kk_app_settings`, `kk_landing_content`, `kk_audit_log`
- `kk_promo_codes`

**Critical RPCs:**
| RPC | Purpose |
|-----|---------|
| `kk_place_order` | Secure order insert with server-side pricing |
| `kk_track_order` | Guest-safe order status lookup by UUID |
| `kk_submit_guest_payment_proof` | Guest GCash proof upload |
| `kk_ensure_menu_catalog` | Bootstrap KADO MENU V2 if empty |
| `kk_ensure_default_tables` | Marikina-only table bootstrap (new branches use admin `addBranch`) |
| `kk_admin_delete_table` | Admin table delete RPC |

**Production branches (June 2026):**
| ID | Slug | Tables |
|----|------|--------|
| `branch_marikina` | `marikina` | `mar-t01` … `mar-t05` |
| `branch_greenhills` | `greenhills` | `gre-t01` … `gre-t04` |

**RLS (`kk_branches` / `kk_tables`):** public SELECT; admin write on branches; admin/staff write on tables.

**Realtime:** `operationsRealtime.ts` for staff; `guestPageRealtime.ts` for QR order pages.

**Storage buckets:** GCash shop QR, payment proofs (private).

---

## 12. Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `kk-customer-signup` | Customer signup form | Create auth user + profile; handle email confirmation |
| `kk-admin-users` | Admin user management | Create users, reset passwords, role assignment |
| `kk-send-contact` | Contact / Kado Circle forms | Resend email to shop inbox |
| `kk-send-push` | Order notifications | Push to subscribed staff devices |

---

## 13. Brand System

**Authoritative reference:** `BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md` (brand identity section).

| Token | Value | Usage |
|-------|-------|-------|
| Cream | `#F1DFBA` | Warm base backgrounds |
| Red | `#9E181D` | Primary accent |
| Dark | `#191919` | Text, dark surfaces |
| Off-white | `#FAF9F6` | Light neutrals |

**Fonts:** Zalando Sans Expanded (display/headlines), M Plus 1 (body/UI).  
**Logo assets:** `public/logo/`, `public/Branding/`.

**Known brand gaps (June 2026):**
- Hero still ~full viewport; client wants 8–10vh peek of next section (`kado-kohi-revisions.md`).
- Some surfaces still use kanji box vs official lockups.
- `BRANDING` doc §3 "current stack" section is outdated.

---

## 14. Client Revisions Status (`kado-kohi-revisions.md`)

| Requirement | Status |
|-------------|--------|
| Move e-commerce higher on homepage | ✅ Featured coffees section immediately after hero |
| Hero slider (not heavy scroll animations) | ✅ `HomeHeroSlider` |
| Hero 8–10vh peek of next section | ❌ Hero still `calc(100svh - nav)` |
| Remove staff tabs from public login | ✅ `/management-portal` for internal |
| Hidden admin/barista routes | ✅ `/management-portal`, `/admin`, `/barista` |

---

## 15. Testing

**E2E suites:** `smoke`, `admin`, `barista`, `staff`, `customer`, `merch`, `order-flows`, `transactions`, `security`, `auth-validation`, `guest-validation`.

**Smoke tests** do not hit Supabase (no CI credentials) — verify shell renders.

**Known flaky areas:** Admin route rendering, add-user modal (see `test-results/admin-*`).

**Commands:**
```bash
npm run dev          # Vite (see vite.config — typically 5174)
npm run lint         # tsc --noEmit
npm run test:e2e     # Playwright
npm run build        # production build
python scripts/probe_branch_crud.py      # admin branch CRUD smoke test
python scripts/probe_greenhills_branch.py # Greenhills order channels smoke test
```

---

## 16. Progress vs Original Plan (`PROJECT_PLAN.md`)

| Phase | Planned | Actual (June 2026) |
|-------|---------|-------------------|
| 0 Plan lock | ✅ | ✅ |
| 1 Foundations (types, stores, RoleGate) | ✅ | ✅ + Supabase |
| 2 Public data-driven menu/events | ✅ | ✅ + landing CMS |
| 3 Customer auth + online order | Mock auth | ✅ Real Supabase auth |
| 4 QR + barista kiosk | ✅ | ✅ + GCash + realtime |
| 5 Admin SaaS | ✅ | ✅ + merch, booth, loyalty, audit |
| 6 DB-readiness wrapper | Partial | Repos in use; `src/lib/api.ts` exists |

**Shipped beyond original plan:** merch, booth booking, loyalty vouchers, promo codes, GCash payment proofs, event form builder, staff role, SEO, Resend email, legal pages, in-stock toggle, PWA.

**Still not shipped (original non-goals):** PayMongo gateway integration, production email infra beyond Resend, full payment gateway.

---

## 17. Key Domain Types (`src/types/domain.ts`)

Reference when adding features — types mirror Postgres tables:

- `Branch`, `MenuCategory`, `Product` (with `inStock`)
- `Order`, `OrderItem`, `OrderChannel`, `OrderStatus`, `PaymentMethod`, `PaymentStatus`
- `User`, `Role` (includes `staff`)
- `Table`, `TakeoutQr`
- `Event`, `EventRegistration`
- `MerchProduct`, `MerchCategory`
- `PromoCode`, `LoyaltyReward`, `LoyaltyVoucher`
- `BoothPackage`, `BoothAddon`, `BoothBooking`, `BookingEstimate`
- `CustomSection`

---

## 18. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                       │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Public site  │ QR/Takeout   │ Account      │ Admin/Barista/Staff│
│ + CartDrawer │ (standalone) │ /account/*   │ portals            │
└──────┬───────┴──────┬───────┴──────┬───────┴─────────┬──────────┘
       │              │              │                 │
       ▼              ▼              ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Zustand stores (cache) ← hydrateFromRemote / realtime patches   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌─────────────┐    ┌──────────────────────┐    ┌──────────────┐
│ Supabase    │    │ Supabase Postgres    │    │ Supabase     │
│ Auth        │    │ kk_* tables + RPCs   │    │ Storage      │
│ (JWT)       │    │ kk_place_order, etc. │    │ proofs, QR   │
└─────────────┘    └──────────┬───────────┘    └──────────────┘
                              │
                              ▼ Realtime
                    ┌─────────────────────┐
                    │ Barista board       │
                    │ Admin orders        │
                    │ Guest tracking      │
                    └─────────────────────┘
```

---

## 19. Related Documentation Files

| File | Use when |
|------|----------|
| `PROJECT_CONTEXT.md` | **This file** — start here |
| `AGENTS.md` | Short pointer for AI agents — read `PROJECT_CONTEXT.md` |
| `.cursor/rules/` | Cursor rules: `karpathy-guidelines.mdc`, `project-context.mdc` |
| `PROJECT_PLAN.md` | Historical architecture blueprint (partially stale) |
| `BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md` | Brand tokens, typography, colors (identity section current) |
| `kado-kohi-revisions.md` | Client UX revision checklist |
| `legal/TERMS-AND-CONDITIONS-BRIEF-FOR-COUNSEL.txt` | Legal/product facts for counsel |
| `skills/fullstack-developer.md` | Agent persona for fullstack tasks |
| `skills/ui-designer.md` | Agent persona for UI tasks |
| `ux-ui-designer (1).md` | UX design principles persona |
| `seo-specialist.md` | SEO agent persona |
| `clientrequest.md` | Empty — no client notes yet |

---

## 20. Open Questions & Known Gaps

1. **Hero viewport peek** — client revision not fully implemented.
2. **PayMongo** — type exists in domain; not integrated as live gateway.
3. **PROJECT_PLAN / README** — need sync with Supabase reality.
4. **E2E stability** — admin/barista tests intermittently fail in CI.
5. **Online orders to barista board** — baristas see all channels including online for their branch; original plan debated whether online should be admin-only.

---

## 21. Implementation Principles (Karpathy Guidelines)

When modifying this codebase:

1. **Think before coding** — verify assumptions against this doc and live routes.
2. **Simplicity first** — minimum change that solves the task; no speculative abstractions.
3. **Surgical changes** — match existing patterns; don't refactor unrelated code.
4. **Verifiable success** — define checkable criteria (test, route, RPC response) before implementing.

Also enforced via `.cursor/rules/karpathy-guidelines.mdc` (always apply).

---

## 22. Recent Changes (June 2026 — session snapshot)

| Area | What shipped |
|------|----------------|
| **Promo checkout** | CartDrawer: loyalty vs promo mutual exclusion; `increment_promo_uses` RPC |
| **Admin menu** | Product CRUD + image upload (5 MB, client compression) |
| **Barista board** | Atomic order updates; GCash proof via `guest/{orderId}/` storage refs (`0049`) |
| **Catalog UX** | Skeleton loading on `/menu`, `/merch`, `/blog`, `/pastries` |
| **Images** | `MenuProductImage` component — lazy load, fallback chain, shared URL normalization |
| **Branches** | Greenhills active + tables (`0050`); unique table codes; transactional create; admin CRUD probe |
| **Cursor** | Karpathy guidelines + project-context rules in `.cursor/rules/` |

**Git tip:** `main` is production; run `npm run lint` && `npm run build` before push.

**Supabase project ID:** `idwtlujcdfnnndxmlaco`

---

*Update this file when adding roles, routes, order channels, payment methods, or major schema changes.*
