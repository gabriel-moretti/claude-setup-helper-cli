# Module: FastAPI (Python)

Applies to: APIs and services on FastAPI. Builds on the `python` base layer ([../python.md](../python.md): uv, Ruff, mypy, pytest).

## 1. Structure
```
src/<package>/
  main.py              app factory, lifespan, middleware, routers
  core/                settings (pydantic-settings), logging, security, errors
  api/v1/<domain>.py   routers: HTTP only
  domain/<domain>/     services (use cases), schemas (Pydantic), models (ORM)
  infra/               db session, repositories, external clients, queue
tests/                 unit/, integration/, conftest.py
alembic/               migrations
```
- **MUST** routers thin: parse → call service → map response. Business rules in services.
- **MUST** app factory + `lifespan` for startup/shutdown resources (no `@app.on_event`).
- **MUST** dependencies via `Depends` (session, current user, settings); no module-level globals for clients or sessions.

## 2. Typing and validation
- **MUST** Pydantic v2 models for every request and response; `response_model` (or return annotation) on every route — never return ORM objects raw.
- **MUST** `mypy --strict` (or pyright strict) in CI; Ruff with `ANN`, `ASYNC`, `S`, `B`, `UP` rules enabled.
- **MUST** settings via `pydantic-settings`, validated at startup; secrets from Secrets Manager / Key Vault in prod.

## 3. Async correctness
- **MUST** no blocking I/O inside `async def` (no `requests`, sync DB drivers, `time.sleep`). Use async libs (`httpx.AsyncClient`, async SQLAlchemy) or declare the route `def` so it runs in the threadpool.
- **MUST** one shared `httpx.AsyncClient` per app (created in lifespan) with timeouts set; never default/no timeout.
- **SHOULD** CPU-bound work offloaded (process pool or worker).

## 4. Data
- **MUST** SQLAlchemy 2.x (typed `Mapped[]`) + Alembic; one session per request via dependency; commit/rollback in the service or unit-of-work.
- **MUST** migrations reviewed (autogenerate is a draft); expand/contract for zero-downtime changes.
- Django projects: use Django ORM + migrations instead (separate `django` module recommended).

## 5. Errors, logs, security
- **MUST** exception handlers producing RFC 9457 problem details; validation errors normalized.
- **MUST** structured logging (`structlog` or stdlib JSON) with correlation id middleware and redaction of sensitive fields.
- **MUST** auth via OAuth2/OIDC library (`fastapi.security` + `pyjwt`/`authlib`), authz as dependencies, deny by default; CORS allowlist; rate limit public/auth routes.
- **MUST** idempotency keys on side-effect POSTs (payments).
- **MUST** disable `/docs` and `/openapi.json` publicly in prod unless the API is public (serve behind auth).

## 6. Background work
- `BackgroundTasks` only for small fire-and-forget work. **MUST** use a real queue (Celery, arq, Dramatiq, SQS consumers) for retries, scheduling or anything that must not be lost.

## 7. Tests
- pytest + anyio/pytest-asyncio; `httpx.AsyncClient(transport=ASGITransport(app))`; dependency overrides for auth and external clients; Testcontainers for Postgres.
- `uv run pytest --cov --cov-report=lcov:coverage/lcov.info`; exclude migrations and `main.py` wiring.
- **MUST** test each route: 422 validation, 401/403, success, domain errors.

## 8. Runtime
- Uvicorn workers (or Gunicorn + UvicornWorker) behind a load balancer; `--proxy-headers` only with trusted proxy IPs; graceful shutdown.
- Container: slim base, non-root user, `uv sync --frozen --no-dev`.

## Review checklist
- [ ] No blocking call in async path; external calls have timeouts
- [ ] Request/response models explicit; ORM objects not leaked
- [ ] Migration reviewed and reversible
- [ ] Auth dependency on new routes; problem-details errors
