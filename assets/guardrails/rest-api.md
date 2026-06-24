---
domain: REST API
audience: AI coding agents (Claude Code, Cursor)
context: Deltapag — fintech sub-acquirer. Payments, split, settlement, reconciliation. LGPD applies.
priority_order: correctness > security > reversibility > consistency > performance > convenience
---

# Guardrails — REST API

Imperative rules for any agent designing, generating, or modifying REST endpoints.
`MUST` = hard rule, never violate. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification in the PR. `STOP` = halt and ask the human before acting.

## Contract & versioning

- MUST version the API in the path (`/v1/...`). NEVER break a published `vN` contract; add `vN+1` instead.
- MUST treat the OpenAPI/JSON-Schema spec as the source of truth. Generate or update it in the same change that touches an endpoint. A handler without a spec entry is incomplete.
- MUST keep request/response bodies explicitly typed and validated at the edge. NEVER trust client input — validate type, range, length, and enum membership before the handler runs.
- SHOULD reject unknown fields (`additionalProperties: false`) on write endpoints to catch client drift early.
- NEVER leak internal field names, stack traces, ORM errors, or SQL into responses.

## HTTP semantics

- MUST use correct status codes: `400` malformed, `401` unauthenticated, `403` authenticated-but-forbidden, `404` not found / not visible to caller, `409` conflict, `422` semantic validation failure, `429` rate-limited, `5xx` only for genuine server faults.
- MUST make `GET`, `PUT`, `DELETE` idempotent. NEVER cause side effects from `GET`.
- MUST return a consistent error envelope: `{ error: { code, message, details?, trace_id } }`. `code` is a stable machine string; `message` is human-readable and safe to surface.

## Money & payments (fintech-critical)

- STOP before generating any endpoint that moves money, triggers settlement (liquidação), or alters a transaction's financial state. Present the plan and what is reversible first.
- MUST require an idempotency key (`Idempotency-Key` header or body field) on every state-mutating financial endpoint. Persist the key + first response; replay returns the original result, NEVER re-executes.
- MUST represent money as integer minor units (centavos) or decimal — NEVER float. Always carry the currency code.
- MUST treat all external money movement as eventually-consistent: design for retries, partial failures, and out-of-order webhooks. NEVER assume an acquirer/network call succeeds because it returned 200 once.
- MUST make financial writes transactional and auditable: every state transition records who/what/when and the prior state.

## Auth & access

- MUST authenticate every endpoint by default. Public endpoints are an explicit, reviewed exception — annotate them.
- MUST enforce authorization per-resource (object-level), not just per-route. Confirm the caller owns/may-access the specific record. Broken object-level authorization is the most common fintech breach — assume it's the bug.
- MUST scope every query by tenant/merchant. NEVER run an unscoped query that could cross merchant boundaries.
- NEVER accept the caller's identity from the body or a query param — derive it from the verified token.

## Reliability & limits

- MUST set timeouts and bounded retries (with backoff) on every outbound call. NEVER retry non-idempotent operations without an idempotency key.
- MUST paginate list endpoints (cursor preferred over offset for large/changing sets). NEVER return unbounded collections.
- SHOULD rate-limit by principal and by IP. Mutating financial endpoints get stricter limits.
- MUST enforce a max request body size.

## Observability & data protection

- MUST attach/propagate a `trace_id` (correlation id) through every request and into logs and outbound calls.
- NEVER log full PAN, CVV, full card data, secrets, tokens, or raw PII. Mask (e.g. card BIN+last4). This is LGPD + card-network scope — getting it wrong widens PCI scope.
- SHOULD emit structured logs (JSON) and a metric per endpoint: latency, error rate, throughput.

## STOP-and-ask triggers

Halt and surface a plan before: deleting/disabling an endpoint clients may depend on, changing a response shape in an existing version, relaxing an auth check, or anything that mutates production financial state.
