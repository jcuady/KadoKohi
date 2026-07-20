# Kado Kohi — GraphQL system model (durable memory)

This folder is the **canonical GraphQL-shaped record** of the whole Kado Kohi product: pages, roles, tables, RPCs, edge functions, and transactional flows.

## What this is

- A **documentation schema** (`kado-system.graphql`) agents and engineers use as permanent context.
- Field descriptions map each GraphQL operation to the real implementation (`kk_*` RPC, edge function, or PostgREST table).

## What this is not

- **Not a live GraphQL server.** Production still uses Supabase Auth + PostgREST + SECURITY DEFINER RPCs + Edge Functions.
- Do **not** enable `pg_graphql` or add Apollo/Yoga unless product explicitly decides to migrate the API surface.

## Why GraphQL SDL here

GraphQL’s type system is an excellent durable catalog (enums, inputs, mutations, auth notes). Recording the system this way gives future agents a single file that covers users, pages, and backend flows without inventing a second runtime.

## Source of truth order

1. Live code: `src/App.tsx`, `src/types/domain.ts`, `src/lib/supabase/repositories/*`, `supabase/migrations/*`, `supabase/functions/*`
2. This schema (must be updated when routes/RPCs/payments change)
3. `PROJECT_CONTEXT.md` (human-readable bible; links here)

## Files

| File | Purpose |
|------|---------|
| `kado-system.graphql` | Full SDL: enums, types, queries, mutations |
| `README.md` | This note |

## Update rule

When you add a route, role, RPC, edge function, payment path, or CMS domain: update `kado-system.graphql` in the same PR.
