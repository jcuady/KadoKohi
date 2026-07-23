# Kado Kohi — AI agent instructions

This repo is a **full-stack café operations platform** (not just a landing page).

## Start here

1. Read **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** — the system bible:
   - §4 routes · §6–8 orders & payments · §11 Supabase/RPCs · §23–30 repo reference
2. For durable typed system memory (pages, roles, mutations, flows): **[schema/](./schema/)** — `kado-system.graphql` + `SYSTEM_INVENTORY.md` (documentation GraphQL only; runtime is still Supabase RPCs).
3. Follow **[.cursor/rules/karpathy-guidelines.mdc](./.cursor/rules/karpathy-guidelines.mdc)** — think first, minimal diffs, verify with tests/build.
4. For brand/UI work: **[BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md](./BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md)** §1–2 (identity) and §3–5 (implementation gaps).
5. For **Web Push on any project / AI with no context:** **[docs/WEB_PUSH_AGENT_PLAYBOOK.md](./docs/WEB_PUSH_AGENT_PLAYBOOK.md)**. Kado-specific matrix + QA: **[docs/PWA_WEB_PUSH.md](./docs/PWA_WEB_PUSH.md)**.

Cursor loads `.cursor/rules/project-context.mdc` automatically in every chat.

## Hard rules

| Rule | Detail |
|------|--------|
| Orders | Always `kk_place_order` RPC — never direct INSERT |
| Secrets | Never commit `.env`, service role keys, or tokens |
| Branches | Active: `branch_marikina` / `marikina`, `branch_greenhills` / `greenhills` |
| Internal login | `/management-portal` only (not on customer `/auth/login`) |
| Auth | Supabase Auth for all roles; `VITE_SUPABASE_*` + `VITE_SITE_URL` on Vercel; Resend SMTP in Supabase dashboard for auth emails |
| Ground truth | `src/App.tsx` → `src/types/domain.ts` → `supabase/migrations/` → this doc |
| Supabase MCP | **Always** `plugin-supabase-supabase` with `project_id=idwtlujcdfnnndxmlaco` — never `user-supabase` |

## Verify changes

```bash
npm run lint
npm run build
```

Optional smoke probes: `scripts/probe_branch_crud.py`, `scripts/probe_greenhills_branch.py`, `scripts/probe_storage_buckets.py`

## Key entry points

| Concern | Location |
|---------|----------|
| Routes | `src/App.tsx` |
| Bootstrap | `src/main.tsx` |
| Domain types | `src/types/domain.ts` |
| Auth | `src/store/authStore.ts`, `src/lib/supabase/repositories/auth.ts`, `src/lib/supabase/authSession.ts`, `src/lib/supabase/client.ts` |
| Orders | `src/store/orderStore.ts`, `src/lib/supabase/repositories/ordering.ts` |
| QR ordering | `src/pages/OrderQR.tsx`, `src/pages/OrderTakeout.tsx` |
| Online cart | `src/components/CartDrawer.tsx` |
| Role guards | `src/components/RoleGate.tsx`, `src/lib/roles.ts` |
| Realtime | `src/lib/supabase/operationsRealtime.ts` |
| Brand tokens | `src/lib/brandTokens.ts`, `src/index.css` |
| Migrations | `supabase/migrations/` |
| Edge functions | `supabase/functions/` |
| Env template | `.env.example` |

## Production

- **Supabase:** `idwtlujcdfnnndxmlaco` — `https://idwtlujcdfnnndxmlaco.supabase.co`
- **Supabase MCP:** `plugin-supabase-supabase` + `project_id=idwtlujcdfnnndxmlaco` for all DDL/SQL
- **Site:** https://www.kadokohi.com
- **Super admin:** `admin@kadokohi.com`
