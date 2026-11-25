# Module: Next.js (TypeScript)

Applies to: web frontends and full-stack web apps on Next.js App Router. Builds on the `node` base layer ([../node.md](../node.md): pnpm, TS strict, Biome + ESLint, Vitest). Framework scaffolding: `harness-nextjs` skill.

## 1. Pick the shape first
| Shape | Use when | Backend lives in |
|---|---|---|
| **Frontend-only** | Data comes from an existing API (Zoov, NestJS, FastAPI) | External API; Next is UI only |
| **BFF** | Need to hide credentials, aggregate/reshape APIs, server-render with secrets | Next server (Route Handlers, Server Actions) calling external APIs |
| **Full-stack** | Single web client, CRUD-heavy, small team, one deploy unit | Next server + ORM directly |

### When a separate backend is required (any MUST → split)
- **MUST split** — more than one client consumes the same business logic (mobile app, POS, partners, public API).
- **MUST split** — card data, payment authorization, settlement or anything in PCI DSS scope. Keep the CDE out of the web tier; Next never touches PAN.
- **MUST split** — long-running work: queues, retries, cron, webhook processing with guaranteed delivery, batch/EDI files, jobs > request timeout.
- **SHOULD split** — public or partner API with versioning and SLA; persistent connections at scale (websockets, streaming); CPU-heavy work; domain with multi-aggregate transactions and its own team or deploy cadence; independent scaling needs.
- **Stay full-stack** — none of the above, a single web UI, server actions cover writes, and the team owns both sides.

Split target: NestJS (TS teams, rich domain) or FastAPI (Python teams, data/integration-heavy). Next then becomes **BFF**: server-only calls, browser never sees backend credentials. Record the decision in `docs/adr/`.

## 2. Structure
```
src/
  app/                 routes only: page, layout, loading, error, route handlers
  features/<feature>/  components/, actions.ts, queries.ts, schemas.ts, *.test.ts
  server/              data access layer (DAL), auth, external API clients — `import "server-only"`
  components/ui/       shared presentational components
  lib/                 framework-agnostic helpers
  env.ts               validated env (zod), split server/client
```
- **MUST** keep `app/` thin; logic lives in `features/` and `server/`.
- **MUST** mark server modules with `import "server-only"`; client secrets never cross the boundary.
- **SHOULD** colocate tests with code (`*.test.ts(x)`).

## 3. Rendering and data
- **MUST** default to Server Components; add `"use client"` only on interactive leaves.
- **MUST** fetch data on the server (DAL), not in `useEffect`. Client fetching only for live/interactive data (TanStack Query).
- **MUST** make caching explicit per route/fetch (revalidate time or tags). Know your Next version's defaults; never rely on implicit caching for user-specific data.
- **SHOULD** stream with `loading.tsx` / `<Suspense>`; use `error.tsx` and `not-found.tsx` per segment.
- **AVOID** passing large objects or secrets as props to client components (they serialize to the browser).

## 4. Mutations and API
- **MUST** validate every Server Action and Route Handler input with zod — they are public endpoints.
- **MUST** check authentication and authorization inside each action/handler (layout checks do not protect actions).
- **MUST** return typed results (`{ ok: true, data } | { ok: false, error }`); never throw raw errors to the client.
- **SHOULD** use Route Handlers for webhooks, public endpoints and non-React consumers; Server Actions for form mutations.
- **MUST** verify webhook signatures and make handlers idempotent.

## 5. Data
- **MUST** access the DB only from `server/` through the ORM (Prisma or Drizzle); migrations versioned.
- **MUST** reuse one ORM client instance (singleton) to avoid connection exhaustion in dev and serverless; use a pooler (RDS Proxy, PgBouncer) in serverless deploys.

## 6. Security
- **MUST** auth via an established library (Auth.js, Better Auth, Cognito/Entra SDKs). Never hand-rolled sessions/JWT.
- **MUST** set security headers (CSP with nonces, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors).
- **MUST** only expose `NEXT_PUBLIC_*` values that are safe to publish.
- **MUST** sanitize any HTML rendered with `dangerouslySetInnerHTML` (or don't use it).
- **SHOULD** rate-limit auth and mutation endpoints.

## 7. UI quality
- **MUST** accessible components (semantic HTML, labels, focus, contrast); axe check in E2E.
- **SHOULD** `next/image`, `next/font`, route-level code splitting; track Core Web Vitals.
- **SHOULD** forms with react-hook-form + zod (same schema client and server).
- Texts shown to users are i18n strings (native language); identifiers stay English.

## 8. Tests
- Unit/component: Vitest + Testing Library + MSW. E2E: Playwright on critical journeys (login, checkout, payment status).
- `test:coverage` emits `coverage/lcov.info`; exclude `app/**/layout.tsx`, generated clients, `*.d.ts`.
- **MUST** test actions/handlers at the boundary: invalid input, unauthorized, success.

## 9. CI additions
- `pnpm build` in CI (catches RSC/client boundary errors). Playwright on PRs to `main` and nightly; shard and cache browsers.
- Bundle-size check on PRs (`@next/bundle-analyzer` report or size-limit) — SHOULD.

## 10. Anti-patterns
Fetching own Route Handlers from Server Components · business logic in `page.tsx` · secrets in client components · `any` across the server/client boundary · one giant `"use client"` at the layout · DB calls from middleware/proxy.

## Review checklist
- [ ] Shape (frontend-only / BFF / full-stack) still right? Split signals checked
- [ ] Inputs validated and auth checked inside each action/handler
- [ ] Caching explicit; no user data cached publicly
- [ ] `server-only` on server modules; no secret in `NEXT_PUBLIC_*`
- [ ] A11y and E2E for changed journeys
