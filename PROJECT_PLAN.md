# Kado Kohi — Platform Plan (Public Site + Operations Suite)

> **⚠️ Historical document.** This plan was written during the mock Zustand-only phase (local auth, no Supabase, Greenhills "coming soon"). **Most goals are shipped** on production Supabase. For current architecture, routes, and order flows use **`PROJECT_CONTEXT.md`**. For brand identity use **`BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md`** §1–2.

This is the single source of truth for evolving the Kado Kohi landing page into a multi-role platform: public marketing site + customer accounts + barista kiosk + admin SaaS.

This plan follows:
- `BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md` (locked brand identity)
- `skills/fullstack-developer.md` (end-to-end thinking, DB-aligned API contracts, type safety)
- `skills/ui-designer.md` (design tokens, role-specific UI patterns, accessibility)

Reference menu source: `public/KADO MENU V2 FLYER.jpg`

---

## 1) Goals

### Business goals
1. Keep the public landing experience premium and on-brand (day-to-night, social, Gen-Z aesthetic).
2. Add a **Customer** account flow (orders, loyalty, Kado Circle).
3. Add a **Barista Kiosk** to view, queue, and process orders coming from QR-table dine-in *and* takeout (separately from online orders).
4. Add an **Admin SaaS** so the owner can fully run the shop:
   - CRUD menu (categories, products, modifiers, pricing, images).
   - CRUD events (the same events that surface on the landing page).
   - CRUD branches (multi-branch from day one — Marikina + Greenhills coming soon).
   - View/process orders across channels (POS-style).
   - Add fully custom sections and product detail fields.
5. Make all data shapes **database-ready** even though storage is **local Zustand** for now.

### Non-goals (for current phase)
- Real payments / gateway integration.
- Real-time websockets backend.
- Email delivery infrastructure.
- Production auth (we mock with role-based local auth that maps cleanly to JWT later).

---

## 2) Roles, Permissions, Surfaces

| Role     | Auth scope          | Primary surface                       | Can do                                                                  |
|----------|---------------------|---------------------------------------|-------------------------------------------------------------------------|
| Guest    | none                | Landing site                          | Browse, view menu, view branches, view events, sign up                  |
| Customer | self                | Landing + Customer dashboard          | Online orders, loyalty stamps, Kado Circle profile, order history       |
| Barista  | branch-scoped       | Barista Kiosk (full-screen workspace) | View incoming orders by channel, advance order status, mark ready/done  |
| Admin    | tenant-wide         | Admin SaaS dashboard                  | CRUD menu/events/branches/users, view all orders, run POS, settings     |

Auth enforcement rules:
- Public marketing routes: open to all.
- Customer routes (e.g. `/account/*`): require `customer` or above.
- Barista routes (`/barista/*`): require `barista` or `admin`.
- Admin routes (`/admin/*`): require `admin`.

Implementation now (mock):
- A single Zustand `useAuthStore` with `currentUser` + `role`.
- `<RoleGate role="admin">` wrapper component for route protection.
- Future swap: replace Zustand auth with real JWT/session — components keep the same `useAuth()` hook contract.

---

## 3) Information Architecture / Routes

### Public site (existing + new)
- `/` Home (hero day-to-night, signature sips, events preview, Kado Circle, branches strip)
- `/menu` Menu (driven by Admin CRUD, with size/temp/milk options reflected)
- `/branches` **NEW** — list of branches with “Coming soon” badge for Greenhills
- `/events` Events listing (driven by Admin CRUD)
- `/about` About
- `/contact` Contact
- `/order` Online order entry (channel = `online`)
- `/order/qr/:tableCode` QR-table dine-in entry (channel = `dine-in`, locks to that table)
- `/order/takeout` Takeout entry (channel = `takeout`, generic shop QR)
- `/auth/login`, `/auth/signup`

### Customer (logged in)
- `/account` Dashboard (active order, last order, loyalty)
- `/account/orders` Order history
- `/account/profile` Profile

### Barista Kiosk
- `/barista` Active orders board (kiosk UI, sidebar nav left)
- `/barista/queue` Full queue
- `/barista/pos` In-store POS (counter ordering)
- `/barista/menu` Read-only menu reference

### Admin SaaS
- `/admin` Dashboard (KPIs)
- `/admin/orders` All orders (filterable by channel/branch/status)
- `/admin/pos` Admin POS (same engine as barista POS, but cross-branch)
- `/admin/menu` Menu CRUD (categories + products + modifiers + custom fields)
- `/admin/events` Events CRUD
- `/admin/branches` Branches CRUD
- `/admin/tables` Tables + QR generator
- `/admin/sections` Custom landing sections CRUD
- `/admin/users` Users + roles
- `/admin/settings` Settings (taxes, hours, brand toggles)

---

## 4) Order Channels (critical separation)

Orders must be grouped and visible **separately** even though they share the same data model.

| Channel    | How order is created                              | Identifying fields            | Visible to        |
|------------|---------------------------------------------------|-------------------------------|-------------------|
| `online`   | `/order` (logged-in or guest checkout)            | `customerId?`, no `tableId`   | Admin only (later: barista if assigned to branch) |
| `dine-in`  | Customer scans **table QR** → `/order/qr/:code`   | `tableId` required            | Barista + Admin   |
| `takeout`  | Customer scans **takeout QR** at counter          | no `tableId`, `pickupName`    | Barista + Admin   |
| `pos`      | Barista or Admin enters at counter                | `staffId` required            | Barista + Admin   |

The Barista Kiosk view shows only **dine-in + takeout + pos** (in-store work).
The Admin Orders view shows **all four channels** with channel filter chips.

---

## 5) Data Model (DB-ready, mirrored 1:1 in Zustand)

All shapes are TypeScript interfaces co-located in `src/types/domain.ts`. Each interface is named to map cleanly to a future Postgres table.

### 5.1 Brand-level
```ts
type Branch = {
  id: string;                    // ulid
  slug: string;                  // 'marikina' | 'greenhills'
  name: string;
  address: string;
  city: string;
  status: 'active' | 'coming_soon';
  hours: { day: 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'; open: string; close: string }[];
  heroImage?: string;
  createdAt: string;
  updatedAt: string;
};
```

### 5.2 Menu
```ts
type MenuCategory = {
  id: string;
  branchId?: string | null;     // null = applies to all branches
  name: string;                  // e.g. "Espresso Based Classics"
  order: number;
  visible: boolean;
};

type ProductSize = {
  id: string;
  label: string;                 // 'Regular', '12oz', '16oz'
  priceDelta: number;            // 0 means base price
};

type ProductTemperature = 'hot' | 'iced' | 'both';

type MilkOption = {
  id: string;
  label: string;                 // 'Fresh', 'Oat', 'Soy', 'Almond'
  priceDelta: number;            // e.g. 50 for Oat/Soy
};

type ProductCustomField = {
  id: string;
  key: string;                   // free-form key set by admin (e.g. 'caffeine')
  label: string;
  value: string;
};

type Product = {
  id: string;
  categoryId: string;
  branchId?: string | null;
  name: string;
  description?: string;
  basePrice: number;             // PHP
  image?: string;
  temperature: ProductTemperature;
  sizes: ProductSize[];          // can be empty
  milks: MilkOption[];           // empty for non-milk drinks
  tags?: string[];               // 'iced-only', 'bestseller', 'new'
  customFields?: ProductCustomField[];
  visible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};
```

Seed data is taken from `public/KADO MENU V2 FLYER.jpg`:

- **Espresso Based Classics**: AmeriKado ₱130, Cafe Latte ₱160, Cappuccino ₱160, Flat White ₱150, Moka Latte ₱170, Karamel Latte ₱170, Spanish Latte ₱170.
- **Espresso Based Signatures**: KADO Latte ₱195 *(iced only)*, Ube Shio Karamel Latte ₱195, Yuzu AmeriKado ₱195 *(iced only)*, Nori Salted Cream Latte ₱195 *(iced only)*.
- **Matcha & Hojicha**: Matcha Oat Latte ₱170, Dirty Matcha Oat Latte ₱200, Matcha Strawberry Oat Latte ₱180 *(iced only)*, Hojicha Oat Latte ₱200, Salted Cream Hojicha Oat Latte ₱210 *(iced only)*.
- **Yuzu Soda**: Yuzu Lime Soda ₱140 *(iced only)*, Yuzu Strawberry Soda ₱140 *(iced only)*.

Pricing rule: **Oat / Soy = +₱50** added at order time (modifier-driven, not duplicated in product price).

### 5.3 Tables + QR
```ts
type Table = {
  id: string;
  branchId: string;
  code: string;                  // short, URL-safe, e.g. 'mrk-t04'
  label: string;                 // 'Table 4'
  qrPayload: string;             // canonical URL: https://site/order/qr/<code>
  active: boolean;
};

type TakeoutQr = {
  id: string;
  branchId: string;
  qrPayload: string;             // https://site/order/takeout?b=<branchSlug>
};
```

### 5.4 Orders
```ts
type OrderChannel = 'online' | 'dine-in' | 'takeout' | 'pos';
type OrderStatus =
  | 'pending'        // just placed
  | 'accepted'       // barista acknowledged
  | 'preparing'
  | 'ready'          // ready for pickup / serve
  | 'served'         // dine-in served at table
  | 'completed'
  | 'cancelled';

type OrderItem = {
  id: string;
  productId: string;
  productNameSnapshot: string;    // protect against menu edits later
  sizeId?: string;
  sizeLabelSnapshot?: string;
  milkId?: string;
  milkLabelSnapshot?: string;
  temperature?: 'hot' | 'iced';
  notes?: string;
  unitPrice: number;              // resolved at order time
  qty: number;
  lineTotal: number;
};

type Order = {
  id: string;
  shortCode: string;              // human-friendly e.g. 'KK-0421'
  channel: OrderChannel;
  branchId: string;
  tableId?: string;               // dine-in only
  customerId?: string;            // online or logged-in
  guestName?: string;             // takeout pickup name
  staffId?: string;               // pos only
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  modifiersTotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};
```

### 5.5 Events
```ts
type Event = {
  id: string;
  branchId?: string | null;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  cover?: string;
  cta?: { label: string; href: string };
  visible: boolean;
  highlight?: boolean;            // shown as 'Next Massive Event' on landing
};
```

### 5.6 Custom landing sections
Lets the owner add brand-aligned sections without code changes.

```ts
type CustomSection = {
  id: string;
  page: 'home';                   // expandable later
  type: 'hero' | 'image-text' | 'gallery' | 'cta' | 'stat';
  title?: string;
  body?: string;
  image?: string;
  ctaLabel?: string;
  ctaHref?: string;
  order: number;
  visible: boolean;
};
```

### 5.7 Users
```ts
type Role = 'guest' | 'customer' | 'barista' | 'admin';

type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId?: string;              // baristas are scoped to one branch
  loyaltyStamps?: number;         // customers
  createdAt: string;
};
```

---

## 6) State Architecture (Zustand → DB swap path)

Each Zustand store has a 1:1 relationship to a future REST resource so the migration is a pure transport swap.

| Store          | Local responsibility       | Future API endpoint           |
|----------------|----------------------------|-------------------------------|
| `useAuthStore` | current user, login/logout | `POST /auth/login`, `GET /me` |
| `useMenuStore` | categories + products      | `/api/menu/*`                 |
| `useBranchStore`| branches                  | `/api/branches/*`             |
| `useTableStore`| tables + qr payloads       | `/api/tables/*`               |
| `useOrderStore`| orders feed (all channels) | `/api/orders/*`               |
| `useEventStore`| events                     | `/api/events/*`               |
| `useSectionStore`| custom landing sections  | `/api/sections/*`             |
| `useUserStore` | users + roles              | `/api/users/*`                |

Conventions:
- Every store exposes typed CRUD: `list`, `getById`, `create`, `update`, `remove`.
- Persistence via `zustand/middleware -> persist` (localStorage).
- Selectors are colocated with the store, never inline in components.
- Each store has a `seed()` function callable once for first run (loads the menu data above).

When a real DB lands, only the store internals are replaced (e.g. `fetch` calls); component code does not change.

---

## 7) Feature Specs

### 7.1 Branches (multi-branch ready)
- Nav header gets a **Branches** menu item.
- Landing page shows a branches strip with status pills:
  - Marikina — `Active`
  - Greenhills — `Coming Soon` badge styled with `kado-red` outline.
- `/branches` page lists each branch with hours, address, hero image, and CTA.
- Admin can add/edit branches.

### 7.2 Customer accounts
- Sign up / login (mock, Zustand-only).
- Customer dashboard: active order, recent orders, Kado Circle stamp counter.
- Online order flow at `/order` writes an `Order` with `channel: 'online'`.

### 7.3 QR ordering (dine-in + takeout)
- Admin generates **per-table QRs** (each table has a unique `code`) and a **single takeout QR per branch**.
- Scanning a table QR opens `/order/qr/:code`:
  - Order is locked to that table.
  - Channel is forced to `dine-in`.
- Scanning the takeout QR opens `/order/takeout?b=<branch>`:
  - User enters a pickup name.
  - Channel is forced to `takeout`.
- Both flows route the order into `useOrderStore` and immediately appear on the Barista Kiosk.

### 7.4 Barista Kiosk (in-shop ops)
- Layout: **kiosk-first, full-bleed, sidebar on the left.**
- Sidebar: Active board / Queue / POS / Menu / Sign out.
- Active board:
  - 3-column kanban: `Pending → Preparing → Ready`.
  - Channel chips (`Dine-in` / `Takeout` / `POS`) — `Online` is hidden by default at kiosk per scope rule.
  - Each card shows: short code, table label or pickup name, item summary, time-since-placed.
  - Big tap targets, single-tap status advance.
- POS:
  - Touch-optimized tile menu, grouped by category.
  - Cart drawer on the right (or bottom on small screens).
  - Modifier sheet for size / temp / milk.
  - "Pay & Place" creates an `Order` with `channel: 'pos'`.

### 7.5 Admin SaaS
- Layout: **modern SaaS, sidebar left, top breadcrumbs, content card area.**
- Light theme uses brand cream/dark; dark theme allowed for long ops sessions.
- Pages call only their corresponding Zustand store; no cross-store coupling beyond clear selectors.
- Menu CRUD UI:
  - Drag-to-reorder categories and products.
  - Product edit form with: name, description, base price, temperature, image upload (local URL placeholder), sizes table, milks table (with Oat/Soy +₱50 prefilled), tags, **custom fields** repeater for free-form key/value pairs.
- Events CRUD UI: similar form pattern; `highlight` flag controls landing page “Next Massive Event” surfacing.
- Custom sections CRUD: lets admin compose new home page sections without code (limited types listed in `CustomSection.type`).

### 7.6 Customizable details (per product)
The product editor must allow:
- Required: name, base price, temperature, visible flag.
- Optional: description, image, tags.
- Repeaters: sizes, milks, custom fields.
- The renderer in `/menu` and the order flows must read whatever the admin defined — no hardcoded modifier list outside seed data.

---

## 8) Brand & UI Direction (per role)

All palettes pull strictly from `BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md`:
- `kado-cream #F1DFBA`, `kado-red #9E181D`, `kado-dark #191919`, `kado-offwhite #FAF9F6`.
- Display: `Zalando Sans Expanded`. Body: `M Plus 1`.

### Public site
- Editorial, premium, day-to-night narrative (already in progress).
- Branches and events surfaces inherit the same hero/section grammar.

### Barista Kiosk
- Single-purpose, **always full-screen**, dark-friendly variant of the brand.
- Sidebar left: 72px collapsed / 240px expanded.
- High-contrast cards: cream surface on `kado-dark` background, red status accents.
- Designed for **touchscreens**: minimum 44px hit targets, large legible typography (M Plus 1 Medium 16+).

### Admin SaaS
- Modern SaaS dashboard pattern: left rail (220px), persistent breadcrumb header, content cards on `kado-offwhite`.
- Tables, forms, and modals use the same brand tokens; no off-brand grays.
- Section headers use Zalando Sans Expanded; all data uses M Plus 1.
- Includes a brand-aligned empty state and helper-tip pattern for first-run guidance.

Accessibility:
- Color contrast ≥ WCAG AA across role surfaces.
- Focus rings always visible (no `outline: none`).
- Forms labeled and keyboard-navigable.

---

## 9) Folder Structure (target)

```
src/
  components/
    common/                   shared brand UI (buttons, inputs, modals, qr)
    layout/                   public Navbar/Footer + RoleLayout shells
    barista/                  kiosk-specific UI
    admin/                    admin-specific UI
  pages/                      route components (already partially in place)
    public/                   home, menu, about, contact, branches, events
    auth/                     login, signup
    account/                  customer pages
    barista/                  kiosk pages
    admin/                    admin pages
  store/
    auth.store.ts
    menu.store.ts
    branch.store.ts
    table.store.ts
    order.store.ts
    event.store.ts
    section.store.ts
    user.store.ts
  types/
    domain.ts                 all DB-ready interfaces
  lib/
    id.ts                     ulid/uuid helper
    qr.ts                     qr payload builder + render util
    money.ts                  PHP formatter
  data/
    seed.ts                   menu + branches + tables seed
```

---

## 10) Phased Rollout

### Phase 0 — Plan lock (this document)
- Approve plan, scope, data shapes.

### Phase 1 — Foundations
- Add domain types and Zustand stores (no UI changes).
- Add seed data from menu flyer.
- Add role-aware layout shell + `RoleGate` route guard.
- Add Branches store + nav entry + `/branches` page (Marikina active, Greenhills coming soon).

### Phase 2 — Public site evolution
- Make `/menu` data-driven from `useMenuStore`.
- Make `/events` data-driven from `useEventStore`.
- Add custom section renderer on home page.

### Phase 3 — Customer flow
- Auth (mock) + customer dashboard.
- Online order flow `/order`.

### Phase 4 — In-shop flow
- Tables + QR generator (admin) and QR-driven order screens.
- Barista Kiosk (active board + queue + POS).

### Phase 5 — Admin SaaS
- Menu CRUD with full custom fields and modifier system.
- Events CRUD + branches CRUD + custom sections CRUD.
- Admin POS + Admin orders board.

### Phase 6 — DB-readiness verification
- Add `src/lib/api.ts` thin wrapper that today calls Zustand, tomorrow calls REST.
- Confirm every component reads through the wrapper; nothing reads the store directly across role boundaries.

---

## 11) Acceptance criteria for first delivered slice

A pull request should land for each phase with:
- All new TypeScript interfaces in `src/types/domain.ts`.
- All affected stores added/updated and persisted.
- Route guards in place.
- All UI surfaces brand-token compliant (no off-brand colors, fonts, or shadows).
- Screenshots captured via the existing `npm run screenshots:hero` pattern, extended to other surfaces as we go.
- `npm run lint` clean.

---

## 12) Open questions to confirm before Phase 1 build

1. Should **online orders** also surface to baristas of the assigned branch (not just admin)?
2. Should **takeout QR** be one per branch, or per pickup station?
3. Do we want **guest checkout** for `/order` (no login required)?
4. Do we want **inventory tracking** (out-of-stock toggle) on each product, or only `visible` for now?
5. Brand: should the Greenhills coming-soon badge appear on **navbar** (small badge) and **branches strip** (large card), or only the branches strip?

Once these are answered, Phase 1 implementation begins.
