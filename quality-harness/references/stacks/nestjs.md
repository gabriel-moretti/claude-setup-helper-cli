# Module: NestJS (TypeScript)

Applies to: backend APIs and workers on NestJS. Builds on the `node` base layer ([../node.md](../node.md): pnpm, TS strict, Biome + ESLint).

## 1. Structure (modular monolith first)
```
src/
  main.ts                  bootstrap: pipes, filters, helmet, CORS, shutdown hooks, OpenAPI
  config/                  typed config + schema validation
  common/                  filters, interceptors, guards, decorators, pagination
  modules/<domain>/
    <domain>.module.ts
    <domain>.controller.ts   HTTP only: map DTO ↔ service
    <domain>.service.ts      use cases / business rules
    <domain>.repository.ts   ORM access
    dto/                     request/response DTOs
    <domain>.service.spec.ts
  infra/                   ORM, queue, cache, external API clients
test/                      e2e
```
- **MUST** one module per bounded domain; modules talk through exported services, never by importing another module's repository.
- **MUST** controllers thin (no business rules, no ORM calls).
- **AVOID** `forwardRef` — a circular dependency is a design smell; extract a shared module or use events.
- **SHOULD** start as a modular monolith; split into services only with an ADR (independent scaling, team, or compliance boundary).

## 2. Validation and contracts
- **MUST** global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` with class-validator DTOs, or zod via `nestjs-zod` — one approach per repo.
- **MUST** separate request and response DTOs; never return ORM entities directly (leaks fields).
- **MUST** generate OpenAPI (`@nestjs/swagger`) and commit or publish the spec; CI fails if the spec drifts from code (SHOULD).
- **MUST** version public APIs (URI `/v1` or header) and paginate list endpoints (cursor preferred).

## 3. Errors, logging, observability
- **MUST** a global exception filter mapping to RFC 9457 problem details; no stack traces in responses.
- **MUST** structured logs (`nestjs-pino`) with request id/correlation id and redaction paths for secrets and personal/card data.
- **SHOULD** OpenTelemetry tracing; health via `@nestjs/terminus` (`/health/live`, `/health/ready`).
- **MUST** `app.enableShutdownHooks()`; close DB, queues and in-flight jobs on SIGTERM.

## 4. Security
- **MUST** `helmet`, CORS allowlist from config, `@nestjs/throttler` on public and auth routes.
- **MUST** authn via Passport/JWT/OIDC library; authz in Guards (roles/permissions/ownership), deny by default.
- **MUST** config through `@nestjs/config` with schema validation; secrets from Secrets Manager / Key Vault in prod.
- **MUST** idempotency keys on payment/side-effect POSTs (store key + response; replay returns the same result).

## 5. Data and async work
- **MUST** ORM (Prisma, TypeORM or MikroORM — one per repo) with versioned migrations; transactions in the service layer.
- **MUST** long work in queues (BullMQ / SQS) with retries, backoff, dead-letter and idempotent consumers; never in the request path.
- **SHOULD** outbox pattern when a DB write must publish an event.
- **AVOID** cron inside multiple replicas without a lock or a dedicated scheduler.

## 6. Tests
- Unit: services with mocked repositories (Jest or Vitest + SWC). E2E: `supertest` against the app with Testcontainers (Postgres, Redis).
- **MUST** e2e for each controller route: validation error, unauthorized, forbidden, success.
- Coverage `coverage/lcov.info`; exclude `main.ts`, `*.module.ts`, DTOs without logic, migrations.

## 7. CI additions
- `pnpm build` + e2e job with service containers. Contract check on OpenAPI diff for PRs to `main`.

## Review checklist
- [ ] New endpoint: DTOs validated, guard applied, problem-details errors, OpenAPI updated
- [ ] No ORM entity leaked in responses
- [ ] Side effects idempotent; long work queued
- [ ] Logs redact sensitive fields
