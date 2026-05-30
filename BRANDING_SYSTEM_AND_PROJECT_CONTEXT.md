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

### Stack and architecture
- React + TypeScript + Vite
- Tailwind CSS v4 tokenized with `@theme`
- Motion library for animation (`motion/react`)
- React Router with routes:
  - `/` Home
  - `/menu` Menu
  - `/about` About
  - `/contact` Contact

### Current UI foundation
- Pages and major sections are already built and visually rich.
- Brand-colored theme tokens exist in CSS:
  - `--color-kado-cream: #EFE6D5`
  - `--color-kado-red: #9B2B2C`
  - `--color-kado-dark: #2A2A2A`
- Reusable structure exists (`Navbar`, `Footer`, `SectionHeader`).
- Voice and copy already lean toward "urban tambayan + premium craft."

### Major alignment gaps vs fixed brand system
1. **Typography mismatch**
   - Current web fonts are `Space Grotesk`, `Inter`, and `Playfair Display`.
   - Brand system requires `Zalando Sans Expanded` + `M Plus 1`.

2. **Color token drift**
   - Current colors are close, but not exact to brand guideline values.
   - Should normalize to fixed palette (`#F1DFBA`, `#9E181D`, `#191919`, `#FAF9F6`).

3. **Logo usage inconsistency**
   - Navbar/footer currently use a text treatment + kanji box.
   - Official lockups in `public/logo` and `public/Branding` are not yet fully integrated.

4. **Image sourcing mismatch**
   - Most page imagery still loads from Unsplash URLs.
   - Brand-ready local assets already exist in `public/Branding`, `public/logo`, and `public/images`.

5. **Collateral style not fully transferred to web**
   - The high-energy Japanese overlay treatment from social collaterals is only partially reflected in web sections.

## 4) Project Progress Status

### Already strong
- Multi-page site structure is complete.
- Motion and section storytelling are implemented.
- Product/menu and contact journey are functional.
- Location/hours/contact details are present and coherent.

### Not yet finished for full brand lock
- Exact typography implementation
- Exact color calibration
- Official mark system deployment across all key surfaces
- Local asset replacement for external stock dependencies
- Consistent treatment rules for Japanese overlays and campaign art

## 5) Practical Guidance for Next Iterations

Use this order when continuing implementation:

1. **Brand tokens first**
   - Update global color and font tokens in one pass.
2. **Header/footer logo standardization**
   - Replace temporary text mark with official lockups.
3. **Hero and key sections**
   - Swap external images with approved local brand imagery where available.
4. **Type hierarchy enforcement**
   - Map H1/H2/H3/body/subtext classes to the fixed type scale.
5. **Collateral consistency**
   - Introduce reusable patterns for kanji overlays and campaign block compositions.

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

---

If this document changes, it should only be updated when the brand source files are updated or a formal direction shift is approved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  