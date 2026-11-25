# Module: Observability

Applies to every deployable service and app (recommended mandatory when `in_production = true`). Vendor-neutral: **OpenTelemetry** for traces, metrics and logs, exported via OTLP to a collector (AWS: ADOT/CloudWatch; Azure: Azure Monitor OpenTelemetry; or Grafana/Datadog/etc.).

## 1. Resource identity (every signal)
`service.name`, `service.version` (= repo SemVer from `VERSION`), `deployment.environment.name` (`production|test|sandbox`), `service.namespace` (product). Set once at SDK init from env/build info.

## 2. Logs
- **MUST** structured JSON, one event per line, to stdout; fields: `timestamp` (UTC), `level`, `message` (English or native — consistent per repo), `service`, `version`, `env`, `trace_id`, `span_id`, `request_id`, actor ids (pseudonymous).
- **MUST** redaction by **allowlist** of loggable fields where possible; denylist at minimum for secrets, tokens, `authorization`, cookies, PAN, CVV, track data, CPF/CNPJ, e-mail, phone, address. Tests assert redaction.
- **MUST** levels: `error` = needs action, `warn` = degraded/unexpected but handled, `info` = business/lifecycle events, `debug` = off in prod by default.
- **MUST** no logging of full request/response bodies on payment/auth endpoints.
- **MUST** retention set per environment and cost budget (prod app logs default 30–90 days; see audit logs).

## 3. Audit logs (separate stream)
- **MUST** for security-relevant actions (login, permission change, data export, payment/refund, config change): who, what, when, where (ip/device), result. Append-only storage, access restricted.
- PCI DSS scope: retain ≥ 12 months with the last 3 months immediately available; daily review automated (alerts).

## 4. Traces
- **MUST** auto-instrumentation for HTTP server/client, DB, queues; W3C `traceparent` propagated across services, queue messages (attributes) and outbound webhooks (header).
- **SHOULD** manual spans for business steps (authorize, capture, settle) with low-cardinality attributes.
- **MUST** sampling defined: head sampling in SDK (e.g. 10%) + **tail sampling** in the collector that keeps all errors and slow traces (asset `otel-collector.yaml`).

## 5. Metrics
- **MUST** RED per service/endpoint: request rate, error rate, duration **histogram** (not averages).
- **MUST** USE for resources (pools, queues: depth, age of oldest message, consumer lag).
- **SHOULD** business metrics: payments approved/declined by reason, approval rate, settlement lag, webhook delivery success.
- **MUST** label cardinality bounded: never user ids, emails, raw URLs, or order ids as labels (use route templates).

## 6. SLOs and alerting
- **MUST** each critical journey has an SLO (e.g. 99.9% of `POST /v1/payments` succeed < 800 ms over 28 days) with SLIs from metrics.
- **MUST** alert on **error-budget burn rate** (multi-window, e.g. 1h/5m fast burn, 6h/30m slow burn) and on saturation that predicts outage; not on CPU spikes.
- **MUST** every alert: owner, severity, runbook link (`docs/runbooks/<alert>.md`, template asset). Page only for user impact; the rest goes to a ticket queue.
- **SHOULD** dashboards as code (Terraform/Grafana JSON) with golden signals per service + deploy markers (release tag).

## 7. Health and lifecycle
- `/health/live` (process ok, no dependency checks) and `/health/ready` (dependencies) — readiness gates traffic; liveness never checks the DB.
- Graceful shutdown: stop accepting, drain in-flight, flush telemetry.

## 8. Clients (web, mobile)
- **MUST** error/crash reporting (Sentry or Crashlytics) with release = SemVer, environment, source maps (web) / debug symbols (mobile, `--split-debug-info`) uploaded in CI; PII scrubbing on.
- **SHOULD** Web Vitals / RUM for web; startup time, ANR, frozen frames for mobile.

## 9. Per-stack defaults
| Stack | Traces/metrics | Logs |
|---|---|---|
| Node / NestJS | `@opentelemetry/sdk-node` + auto-instrumentations | `pino` (`nestjs-pino`), redact paths |
| Next.js | `instrumentation.ts` registering the OTel SDK | `pino` server-side |
| FastAPI | `opentelemetry-instrumentation-fastapi`, `-sqlalchemy`, `-httpx` | `structlog` JSON |
| PHP | `open-telemetry/opentelemetry-auto-*` packages | Monolog JSON formatter |
| Flutter | Sentry/Crashlytics (+ OTel only if backend correlation needed) | `logging` package → Sentry breadcrumbs |

## 10. Incidents
- **MUST** postmortem for every SEV1/SEV2 within 5 business days (asset `postmortem.md`), blameless, with action items as issues; linked from the hotfix PR.

## Review checklist
- [ ] New endpoint/job: traced, RED metrics, errors logged once with context
- [ ] No sensitive data in logs, spans or metric labels
- [ ] New alert has owner, severity, runbook; SLO impact considered
