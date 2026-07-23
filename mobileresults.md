kadokohi.com — Lighthouse Mobile Fix Spec

Source: PageSpeed Insights, mobile, https://www.kadokohi.com Score: Performance 66 (FCP 4.1s 🔴 · LCP 5.7s 🔴 · SI 5.8s 🟡 · TBT 60ms 🟢 · CLS 0 🟢)

Goal: get LCP under 2.5s and FCP under 1.8s. CLS/TBT are already fine — don't touch anything that risks them.

Priority 1 — Fix the oversized, lazy-loaded images (~381 KiB savings)

Problem: Images are served at 3–5x the size they're displayed at, and some are loading="lazy" even though they're above the fold / part of the visible-on-load grid.

Element	Served	Displayed	File	Savings
Featured coffees grid image	1604×1536	527×395	Supabase kado-cms/.../4700b6d4....jpg	248.4 KiB
Matcha Strawberry Latte	1200×1200	266×266	Supabase kado-menu/products/prod_matcha_straw.jpg	53.9 KiB
Dirty Matcha Oat Latte	1200×1200	266×266	Supabase kado-menu/products/prod_dirty_matcha.jpg	49.0 KiB
Espresso mobile hero	866×1600	429×762	/mobile/espresso.webp	29.4 KiB

Fix instructions:

Add a Supabase image transform (?width=&height=&quality=&resize=cover) or run these through a resize step at upload time, generating at minimum 1x/2x sizes matching actual display dimensions (e.g. 527×395 and 1054×790 for the grid image, not 1604×1536).
Add srcset + sizes to every <img> pulling from Supabase storage so the browser picks the right density instead of always downloading the source file.
Re-encode to WebP/AVIF where not already (the Supabase product photos look like raw JPGs).
section.relative > div.grid > a.group > img.absolute (the 271 KiB featured-coffee image) — confirm whether this is above the fold on load. If yes, remove loading="lazy" and don't add fetchpriority="high" unless it's the actual LCP element (see Priority 2). If it's below the fold, lazy-load is correct — just fix the size (issue #1 above), which is 90% of the savings anyway.
Priority 2 — Confirm the real LCP element and prioritize it

The audit says LCP-discovery checks currently pass (no loading=lazy on the LCP image, fetchpriority=high applied, discoverable in initial HTML). Good — don't break this. But LCP is still 5.7s, so the bottleneck is the critical request chain, not discoverability. Fix instructions:

Verify in DevTools > Performance which exact element Lighthouse is flagging as LCP on this run — hero text or hero image. If it's an image, make sure it's not one of the oversized Supabase files above.
Do NOT add fetchpriority="high" to more than one image. Multiple "high priority" hints defeats the purpose.
Priority 3 — Shorten the critical request chain (1,284ms chain latency)

Current chain:

HTML (176ms) → CSS index-DGlKjfsz.css (624ms, blocking)
                → fonts m-plus-1-700.woff2 (1,271ms)
                → fonts zalando-400.woff2 (1,284ms)
             → JS index-CPFrzupN.js (674ms)

Fonts are discovered through the CSS, so they don't start downloading until the CSS request resolves — that's the single biggest chunk of the 1.28s chain.

Fix instructions:

Add <link rel="preload" as="font" type="font/woff2" crossorigin> for m-plus-1-700.woff2 and zalando-400.woff2 directly in <head>, so they start downloading in parallel with the CSS instead of after it.
Add font-display: swap (or optional if brand font isn't critical) to both @font-face rules to avoid blocking text render while fonts load.
Self-host is already the case (good) — just fix the discovery order above.
Priority 4 — Eliminate render-blocking CSS (860ms block)

/assets/index-DGlKjfsz.css (32 KiB) blocks first paint for 860ms.

Fix instructions:

Extract and inline critical above-the-fold CSS (hero section, nav, cookie banner) directly in <head> as a <style> block.
Load the full stylesheet non-blocking: <link rel="stylesheet" href="..." media="print" onload="this.media='all'"> or use rel="preload" as="style" + swap.
If using Vite (filename pattern index-[hash].css suggests Vite), check if critical CSS extraction is already possible via a plugin (e.g. vite-plugin-critical) rather than hand-rolling it.
Priority 5 — Cut unused JavaScript (~363 KiB / 66% of shipped JS unused)
Bundle	Shipped	Unused
index-CPFrzupN.js	289.8 KiB	171.3 KiB
vendor-re….js (likely React/react-dom)	109.3 KiB	91.7 KiB
vendor-supabase-BTsOnGLq.js	54.2 KiB	43.3 KiB
vendor-gs….js (likely GSAP)	46.2 KiB	32.0 KiB
vendor-motion-zX-YgsLI.js (Framer Motion)	50.0 KiB	24.2 KiB

Fix instructions:

Route-split the app (React.lazy + Suspense) so /menu, /branches, checkout flow, and Kado Circle signup each ship their own chunk instead of one monolithic index-CPFrzupN.js. This is the highest-leverage fix — 171 KiB unused in the main chunk alone.
Audit GSAP and Framer Motion usage — both are animation libraries; if both are used, consolidate to one (Motion is smaller and covers most scroll/entrance animation needs GSAP is used for here). Running two animation libraries at once is a common accidental-bloat pattern.
For the Supabase vendor chunk: confirm you're importing only the client you need (@supabase/supabase-js client-only) and not pulling in unused sub-modules (realtime, storage-js extras) if this is a static landing page that only reads data.
Defer non-critical JS (Kado Circle signup form logic, analytics) with import() triggered on interaction/viewport-enter rather than bundling into the initial load.
Priority 6 — Minify vendor-ic….js (~5 KiB savings)

One vendor chunk (likely an icon library, e.g. lucide-react) is shipping unminified. Fix instructions: check the build config — if this is Vite/esbuild, confirm build.minify isn't disabled for this specific chunk (sometimes happens when a lib is externalized or copied raw instead of bundled).

Priority 7 — Fix color contrast (accessibility, not scored but flagged)

Multiple text elements use low-opacity utility classes on dark or light backgrounds that fail WCAG contrast:

text-kado-dark/55 on bg-kado-cream (body copy, "SWIPE FOR MORE", how-it-works text)
text-white/35, text-white/40 on bg-kado-dark (Kado Circle section labels: FRIENDS OF THE CORNER, BRANCHES, MENU ITEMS, STAMP LOYALTY, GOOD VIBES, EXPLORE)
text-kado-dark/40 (EXPLORE label)

Fix instructions:

Raise these opacity/color values until they pass 4.5:1 (body text) / 3:1 (large text ≥18px or 14px bold). As a starting point: bump /55 → /70+, /40 → /60+, /35 → /60+, and re-test — don't guess, verify with a contrast checker against the actual bg-kado-cream/bg-kado-dark hex values.
This is a design-system-wide fix — search the codebase for all text-kado-dark/, text-white/, text-kado-cream/ opacity utilities below 60% and audit each against its background.
Priority 8 — Fix inconsistent link labeling

Three separate <a href="/menu"> and <a href="/menu?product=prod_matcha_oat"> elements all use the visible/accessible text "Matcha Oat Latte" but point to different destinations (two identical /menu, one with a query param).

Fix instructions: Either make all three links point to the same destination (/menu?product=prod_matcha_oat), or give the two plain /menu links distinct accessible text (e.g. aria-label="View full menu") so identical text doesn't imply identical destinations.

Priority 9 — Add source maps for production JS

index-CPFrzupN.js ships with no source map. Fix instructions: enable build.sourcemap: true (or 'hidden' if you don't want maps publicly linked, just uploaded to your error-tracking tool e.g. Sentry) in the Vite config for production builds.

Suggested build order for the agent
Image pipeline: resize + srcset + re-encode (Priority 1) — biggest single win, no architecture risk.
Font preload + font-display (Priority 3) — small, safe, high impact on LCP.
Critical CSS inline + async stylesheet (Priority 4).
Route-based code splitting (Priority 5) — biggest but highest-effort win; do after the quick wins above so you can measure LCP/FCP improvement in isolation first.
Contrast + link-label fixes (Priority 7–8) — no perf risk, do anytime.
Source maps (Priority 9) — build config only, zero user-facing risk.

Acceptance criteria: re-run PageSpeed Insights mobile after each priority group; target LCP < 2.5s, FCP < 1.8s, Speed Index < 3.4s, performance score ≥ 90, with CLS staying at 0 and TBT staying under 200ms.