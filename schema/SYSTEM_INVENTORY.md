# Kado Kohi — system inventory (agent memory)

Companion to [`kado-system.graphql`](./kado-system.graphql). Runtime = Supabase Auth + PostgREST + `kk_*` RPCs + Edge Functions. GraphQL SDL is documentation only.

**Project:** `idwtlujcdfnnndxmlaco` · **Site:** https://www.kadokohi.com  
**Orders:** always `kk_place_order` — never direct INSERT into `kk_orders`.

---

## 1. Roles & surfaces

| Role | Login | Layout / gate | Branch scope |
|------|-------|---------------|--------------|
| `guest` | none | public + QR standalone | N/A |
| `customer` | `/auth/login` | `CustomerLayout` + `RoleGate` | N/A |
| `barista` | `/management-portal` | `BaristaLayout` | required `branchId` |
| `staff` | `/management-portal` | `StaffLayout` | required `branchId` |
| `admin` | `/management-portal` | `AdminLayout` | all branches (`branchId` null) |

Wire enums (domain.ts): `OrderChannel` uses hyphens (`dine-in`); GraphQL SDL uses underscores (`dine_in`) with the same meaning.

---

## 2. Site routes (`src/App.tsx`)

### Public (`PublicLayout`)
| Path | Page |
|------|------|
| `/` | Home |
| `/menu` | Menu |
| `/about` | About |
| `/contact` | Contact (`/contacts` → redirect) |
| `/branches` | Branches |
| `/events` | Events |
| `/order` | → `/menu` (legacy redirect) |
| `/checkout/:orderId` | Checkout (PayMongo return + GCash) |
| `/merch` | Merch |
| `/pastries` | Pastries / mix-match |
| `/features`, `/features/:slug` | Blog (canonical); `/blog` → redirect |
| `/careers` | Careers |
| `/book/coffee-cart`, `/book/matcha-bar` | Booth booking (`/book/booth` → coffee-cart) |
| `/legal/terms`, `/legal/privacy` | Legal |

### Standalone (no public chrome)
| Path | Page |
|------|------|
| `/order/qr/:code` | QR dine-in |
| `/order/takeout` | QR takeout |
| `/help/install` | PWA install help |

### Auth
| Path | Page |
|------|------|
| `/auth/login`, `/auth/signup`, `/auth/confirm` | Customer auth |
| `/auth/forgot-password`, `/auth/reset-password` | Customer password |
| `/management-portal/*` | Internal login |
| `/management-portal/forgot-password/*` | Internal forgot |

### Customer (`/account/*` — customer + admin)
| Path | Page |
|------|------|
| `/account` | Dashboard |
| `/account/orders` | Orders |
| `/account/booth` | Booth bookings |
| `/account/vouchers` | Loyalty vouchers |
| `/account/profile` | Profile + notification toggle |

### Barista (`/barista/*` — admin + barista)
| Path | Page |
|------|------|
| `/barista` | Board |
| `/barista/queue` | Queue |
| `/barista/pos` | POS |
| `/barista/menu` | Menu stock |
| `/barista/stamps` | Stamps |
| `/barista/settings` | Account settings |
| `/barista/kiosk` | Kiosk display |

### Staff (`/staff/*` — admin + staff)
| Path | Page |
|------|------|
| `/staff` | Merch orders (index) |
| `/staff/merch-orders` | Merch orders |
| `/staff/booth-bookings` | Booth bookings |
| `/staff/event-registrations` | Event sign-up form submissions (read/review) |
| `/staff/orders` | All orders |
| `/staff/settings` | Account settings |

### Admin (`/admin/*` — admin only)
Dashboard, branches, pos, orders, menu, merch, loyalty, stamps, booth-bookings, booth-catalog, booth-content, events, tables, landing, blog, careers, pastries, users, audit, vouchers, settings.

---

## 3. Zustand stores (`src/store/`)

| Store | Domain |
|-------|--------|
| `authStore` | Session, role, profile |
| `branchStore` | Branches |
| `menuStore` | Categories + products |
| `merchStore` | Merch catalog |
| `tableStore` | Dine-in tables |
| `cartStore` | Online cart (merge key) |
| `checkoutStore` | Checkout UI state |
| `orderStore` | Orders list + place/patch |
| `loyaltyStore` | Rewards / stamps |
| `voucherStore` | Customer vouchers |
| `promoStore` | Promo codes |
| `eventStore` / `eventFormStore` / `eventCalendarStore` | Events |
| `boothBookingStore` / `boothCatalogStore` / `boothShowcaseStore` / `matchaShowcaseStore` / `bookingEstimateStore` | Booth |
| `blogStore` | Blog |
| `landingContentStore` / `pastriesContentStore` / `careersStore` | CMS |
| `settingsStore` | App settings |
| `userStore` | Admin users |
| `auditStore` | Audit log |

---

## 4. Client RPCs (called from SPA)

| RPC | Caller | Who |
|-----|--------|-----|
| `kk_place_order` | `orderingRepo.placeOrder` | anon + authenticated |
| `kk_track_order` | track / checkout / QR | anon + authenticated |
| `kk_submit_guest_payment_proof` | guest GCash | anon + authenticated |
| `kk_guest_cancel_order` | guest cancel/change | anon + authenticated |
| `kk_guest_switch_to_cash` | guest → pay-at-store | anon + authenticated |
| `kk_change_order_payment_method` | unpaid method switch | anon + authenticated |
| `kk_ensure_menu_catalog` | bootstrap | anon + authenticated |
| `kk_ensure_mix_match_catalog` | bootstrap | anon + authenticated |
| `kk_ensure_default_tables` | bootstrap | anon + authenticated |
| `kk_ensure_my_profile` | auth bootstrap | authenticated |
| `kk_set_product_in_stock` | barista/admin | authenticated |
| `kk_admin_delete_order` | admin | authenticated |
| `kk_admin_delete_table` | admin | authenticated |
| `kk_admin_delete_event` | admin | authenticated |
| `kk_register_for_event` | events | anon + authenticated |
| `kk_fetch_event_calendar` | booth calendar | anon + authenticated |
| `kk_admin_toggle_event_blockout` | admin | authenticated |
| `kk_admin_set_event_date_kind` | admin | authenticated |
| `kk_place_booth_booking` | booth forms | anon + authenticated |
| `kk_admin_patch_booth_booking` | admin/staff | authenticated |
| `kk_submit_booth_payment_proof` | booth payment | anon + authenticated |
| `kk_claim_loyalty_reward` | account | authenticated |
| `kk_submit_career_application` | careers | anon + authenticated |
| `kk_notify_customers` | admin broadcast inbox | authenticated |

Career applications: admin SELECT + UPDATE (`status`: new/reviewing/interview/hired/rejected).

Internal helpers (not SPA-direct): `kk_compute_unit_price`, `kk_compute_promo_discount`, `kk_compute_loyalty_discount`, `kk_write_audit`, `kk_sync_merch_product_into_menu`, `kk_handle_new_auth_user` / `kk_handle_new_user`, `kk_orders_reject_guest_online_paymongo` (trigger).

---

## 5. Edge functions (`supabase/functions/`)

| Function | Purpose |
|----------|---------|
| `kk-paymongo-checkout` | Create hosted QR Ph session |
| `kk-paymongo-verify` | Poll/reconcile payment after return |
| `kk-paymongo-webhook` | HMAC webhook → mark paid |
| `kk-send-push` | Web push + customer inbox rows |
| `kk-send-contact` | Resend contact email |
| `kk-customer-signup` | Customer signup + profile |
| `kk-admin-users` | Admin create/update/delete/reset users + data reset scopes |

---

## 6. Storage buckets

| Bucket | Public | Use |
|--------|--------|-----|
| `kado-menu-images` | yes | Menu photos |
| `kado-cms-images` | yes | Landing / events / booth / pastries CMS |
| `kado-blog-images` | yes | Blog covers |
| `kado-gcash-qr` | yes | Shop receive QR |
| `kado-payment-proofs` | no | GCash screenshots |

---

## 7. Core tables

`kk_profiles`, `kk_branches`, `kk_menu_categories`, `kk_products`, `kk_tables`, `kk_orders`, `kk_order_items`, `kk_merch_categories`, `kk_merch_products`, `kk_events`, `kk_event_registrations`, `kk_event_forms`, `kk_event_date_blockouts`, `kk_booth_bookings` (+ catalog/content), `kk_loyalty_rewards`, `kk_loyalty_vouchers`, `kk_promo_codes`, `kk_promo_claims`, `kk_app_settings`, `kk_landing_content`, `kk_blog_posts`, `kk_audit_log`, `kk_customer_notifications`, career application tables.

---

## 8. Transactional flows (summary)

### Online coffee / merch
1. Cart (`cartStore`) → place via `kk_place_order` (`online` / `merch`)
2. Payment: **PayMongo** (signed-in customer only) or **GCash QR** (customer or guest)
3. PayMongo: edge checkout → hosted page → webhook + verify → `/checkout/:id`
4. GCash: shop QR → proof → `proof_submitted` → staff `paid`
5. Kitchen: barista board advances status after paid (where required)

### QR dine-in (`/order/qr/:code`)
1. Resolve table → local cart → `kk_place_order` (`dine-in` + `tableId`)
2. Pay: PayMongo | GCash | pay-at-store
3. Track via `kk_track_order` + guest realtime; navigate checkout with `state.from`

### QR takeout (`/order/takeout`)
Same as dine-in without table; session key branch-scoped (`takeout.${slug}`).

### POS (barista/admin)
`kk_place_order` channel `pos`, typically `pay-at-store` + paid immediately.

### Guest unpaid actions
`kk_guest_cancel_order` (cancel / change_order), `kk_change_order_payment_method`, `kk_guest_switch_to_cash`, `kk_submit_guest_payment_proof`.

### Notifications
`kk-send-push` (+ inbox insert) · `kk_notify_customers` · table `kk_customer_notifications` · UI: `PendingPaymentsBell`, `NotificationToggle`.

---

## 9. Payment × channel matrix

| Channel | PayMongo | GCash QR | Pay at store |
|---------|----------|----------|--------------|
| Online coffee | customer | customer \| guest | no |
| Online merch | customer | customer \| guest | no |
| QR dine-in | customer \| guest | customer \| guest | yes |
| QR takeout | customer \| guest | customer \| guest | yes |
| POS | — | — | yes (immediate) |

---

## 10. Postgres / Supabase practices applied here

Aligned with supabase-postgres-best-practices priorities:

| Priority | How Kado does it |
|----------|------------------|
| Query performance | RPCs for hot paths; indexes via migrations (e.g. `0044_rpc_grants_and_indexes`); avoid N+1 via repository batching |
| Connections | Browser uses Supabase JS → PostgREST/pooler; edge functions for privileged PayMongo/webhook |
| Security & RLS | RLS on exposed tables; SECURITY DEFINER RPCs with explicit GRANT/REVOKE; never authorize from `user_metadata`; service_role only in edge |
| Schema | `kk_` prefix; server-side pricing in `kk_place_order`; snapshots on order lines |
| Concurrency | Idempotent PayMongo paid mark; webhook HMAC |
| Data access | Guest track by unguessable UUID only (`kk_track_order`) |

**Hard rules:** no `service_role` in Vite; UPDATE needs SELECT policy; storage upsert needs INSERT+SELECT+UPDATE; views should use `security_invoker` if added.

---

## 11. Key code entry points

| Concern | Path |
|---------|------|
| Routes | `src/App.tsx` |
| Domain | `src/types/domain.ts` |
| Orders | `src/lib/supabase/repositories/ordering.ts`, `src/store/orderStore.ts` |
| PayMongo | `src/lib/supabase/repositories/paymongo.ts`, `supabase/functions/kk-paymongo-*` |
| QR | `src/pages/OrderQR.tsx`, `OrderTakeout.tsx` |
| Checkout | `src/pages/Checkout.tsx` |
| Auth | `src/store/authStore.ts`, `src/lib/supabase/repositories/auth.ts` |
| Realtime | `src/lib/supabase/operationsRealtime.ts`, `guestPageRealtime.ts` |
| Migrations | `supabase/migrations/` |

Update this file and `kado-system.graphql` whenever routes, RPCs, payments, or roles change.
