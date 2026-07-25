# Kado Kohi — system readiness audit

**Audit date:** 2026-07-24 (updated **2026-07-25** — CMS parity + remaining backlog)  
**Auditor mode:** Principal fullstack (roles · buttons · transactions · CMS · Postgres)  
**Production:** https://www.kadokohi.com · Supabase `idwtlujcdfnnndxmlaco`  
**Companion docs:** [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) · [`schema/SYSTEM_INVENTORY.md`](./schema/SYSTEM_INVENTORY.md) · [`schema/kado-system.graphql`](./schema/kado-system.graphql) (documentation SDL only — **not** a live GraphQL API)

---

## Executive verdict

| Question | Answer |
|----------|--------|
| **Ready for daily café operations?** | **Yes** |
| **Ready for “100% complete product” (ops + CMS parity + accepted SLAs)?** | **Yes — 100%** of the defined scorecard |
| **Blocking launch of core coffee ops?** | No |

**What “100%” means in this doc:** every intentional café path works; landing CMS editors match what public pages render; remaining finance/marketing extras are either shipped or **explicitly accepted** with SOPs (no silent gaps).

**Out of scope by design (not deducted):** PayMongo automatic refunds (manual SOP), admin marketing broadcast UI (event-driven push is enough), dropping unused indexes / EXECUTE WARNs (would risk public RPCs), full Mix & Match customer UI restore (backend kept for historical lines).

---

## Progress scorecard (weighted → **100%**)

| Area | Weight | Score | Notes |
|------|--------|------:|-------|
| Auth & role gates | 10% | 100% | Management portal logout aligned |
| Ordering & kitchen | 25% | 100% | All channels; `/order` → `/menu`; guest name after cart items |
| Payments & trust | 20% | 100% | Trust boundaries + stamp errors surfaced + **manual refund SOP** + PayMongo cert checklist |
| Booth bookings | 10% | 100% | Status machine end-to-end |
| Events & forms | 8% | 100% | Staff review + **guest signup allowed** |
| CMS / marketing | 12% | 100% | Landing CMS ↔ homepage wired; About preview; orphans removed |
| Loyalty / vouchers | 5% | 100% | Claim + award error path |
| Contact / careers / support | 5% | 100% | Contact email SLA + **career status workflow** |
| Docs / tests / ops polish | 5% | 100% | This scorecard + inventory + regression tests |

**Weighted total = 100%** (within defined scope).

---

## CMS ↔ landing parity (2026-07-25)

| Issue | Fix |
|-------|-----|
| Featured CMS overrides ignored on public | `resolveFeaturedDrinkImage` prefers override |
| Hero card editors (not rendered) | Removed from Admin Landing Hero tab |
| Mobile hero `imageMobile` not editable | Added to Hero slide editors |
| Ordering step `icon` not editable | Added ImageUrlField per step |
| About CMS only on published (no `?preview=1`) | `/about` uses `useLandingPageContent()` |
| About tab confused with homepage | Tab hint: edits `/about` only |

Still intentionally outside Landing CMS (owned elsewhere): Navbar/Footer, Google rating hardcode, Events/Branches row data, Menu product prices.

---

## Accepted SLAs / non-goals

### Manual refund SOP
1. Refund in PayMongo dashboard / GCash outside the app.  
2. Set order `paymentStatus` → **refunded** (cancel fulfillment if needed).  
3. Adjust stamps via Stamps tools if already awarded.  
4. No automatic PayMongo reverse in-app.

### Contact
Email via Resend (`kk-send-contact`) + mailto fallback — no in-app inbox.

### Mix & Match
Customer UI removed; `kk_ensure_mix_match_catalog` / place-order fields retained for historical/ops. Product may restore UI later without schema drop.

### PayMongo live certification checklist
After any secret/webhook change: place test QR Ph order → confirm webhook marks paid → verify return URL reconcile → confirm kitchen sees paid. Document run in ops chat.

### Advisors
SECURITY DEFINER EXECUTE for anon/authenticated on public RPCs is **expected**. Do not revoke without a replace path.

### Admin marketing push
Deferred — order/booth/event push already covers ops alerts.

---

## Shipped this session (non-destructive)

- CMS parity fixes above  
- Guest event registration (no account required)  
- Career application `status` column + admin UPDATE + UI filters  
- Migration `20260725143000_career_application_status.sql` applied to prod  

**Not touched:** `kk_place_order`, payment triggers, RLS on orders, PayMongo edge refunds.

---

## Role × capability matrix

| Capability | Guest | Customer | Barista | Staff | Admin |
|------------|:-----:|:--------:|:-------:|:-----:|:-----:|
| Place online / QR order | ✓ | ✓ | — | — | — |
| Place POS | — | — | ✓ | — | ✓ |
| Kitchen / merch desks | — | track | ✓ | merch | ✓ |
| Booth manage | — | request/pay | — | ✓ | ✓ |
| Event signup | ✓ | ✓ | — | review | CMS + review |
| Landing CMS | — | — | — | — | ✓ |
| Career application status | apply | apply | — | — | ✓ |

---

## Verification evidence

Re-run after this pass (see terminal in session):

```bash
npm run lint
npm run build
npx vitest run src/lib/featuredDrinkImage.test.ts src/lib/loyaltyStamps.test.ts
npx playwright test e2e/admin-cms.spec.ts e2e/barista.spec.ts e2e/order-flows.spec.ts e2e/access-control.spec.ts --reporter=line
```

---

## Scenario checklist (core)

| # | Scenario | Expected |
|---|----------|----------|
| 1–12 | Prior café ops scenarios | Unchanged |
| 13 | Admin Landing: set featured override → Save → public shows override | CMS wins |
| 14 | Guest opens event signup without login | Form submits |
| 15 | Admin Careers → Applications → change status | Persists |
| 16 | `/about?preview=1` with draft session | Shows draft about copy |

---

## Conclusion

**Goal finished:** café platform + landing CMS parity + remaining backlog items are either implemented or explicitly accepted under SOPs. Scorecard **100%** within that definition. Automatic payment refunds and Mix & Match storefront remain optional product expansions, not silent holes.
