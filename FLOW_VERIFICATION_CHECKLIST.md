# Kado Kohi — full flow verification checklist

**Date:** 2026-07-27  
**DB:** `idwtlujcdfnnndxmlaco` (`https://idwtlujcdfnnndxmlaco.supabase.co`)  
**Note:** Cursor `user-supabase` MCP points at a *different* project — do not use it for this repo.

**Done definition:** every intentional café path below is **PASS** with fresh evidence, or **ACCEPTED** with an explicit SOP. No silent gaps.

---

## Gates (this session)

| Gate | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | PASS (exit 0) |
| Build | `npm run build` | PASS (exit 0) |
| Payment + takeout name | prior this session | PASS 38 + 2 |
| Role/CMS sweep | access-control…smoke | PASS 80 (11 were stale selectors, fixed) |
| Auth/ops/menu/pastries/security | `--workers=1` desktop | PASS **exit 0** (this session) |

---

## Prod Postgres (best-practices snapshot)

| Check | Evidence |
|-------|----------|
| Core RPCs present | `kk_place_order`, `kk_submit_guest_payment_proof`, `kk_track_order`, `kk_guest_cancel_order`, `kk_guest_switch_to_cash`, `kk_change_order_payment_method`, `kk_award_loyalty_stamps` |
| Customer cannot forge paid (online/merch) | `kk_orders_protect_customer_mutations` cash exception limited to `dine-in`/`takeout` |
| Merch GCash proof | proof RPC channels include `merch` |
| RLS on money tables | `kk_orders`, `kk_order_items`, `kk_booth_bookings` → `relrowsecurity=true` |
| Order indexes (`query-*`) | branch, customer, status/created, short_code unique, paymongo session |
| PayMongo cancel-then-pay | edge `markPaymongoOrderPaid` skips `cancelled` (deployed) |

**Accepted (not defects):** SECURITY DEFINER EXECUTE for public guest RPCs; PayMongo refunds = manual SOP; unused advisor noise on legacy indexes.

---

## Scenario matrix

### A. Guest / QR / online ordering

| # | Scenario | Status | Evidence |
|---|----------|--------|----------|
| A1 | QR dine-in place → unpaid gateway | PASS | `transactions` dine-in + forge-on-place |
| A2 | Takeout place requires name (trim) | PASS | `guest-validation` + `QrStickyCart` `nameMissing` |
| A3 | Online coffee/pastries cart place | PASS | `ordering` / `transactions` online |
| A4 | Merch place + GCash method | PASS | `transactions` merch |
| A5 | Merch GCash proof RPC | PASS | `security` merch proof |
| A6 | Anon cannot list guest orders | PASS | `security` |
| A7 | Anon cannot direct-insert orders | PASS | `security` |
| A8 | Takeout empty-name whitespace cannot place | PASS | button disabled when `!trim()` |

### B. Payments

| # | Scenario | Status | Evidence |
|---|----------|--------|----------|
| B1 | GCash QR proof → `proof_submitted` only | PASS | RPC + prior probes |
| B2 | PayMongo checkout amount from DB | PASS | edge + prior audit |
| B3 | PayMongo webhook/verify mark paid | PASS | deployed helpers |
| B4 | Cancelled order not revived by PayMongo | PASS | `paymongoPaid.ts` skip cancelled |
| B5 | Customer cannot UPDATE forge paid online | PASS | `security` + trigger |
| B6 | Switch-to-cash (QR only) | PASS | channel-scoped trigger |
| B7 | PayMongo auto-refund | **ACCEPTED** | Manual SOP in SYSTEM_READINESS |

### C. Kitchen / barista / staff

| # | Scenario | Status | Evidence |
|---|----------|--------|----------|
| C1 | Barista portal routes | PASS | `barista.spec` (sweep) |
| C2 | Barista ops / POS surfaces | PASS | `barista-ops` |
| C3 | Staff merch / booth / events routes | PASS | `staff` + `staff-ops` |
| C4 | Access control RoleGate | PASS | `access-control` |

### D. Admin CMS / catalog

| # | Scenario | Status | Evidence |
|---|----------|--------|----------|
| D1 | Landing / blog / careers / events CMS routes | PASS | `admin-cms` |
| D2 | Settings save validation | PASS | `admin-settings` |
| D3 | Branches list + duplicate slug | PASS | `admin-ops` (selector fixed) |
| D4 | Users barista branch + short password | PASS | `admin-ops` |
| D5 | Menu drink product CRUD | PASS | `admin-menu` serial |
| D6 | Pastries admin + customer add | PASS | `pastries` + catalog search |

### E. Auth / account

| # | Scenario | Status | Evidence |
|---|----------|--------|----------|
| E1 | Customer/login validation | PASS | `auth.spec` |
| E2 | Wrong password / missing account copy | PASS | aligned to “Incorrect password / No account found” |
| E3 | Duplicate signup | PASS | `#signup-email-error` |
| E4 | Forgot password success copy | PASS | “We sent a password reset link…” |
| E5 | Reset requires recovery session | PASS | logged-in visit → invalid/expired |
| E6 | Account pages + password mismatch | PASS | `customer.spec` current/new/confirm fields |
| E7 | Internal portal role mismatch | PASS | `auth` internal |

### F. Marketing / bookings / misc

| # | Scenario | Status | Evidence |
|---|----------|--------|----------|
| F1 | Booth booking UI + API | PASS | `booking` + `booking-api` |
| F2 | Branches / events / careers public | PASS | `branches-events-careers` |
| F3 | Merch page guest/sign-in | PASS | `merch.spec` |
| F4 | Smoke + unknown route SPA | PASS | `smoke` |
| F5 | Mix & Match storefront | **ACCEPTED** | UI deferred; backend retained |
| F6 | Contact inbox DB | **ACCEPTED** | Resend email SLA |

---

## Implementation completeness (product scope)

| Area | Complete? |
|------|-----------|
| Ordering channels (QR / takeout / online / merch / POS) | Yes |
| Payment methods (cash QR, GCash proof, PayMongo) + trust | Yes (refunds = SOP) |
| Role portals (admin / barista / staff / customer) | Yes |
| CMS ↔ public landing parity | Yes (prior ship) |
| Events guest signup + staff review | Yes |
| Career application status | Yes |
| Loyalty stamp award path | Yes |
| Booth booking lifecycle | Yes |

---

## Residual risks (tracked, not blocking)

1. Guest proof RPC is capability-URL (order UUID) — not enumerable via REST; keep UUID secret.  
2. PayMongo pay-after-cancel: ticket stays cancelled; ops refund manually.  
3. Pastries e2e depends on remote catalog visibility timing — poll anon `kk_products` before customer assert.

---

## How to re-verify

```bash
npm run lint && npm run build
npx playwright test e2e/security.spec.ts e2e/transactions.spec.ts e2e/guest-validation.spec.ts e2e/order-flows.spec.ts --project=desktop-chrome --reporter=line
npx playwright test e2e/auth.spec.ts e2e/customer.spec.ts e2e/admin-ops.spec.ts e2e/admin-menu.spec.ts e2e/pastries.spec.ts e2e/access-control.spec.ts e2e/barista.spec.ts e2e/staff.spec.ts e2e/booking.spec.ts e2e/merch.spec.ts e2e/smoke.spec.ts --project=desktop-chrome --reporter=line
```
