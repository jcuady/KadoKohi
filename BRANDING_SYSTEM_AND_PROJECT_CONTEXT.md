# Kado Kohi Branding System and Project Context

This document is the fixed reference for Kado Kohi visual identity and the current status of this landing page project.

## 1) Brand Identity (Fixed)

### Brand core
- **Brand name:** Kado Kohi
- **Name meaning:** "Kado" means corner/edge; "Kohi" means coffee.
- **Brand idea:** A Japanese-inspired urban "tambayan" where coffee quality and community connection are equally central.

### Logo system
- **Primary wordmark (stacked):** Bold custom geometric `KADO KOHI` lockup.
- **Horizontal wordmark:** Single-line `KADO KOHI` lockup for wide spaces.
- **Hybrid mark:** Kanji + latin lockup variant (`角 + ka/do`) for graphic/social use.
- **Symbol use:** Kanji character as a brand anchor for icon, badge, favicon, and pattern motifs.

### Typography system
- **Primary display font:** `Zalando Sans Expanded`
  - Intended for headlines and major brand statements.
  - Seen in heavy expanded styles for large visual impact.
- **Secondary text font:** `M Plus 1`
  - Intended for paragraph text, UI copy, and supporting details.
  - Also used for Japanese text accents.

### Type hierarchy (from brand boards)
- `Heading 1`: Zalando Sans Expanded Bold, about 36pt.
- `Heading 2`: Zalando Sans Expanded SemiBold/Medium, about 30pt.
- `Heading 3`: Zalando Sans Expanded SemiBold, about 24pt.
- `Body`: M Plus 1 Medium, about 14pt.
- `Body small`: M Plus 1 Regular/Normal, about 12pt.
- `Subtext`: M Plus 1 Light, about 10pt.
- `Accent`: M Plus 1 SemiBold for Japanese emphasis.

### Color system
- **Primary cream:** `#F1DFBA` (warm base)
- **Primary red:** `#9E181D` (brand dominant accent)
- **Near-black text/base:** `#191919`
- **Off-white light neutral:** `#FAF9F6`

### Extended accent palette (from collateral design explorations)
Used in posters/social graphics, not necessarily as core UI tokens:
- Saturated yellow
- Electric blue/violet
- Warm brown
- Burnt orange
- Deep green

### Visual language
- Strong contrast layouts: cream vs dark vs red.
- Bold typographic blocks with compressed spacing.
- Japanese character overlays as expressive graphic layer.
- Editorial collage style for social content (portrait, square, IG stories).
- Packaging style: red-forward cups/bags, repeated symbol patterns, highly legible marks.

## 2) Collateral and Image Analysis

### Packaging direction
- **Cup system:** Red cup variants for hot and cold formats with clear logo visibility.
- **To-go system:** Paper bag + molded fiber carrier; practical but on-brand.
- **Material mood:** Tactile, grounded, everyday-usable with premium visual finish.

### Social content direction
- **Portrait posts:** Product hero on red/cream fields with strong type.
- **Square posts:** Campaign tiles and opening announcements with bold typographic framing.
- **IG story style:** High-contrast, energetic, layered Japanese characters for motion-ready digital posts.

### Photography mood
From current image assets (`hero-coffee`, `hero-interior`) and collateral references:
- Warm ambient lighting
- Wood + concrete textures
- Community gathering scenes
- Craft and detail closeups (latte art, pastries, bar workflow)
- Overall tone: premium but approachable neighborhood ritual

## 3) Current Project Context (What Exists Now)

> **Synced June 2026.** For full architecture, routes, and order flows see **`PROJECT_CONTEXT.md`**. This section covers brand implementation status only.

### Stack and architecture
- React 19 + TypeScript + Vite 6 + React Router 7
- Tailwind CSS v4 with `@theme` tokens in `src/index.css`
- Zustand client caches synced to **Supabase** (Auth, Postgres, Storage, Realtime, RPCs, Edge Functions)
- Motion (`motion/react`) + GSAP on select sections
- Multi-surface platform: public site, customer account, barista kiosk, staff portal, admin SaaS, QR/takeout ordering

### Brand tokens in code (implemented)
Canonical values live in `src/lib/brandTokens.ts` and `src/index.css`:
- `--color-kado-cream: #F1DFBA`
- `--color-kado-red: #9E181D`
- `--color-kado-dark: #191919`
- `--color-kado-offwhite: #FAF9F6`
- `--font-display: "Zalando Sans Expanded", …`
- `--font-sans: "M PLUS 1", …`

Fonts are loaded from Google Fonts in `index.css`. Logo paths are centralized in `brandTokens.ts` (`LOGO.wordmark`, `LOGO.hybridMark`, etc.).

### Remaining alignment gaps vs fixed brand system
1. **Logo usage** — customer chrome (nav, footer, auth, QR/takeout, account, Help Install) and internal sidebars use official `LOGO.*` / `BrandHybridMark` / `BrandWordmark`. Decorative `角` watermarks and loyalty stamp motifs remain intentional per §1 symbol use.
2. **Image sourcing** — live UI defaults prefer local `public/` assets; offline seed data in `src/data/seed.ts` still uses Unsplash (CMS/prod overrides when loaded).
3. **Collateral style on web** — high-energy Japanese overlay treatment from social collaterals is only partially reflected (section watermarks + ordering carousel).
4. **Hero viewport** — client revision asked for 8–10vh next-section peek; current hero fills viewport below nav (cream gap removed). Revisit only if product wants peek restored.

## 4) Project Progress Status

### Already strong
- Canonical color and typography tokens deployed in CSS and `brandTokens.ts`.
- Official mark system on key surfaces (header, footer, auth, QR/takeout, internal portals).
- Full multi-page + operations platform (not just a landing page).
- Data-driven menu, merch, events, blog, and landing CMS.
- QR ordering, loyalty, and admin tooling on production Supabase.

### Not yet finished for full brand lock
- Optional: replace Unsplash URLs in seed/demo data with local photography.
- Deeper campaign-block / kanji-overlay patterns on remaining marketing sections.
- Hero peek height only if reinstated by client.

## 5) Practical Guidance for Next Iterations

Use this order when continuing brand work:

1. **Header/footer logo standardization** — use `LOGO` constants from `brandTokens.ts` everywhere.
2. **Hero and key sections** — swap external images for approved local assets; implement 8–10vh next-section peek.
3. **Type hierarchy enforcement** — map H1/H2/H3/body classes to the fixed type scale from §1.
4. **Collateral consistency** — reusable patterns for kanji overlays and campaign block compositions.

## 6) Asset Inventory Snapshot

### Branding references
- `public/Branding/10th Floor - Kado Brand Manual-1.png` to `-6.png`
- `public/Branding/Copy of 10th - Kado Typography Scheme.png`
- `public/Branding/KADO - Digital and Print Collaterals-1.png` to `-6.png`

### Logo assets
- `public/logo/Logo1.png` (horizontal wordmark)
- `public/logo/Logo2.png` (kanji + stacked latin hybrid)

### Photography assets
- `public/images/hero-coffee.png`
- `public/images/hero-interior.png`
- `public/mix-match/` — Kukidō collab cookie/drink images

### Related documentation
- **`PROJECT_CONTEXT.md`** — full platform architecture, routes, Supabase, stores, env vars, scripts
- **`AGENTS.md`** — AI agent bootstrap
- **`README.md`** — local dev quickstart

---

If this document changes, it should only be updated when the brand source files are updated or a formal direction shift is approved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  