---
domain: Next.js full-stack (App Router, RSC, Server Actions, Route Handlers)
audience: AI coding agents (Claude Code, Cursor)
context: Deltapag fintech. The server/client boundary IS the security boundary.
priority_order: correctness > security > reversibility > clarity > performance > convenience
depends_on: frontend.md (client rules), backend.md (server rules) — this file covers the seam
---

# Guardrails — Next.js Full-Stack

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human.
This file governs the server↔client seam specifically. Apply `frontend.md` to client components and `backend.md` to server logic.

## The server/client boundary

- MUST assume everything in a Client Component (and anything it imports) ships to the browser. NEVER import server-only code (DB clients, secrets, service-role keys, private SDKs) into a module reachable from `"use client"`.
- MUST mark server-only modules with `import "server-only"` so a leak fails the build instead of shipping.
- NEVER pass secrets, full PII, or privileged objects as props from a Server Component into a Client Component — pass only the minimal, already-authorized data the UI needs.
- MUST prefix browser-exposed env vars with `NEXT_PUBLIC_` intentionally. NEVER `NEXT_PUBLIC_` a secret. Server-only env stays unprefixed and is read only in server code.

## Server Actions & Route Handlers

- MUST authenticate and authorize inside every Server Action and Route Handler. A Server Action is a public HTTP endpoint — treat it exactly like one. NEVER assume it's safe because it's only called from your own UI.
- MUST validate every argument to a Server Action with a schema (e.g. Zod) before use. Inputs are attacker-controlled.
- MUST enforce object-level authorization in the action body (does this user own this record?), not only at the page/layout level.
- SHOULD keep Server Actions thin: validate → authorize → call a domain/service function → revalidate. Put business logic in testable server modules, not in the action.
- MUST require idempotency keys for money-moving Server Actions/handlers (see rest-api.md and backend.md).

## Rendering, caching & data

- MUST set caching intent explicitly. NEVER cache per-user or auth-gated data at a shared layer. Know whether each fetch is static, dynamic, or user-scoped, and mark it (`cache`/`revalidate`/`no-store`) — wrong caching of authenticated data is a cross-tenant leak.
- MUST call `revalidatePath`/`revalidateTag` after a mutation so the UI reflects committed state. NEVER show optimistic success for a financial action without server confirmation.
- SHOULD fetch data in Server Components close to where it's rendered; avoid client-side fetching for data the server already has.
- MUST scope every data fetch by the authenticated principal/tenant. NEVER reuse a request-scoped client across users.

## Middleware & routing

- MUST treat `middleware.ts` as defense-in-depth (coarse gating, redirects), NEVER as the only authorization layer — the real check lives in the action/handler/data layer.
- SHOULD keep middleware fast and side-effect-free; no DB writes there.

## Hygiene

- MUST keep `NODE_ENV`-appropriate config; NEVER hardcode environment URLs/keys.
- NEVER log request bodies that may contain PII or card data (LGPD/PCI). Mask before logging.
- SHOULD set security headers (CSP, HSTS, `X-Content-Type-Options`) via config or middleware.

## STOP-and-ask triggers

Halt before: adding a Server Action that moves money or mutates settlement state, changing caching of authenticated data, exposing a new `NEXT_PUBLIC_` value, or relaxing a middleware/auth check.
