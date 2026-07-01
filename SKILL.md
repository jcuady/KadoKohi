---
name: andrej-karpathy-skill
description: Apply Andrej Karpathy-inspired coding-agent guidelines in Codex. Use when writing, reviewing, debugging, or refactoring code to surface assumptions, avoid overengineering, keep edits surgical, and define verifiable success criteria.
---

# Andrej Karpathy Skill

Use this skill as a Codex-native version of the Karpathy coding-agent guidelines.

The goal is not to add a new framework. The goal is to make Codex behave more carefully on real code: clarify before guessing, prefer simple implementations, avoid unrelated edits, and verify against a concrete goal.

## The Four Checks

### 1. Think Before Coding

Before editing, make the task explicit.

- State the interpretation you are using.
- Surface assumptions that affect the implementation.
- Name meaningful tradeoffs when more than one path is reasonable.
- Ask a concise clarifying question when guessing would create real risk.
- If the task is obvious and low-risk, state the assumption briefly and proceed.

Codex should not silently pick a risky interpretation and run with it.

### 2. Keep It Simple

Implement the smallest thing that satisfies the current request.

- Do not add features the user did not ask for.
- Do not add configurability before there is a real need.
- Do not create abstractions for one caller.
- Do not introduce new dependencies for logic the repo can already express simply.
- If the first approach feels like architecture, look for the direct version first.

Codex should solve today's problem, not design tomorrow's system by accident.

### 3. Make Surgical Changes

Keep the diff tied to the request.

- Touch only the files needed for the task.
- Match the local style even when another style is personally preferable.
- Do not reformat, rename, or reorganize adjacent code as a side effect.
- Clean up imports, variables, or helpers made unused by your own change.
- Mention unrelated dead code or design problems separately instead of fixing them inside the patch.

Codex should leave the surrounding code recognizable.

### 4. Define The Goal And Verify It

Turn the request into a checkable outcome before calling it done.

- Bug fix: identify the failing case and the expected behavior.
- Feature: identify the behavior the user should be able to observe.
- Refactor: identify the behavior that must remain unchanged.
- Review: identify concrete risks, missing tests, and regressions.

Use the narrowest meaningful verification available. If you do not run a check, say so plainly and explain why.

## Codex Response Pattern

For non-trivial coding work, keep the user oriented with:

```text
Assumption:
Changed:
Verified:
Remaining risk:
```

Use this shape lightly. Do not add ceremony to obvious one-line edits.

## Pushback

Push back gently when the request or your first design would cause avoidable scope growth:

- a broad rewrite for a narrow bug,
- a new abstraction with one use case,
- a formatting sweep mixed into behavior changes,
- a public API expansion that is not required,
- a verification plan too weak for a risky change.

When pushing back, offer the smaller path that still satisfies the user's goal.

---

## Kado Kohi project notes

Apply the four checks above first; use this section for repo-specific facts.

### Navigation (public + account shell)

- **One list for site links:** `src/config/siteNav.ts` → `PUBLIC_SITE_NAV`. Used by `Navbar` and `CustomerLayout` mobile menu so labels and paths stay identical (Coffee, Merch, Event Booking, etc.).
- **One list for account tabs:** `src/config/accountNav.ts` → `ACCOUNT_NAV`. Used by account header tabs (desktop) and the mobile hamburger account section.
- **Mobile account UX:** On viewports below `lg`, hide the horizontal account tab strip; account links live in the hamburger menu only (same items as desktop tabs).

### Customer phone (SMS-ready)

- Store on `kk_profiles.phone` as **E.164** `+639XXXXXXXXX` (`normalizePhilippinePhone` / `isValidPhilippinePhone` in `src/lib/phonePhilippines.ts`).
- Required on customer sign-up; persisted via `kk-customer-signup` edge function and auth trigger `kk_handle_new_user`.
- UI: `PhilippinePhoneField` (+63 prefix, 10-digit local part).

### Internal roles

- Admin / barista / staff: provisioned in Admin → Users; branch required for barista and staff (`branch_id` text, not UUID).
- Password change: `/barista/settings`, `/staff/settings` (`InternalAccountSettings`); customers use `/account/profile`.

### Supabase

- Migrations under `supabase/migrations/`; apply with `npx supabase db push --include-all`.
- Customer sign-up rate limits: `kk-customer-signup` edge function (not raw Auth `/signup`).
- **GCash QR (Admin → Settings):** Upload goes to public bucket `kado-gcash-qr` (`shop-gcash-qr.*`); the HTTPS URL is saved on `kk_app_settings.gcash_qr_image` (readable by all customers on QR/cart flows). Requires admin session for upload; errors surface in Settings UI.

### Coffee menu catalog

- **Source of truth:** `src/data/menuCatalog.ts` (4 categories + 18 drinks from KADO MENU V2).
- **DB seed:** migrations `0021` / `0022`; empty environments auto-bootstrap via RPC `kk_ensure_menu_catalog` (`0023`) on first `hydrateFromRemote()`.
- **Supabase project:** `VITE_SUPABASE_URL` on Vercel/local must match production (`https://idwtlujcdfnnndxmlaco.supabase.co`).
- **Milk modifiers:** `Milk` +0, `Oat` +40 (`MENU_MILK_OPTIONS`). No milk on AmeriKADO, Yuzu AmeriKado, Yuzu sodas.
- **Temperature:** `both` = hot + iced; `iced` = iced only (KADO Latte, Yuzu AmeriKado, Nori Salted Cream, Matcha Strawberry Oat, Salted Cream Hojicha, Yuzu sodas). Tag `iced-only` for UI hints.
- **Images:** `image` is null until assets are uploaded in Admin → Menu.
- **Admin Menu Manager** loads only coffee categories (`cat_classics` … `cat_yuzu`), not `cat_hidden_merch`. Legacy dummy rows are removed by migration `0022_cleanup_legacy_menu.sql`.
- **menuStore** starts empty until `hydrateFromRemote()`; if coffee categories are missing it calls `kk_ensure_menu_catalog`, then re-fetches. Admin → Menu shows **Initialize KADO MENU V2** when still empty.
- **Orders (QR / takeout / online):** `ensureOrderReadiness()` runs `kk_ensure_menu_catalog` + `kk_ensure_default_tables` (migration `0024`), refreshes menu/tables, prunes stale `kado-cart-v2` lines. `kk_place_order` validates product ids and dine-in `table_id` in Supabase — client seed-only data will fail until bootstrap runs.
- **QR checkout payment:** Dine-in (`/order/qr/:code`) and takeout (`/order/takeout?b=…`) carts offer **GCash QR** or **Cash** (`QrPaymentSelector`). GCash orders use `payment_method: gcash-qr`, `payment_status: unpaid`; guests upload proof via `kk_submit_guest_payment_proof` (migration `0025`). Admin/barista Orders kanban shows awaiting payment / verify payment like online cart orders.

### Branded QR cards (dine-in & takeout)

- **Source of truth:** `src/lib/brandedQrCard.ts` + `src/lib/brandTokens.ts` (see `BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md`).
- **Takeout:** portrait `1000×1500` — red `TAKEOUT` band, wordmark, branch, QR, pill, tagline + URL footer.
- **Dine-in:** strict **square** `1200×1200` — red `DINE IN` band, wordmark, flanked table title, table code, QR, then **bottom-anchored** URL + `SCAN TO ORDER` pill (no flowing tagline on square layout).
- **Layout rules (do not regress):**
  - Table title + code use **separate baselines** with `gap` between them — never `y += titleSize` twice (that caused `TABLE 1` / code overlap).
  - Dine-in footer is **measured from panel bottom** via `measureTableFooterTop` / `drawTableFooter` so the pill is never clipped.
  - QR size is `min(contentWidth × 0.72, space above footer)` — shrink QR before overlapping text.
  - Scan URLs always go through `getQrScanOrigin()` / `canonicalScanUrl()` → `https://www.kadokohi.com`.
- **Admin:** `AdminTables.tsx` passes `title` = table label, `subtitle` = table code (e.g. `MRK-T01`), `layout: 'table' | 'takeout'`.
