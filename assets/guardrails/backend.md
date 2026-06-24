---
domain: Backend / services (Node/TS, Lambda, workers)
audience: AI coding agents (Claude Code, Cursor)
context: Deltapag fintech — payments, split, settlement, reconciliation, webhook gateway (Lambda pollers/dispatchers, SQS+DLQ).
priority_order: correctness > security > reversibility > consistency > observability > performance > convenience
---

# Guardrails — Backend

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human.

## Correctness & money

- MUST represent money as integer minor units (centavos) or fixed-precision decimal, always with a currency. NEVER float for money.
- MUST make every state transition of a financial record explicit, validated against allowed transitions, and recorded with prior state + actor + timestamp (audit trail). NEVER mutate financial state in place without an audit record.
- MUST wrap multi-write financial operations in a transaction. NEVER leave money in a partially-applied state on failure — roll back or compensate.
- STOP before code that initiates settlement (liquidação), payouts, refunds, or any outbound money movement. Present plan + reversibility first.

## Idempotency & messaging

- MUST make every consumer/handler idempotent. Process-once is not guaranteed: SQS is at-least-once and webhooks are re-delivered. De-dupe on a stored idempotency/event key; a replay MUST be a no-op that returns the prior result.
- MUST design for out-of-order and duplicate delivery. NEVER assume a webhook/event arrives once or in order.
- MUST set explicit `visibilityTimeout` and a DLQ on every queue; size `maxReceiveCount` deliberately. NEVER silently drop a poisoned message — it goes to the DLQ for inspection.
- MUST make outbound calls (acquirers, networks, internal services) time-bounded with bounded retry + backoff + jitter. NEVER retry a non-idempotent call without an idempotency key.
- STOP before replaying or purging a DLQ — that is a bulk/irreversible op. Show count, sample, and undo plan; wait for explicit "proceed."

## Input & boundaries

- MUST validate and type all external input (HTTP body, queue payload, webhook) at the boundary with a schema before use.
- MUST verify webhook authenticity (HMAC signature / mTLS / shared secret) BEFORE processing. NEVER trust an unverified webhook payload.
- MUST scope every query by tenant/merchant; enforce object-level authorization in the service layer. NEVER run an unscoped cross-merchant query.
- NEVER build SQL by string concatenation — use parameterized queries / query builder.

## Secrets & config

- MUST load secrets at runtime from Secrets Manager / Supabase Vault. NEVER hardcode or commit secrets, and NEVER log them.
- SHOULD fail fast at startup on missing required config rather than failing mid-request.

## Observability

- MUST propagate a correlation/trace id from ingress through every downstream call, queue message, and log line.
- MUST emit structured (JSON) logs. NEVER log PAN/CVV/full card data/secrets/raw PII — mask (BIN+last4). LGPD + PCI scope.
- SHOULD emit metrics per handler (latency, success/error, retries, DLQ depth) and alert on DLQ growth and error-rate spikes.

## Concurrency & data integrity

- MUST guard against race conditions on shared financial state with optimistic locking (version column) or DB-level constraints. NEVER read-modify-write a balance without a concurrency guard.
- MUST enforce invariants at the database (unique constraints, FKs, check constraints), not only in app code.

## Reliability

- MUST make handlers stateless and safe to run concurrently across instances/Lambdas.
- SHOULD apply timeouts, circuit-breaking, and backpressure on dependencies; degrade gracefully.

## STOP-and-ask triggers

Halt before: money movement, DLQ replay/purge, schema or migration changes touching financial tables, bulk/batch writes, weakening signature/auth verification, or any irreversible data operation.
