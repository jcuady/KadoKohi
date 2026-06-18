# Kado Kohi — AI agent instructions

This repo is a **full-stack café operations platform** (not just a landing page).

## Start here

1. Read **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** — architecture, routes, order flows, Supabase schema, roles, and recent changes.
2. Follow **[.cursor/rules/karpathy-guidelines.mdc](./.cursor/rules/karpathy-guidelines.mdc)** — think first, minimal diffs, verify with tests/build.

Cursor loads `.cursor/rules/project-context.mdc` automatically in every chat.

## Verify changes

```bash
npm run lint
npm run build
```

## Key entry points

| Concern | Location |
|---------|----------|
| Routes | `src/App.tsx` |
| Domain types | `src/types/domain.ts` |
| Auth | `src/store/authStore.ts` |
| Orders | `src/store/orderStore.ts`, `kk_place_order` RPC |
| Admin branches | `src/pages/admin/AdminBranches.tsx`, `src/store/branchStore.ts` |
| QR ordering | `src/pages/OrderQR.tsx`, `src/pages/OrderTakeout.tsx` |
| Migrations | `supabase/migrations/` |

## Production

- **Supabase:** `idwtlujcdfnnndxmlaco`
- **Site:** https://www.kadokohi.com
