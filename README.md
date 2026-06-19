# Kado Kohi

Multi-branch specialty coffee platform — public marketing site, customer accounts, QR dine-in/takeout ordering, barista kiosk, staff fulfillment, and admin SaaS.

| | |
|---|---|
| **Production** | [kadokohi.com](https://www.kadokohi.com) |
| **Architecture** | [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) — read this first |
| **AI agents** | [AGENTS.md](./AGENTS.md) |
| **Brand** | [BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md](./BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md) |
| **Supabase** | `idwtlujcdfnnndxmlaco` |

## Stack

React 19 · TypeScript · Vite 6 · Tailwind v4 · Zustand · Supabase (Auth, Postgres, Storage, Realtime, Edge Functions) · Playwright E2E · Resend email · PWA

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in Supabase keys
npm run dev                    # http://127.0.0.1:5174
```

## Environment variables

Copy `.env.example` → `.env.local`. Minimum for local dev:

```env
VITE_SUPABASE_URL="https://idwtlujcdfnnndxmlaco.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
VITE_SITE_URL="http://127.0.0.1:5174"
```

See `.env.example` for full list (Resend, VAPID push, Google Places, MCP tokens). **Never commit real secrets.**

## Verify before shipping

```bash
npm run lint      # TypeScript (tsc --noEmit)
npm run build     # production bundle → dist/
npm run test:e2e  # Playwright (build + preview on :4173)
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server (`127.0.0.1:5174`) |
| `npm run build` | Production build |
| `npm run preview` | Serve `dist/` locally (`:4173`) |
| `npm run lint` | TypeScript check |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run sync:google-reviews` | Sync Google reviews data |
| `npm run generate:sitemap` | Generate sitemap |

## Repository map

```
src/App.tsx              Routes (public, auth, account, admin, barista, staff, QR)
src/main.tsx             Bootstrap hydration + PWA + auth listener
src/types/domain.ts      Domain types
src/store/               23 Zustand stores
src/lib/supabase/        Client, realtime, repositories
supabase/migrations/     Postgres schema + RPCs (53 files)
supabase/functions/      Edge functions (signup, users, contact, push)
e2e/                     Playwright specs
scripts/                 Probes and ops helpers
```

Full layout: [PROJECT_CONTEXT.md §23](./PROJECT_CONTEXT.md#23-repository-layout).

## Surfaces & roles

| Role | Login | Surface |
|------|-------|---------|
| Guest | — | `/`, `/menu`, `/order/qr/:code`, `/order/takeout` |
| Customer | `/auth/login` | `/account/*` |
| Barista | `/management-portal` | `/barista/*` |
| Staff | `/management-portal` | `/staff/*` |
| Admin | `/management-portal` | `/admin/*` (+ barista routes) |

## Order channels

All orders go through **`kk_place_order` RPC** (never direct client INSERT):

`dine-in` · `takeout` · `online` · `pos` · `merch`

Details: [PROJECT_CONTEXT.md §6–8](./PROJECT_CONTEXT.md#6-order-channels).

## Deployment

Static Vite SPA → `dist/`. Configured for Vercel (`vercel.json` SPA rewrites). Canonical production URL: `https://www.kadokohi.com`.

## Documentation index

| File | When to read |
|------|--------------|
| `PROJECT_CONTEXT.md` | Architecture, routes, orders, Supabase, stores, env, scripts |
| `AGENTS.md` | AI agent bootstrap |
| `BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md` | Brand identity + UI gaps |
| `kado-kohi-revisions.md` | Client UX revision checklist |
| `PROJECT_PLAN.md` | Historical blueprint only (stale) |
