# Module: API contracts

Applies to any repo that exposes or consumes HTTP APIs, events or webhooks. Stack modules (nestjs, fastapi, nextjs, php) implement; this module defines the contract.

## 1. Source of truth
- **MUST** one OpenAPI **3.1** document per API at `contracts/<api>/openapi.yaml` — either written first (contract-first, preferred for partner/public APIs) or generated from code and committed (code-first). Never both, never undocumented endpoints.
- **MUST** code and spec stay in sync: code-first → CI regenerates and fails on diff; contract-first → server validates requests/responses against the spec in tests.
- **MUST** events and queues described in **AsyncAPI** (`contracts/<api>/asyncapi.yaml`); webhooks in OpenAPI `webhooks:`.
- **SHOULD** clients generated from the spec (TS: `openapi-typescript`/orval; Dart/Kotlin: openapi-generator). No hand-written DTOs for third-party APIs we own the spec of.

## 2. Design conventions
| Topic | Rule |
|---|---|
| Paths | English, plural nouns, kebab-case: `/v1/payment-links/{paymentLinkId}`; verbs only for actions: `POST /v1/payments/{id}/refunds` |
| JSON fields | English **camelCase** (org-wide); enums `UPPER_SNAKE` |
| IDs | opaque strings (UUIDv7/ULID with prefix allowed: `pay_01H…`); never sequential DB ids |
| Dates | RFC 3339 / ISO 8601 in UTC (`2026-11-25T14:03:00Z`); dates without time as `YYYY-MM-DD` |
| Money | `{ "amount": 1990, "currency": "BRL" }` — integer minor units + ISO 4217; never float |
| Lists | cursor pagination `?limit=&cursor=` → `{ data: [], nextCursor }`; max `limit` documented |
| Filters/sort | `?status=PAID&createdFrom=…&sort=-createdAt` |
| Errors | RFC 9457 `application/problem+json` with stable `type` URIs and `errors[]` for field validation |
| Hypermedia | optional; when used (e.g. Zoov HATEOAS) one format org-wide (HAL `_links`), clients follow `rel`, never build URLs |

- **MUST** every operation: `operationId`, summary, request/response schemas, at least one example, error responses (400/401/403/404/409/422/429/5xx as applicable), and `security` (or explicit `security: []` for public).
- **MUST** `Idempotency-Key` header on POST operations with side effects (payments, refunds, transfers); same key + same body → same response; different body → 422.
- **SHOULD** rate-limit headers (`RateLimit`, `RateLimit-Policy`, `Retry-After` on 429).

## 3. Versioning and change policy
- **MUST** major version in the path (`/v1`); additive changes stay in the same version (new optional field, new endpoint, new enum value only if clients are told to tolerate unknown values).
- **MUST** breaking change (remove/rename field, change type, new required input, stricter validation, changed semantics) → new major path + deprecation of the old one. Commit with 💥, release major (core SemVer).
- **MUST** deprecate with `deprecated: true` in the spec plus `Deprecation` and `Sunset` response headers and a documented migration window (minimum per partner contract; default 6 months for external, 1 release for internal).
- **MUST** CI breaking-change check against the base branch (`oasdiff breaking`); a breaking diff fails unless the PR is a declared new major.

## 4. Webhooks (outbound)
- **MUST** signed: `HMAC-SHA256(secret, timestamp + "." + body)` in a header with the timestamp; receivers reject > 5 min skew. Secrets rotatable (two active).
- **MUST** at-least-once delivery with exponential backoff and a dead-letter; each event has a unique `id`, `type`, `createdAt`, `apiVersion`; consumers are idempotent by `id`.
- **SHOULD** thin events (id + type) or full snapshot — pick one per API and document it; never partial diffs.

## 5. Security in the contract
- **MUST** OAuth2/OIDC (client credentials for machine-to-machine) or mTLS for partner APIs; API keys only for low-risk internal reads.
- **MUST** sensitive fields marked (`x-sensitive: true`) so logging/redaction can be generated; PAN/CVV never accepted by APIs outside the CDE (tokens only).
- **MUST** request size limits and `maxLength`/`maximum`/`pattern` on inputs.

## 6. Quality gates
| Gate | Tool | Asset |
|---|---|---|
| Lint | Spectral (`spectral:oas` + org rules) | `assets/modules/api-contracts/.spectral.yaml` |
| Breaking changes | oasdiff | `assets/modules/api-contracts/api-contract.yml` |
| Contract tests | Pact (consumer-driven) or schema validation in integration tests | see qa-e2e |
| Mock server | Prism (`prism mock contracts/…`) for frontend/mobile work before the API exists | — |
| Docs | Scalar or Redoc published from the spec on release | — |

## Review checklist
- [ ] Spec updated in the same PR as the code
- [ ] Naming, money, dates, ids, pagination, errors per conventions
- [ ] Idempotency on side-effect POSTs; webhooks signed
- [ ] oasdiff: no unintended breaking change; deprecations have Sunset
