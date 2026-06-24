---
domain: Supabase (Postgres, RLS, Auth, Edge Functions, Storage)
audience: AI coding agents (Claude Code, Cursor)
context: Deltapag fintech + Moneo. RLS is the security boundary; the anon key is public.
priority_order: data-isolation (RLS) > key-handling > migration-safety > correctness > convenience
---

# Guardrails — Supabase

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human.

## Keys & trust boundary

- MUST treat the `anon`/publishable key as public — it ships to browsers. Security comes from RLS, NOT from key secrecy. NEVER rely on "the key is hard to find."
- NEVER expose or ship the `service_role` key to any client, frontend bundle, or `NEXT_PUBLIC_` var. It bypasses RLS entirely. It lives only in trusted server/Edge Function env, fetched from a secret store.
- MUST use the user-scoped client (anon key + the user's JWT) for anything acting on behalf of a user, so RLS applies. Use `service_role` only in trusted server code for deliberate admin operations, and scope each use tightly.

## Row Level Security (the core control)

- MUST enable RLS on every table holding user/tenant/financial data, and write explicit policies. A table without RLS + policies is a data breach. NEVER leave RLS off on a data table.
- MUST scope policies by `auth.uid()` / tenant claim so a user can only read/write their own rows (and a merchant only its own data). NEVER write a policy that returns rows across users/merchants unless that's an explicit, reviewed admin path.
- MUST write separate, minimal policies per operation (`select`, `insert`, `update`, `delete`) with correct `using` and `with check`. NEVER use a permissive `using (true)` on a data table.
- MUST verify new tables and policies with a test that proves cross-user access is denied. STOP before merging a schema change that adds a table without RLS.
- SHOULD keep authorization logic in the database (RLS + `security definer` functions with care), so every client path is protected uniformly.

## Migrations & schema (reversibility)

- MUST express schema changes as versioned migrations. NEVER run ad-hoc DDL against production via the dashboard/SQL editor for anything non-trivial.
- STOP before any destructive migration (drop column/table, type change that loses data, `NOT NULL` on a populated column, backfill). Show: what's irreversible, the rollback/restore path, and a backup confirmation. Wait for explicit "proceed."
- MUST make migrations forward-safe for zero-downtime: add columns nullable first, backfill, then constrain; expand-then-contract for renames. NEVER drop a column the running app still reads.
- SHOULD test migrations on a branch/preview DB before production; review the diff.

## Edge Functions

- MUST authenticate/authorize inside each Edge Function; validate input with a schema. Treat it as a public endpoint.
- MUST verify webhook signatures before processing (see backend.md). NEVER trust an unverified payload.
- NEVER hardcode secrets in function code — read from function secrets/env.
- SHOULD make functions idempotent for any retried/webhook-driven work.

## Storage

- MUST set Storage bucket policies/RLS so users access only their own objects. NEVER make a bucket public unless the content is genuinely public — and flag it.
- SHOULD use signed URLs with short TTLs for private file access.

## Data protection

- NEVER log JWTs, the service_role key, or PII/card data. Mask before logging (LGPD/PCI).
- MUST keep money as integer minor units or `numeric` — NEVER float columns for money.

## STOP-and-ask triggers

Halt before: creating a table without RLS, weakening/`using(true)` a policy, any destructive migration, using `service_role` in a new place, or making a bucket public.
