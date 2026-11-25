# Module: Database and migrations

Applies when `database.engine` is set. Default engine **PostgreSQL**; anything else needs an ADR. Access through the ORM (core rule); this module defines schema, migration and operation rules.

## 1. Naming (English, enforced by the core identifier check)
| Object | Rule | Example |
|---|---|---|
| Table | snake_case, plural | `payment_transactions` |
| Column | snake_case | `merchant_id`, `captured_at` |
| Primary key | `id` | |
| Foreign key column | `<singular>_id` | `merchant_id` |
| Timestamps | `created_at`, `updated_at` (`timestamptz`), optional `deleted_at` | |
| Booleans | `is_`/`has_` prefix | `is_active` |
| Constraints / indexes | `pk_<table>`, `fk_<table>__<column>`, `uq_<table>__<cols>`, `ck_<table>__<rule>`, `ix_<table>__<cols>` | `ix_payment_transactions__merchant_id` |
- ORM maps camelCase (code) ↔ snake_case (DB) via naming strategy; no ad-hoc `@map`/`db_column` per field.

## 2. Types and constraints
- **MUST** `timestamptz` stored in UTC; never `timestamp` without zone.
- **MUST** money as `bigint` minor units (or `numeric(19,4)` for rates/fees); never `float`/`real`/`double`.
- **MUST** PKs `bigint generated always as identity` (internal) or UUIDv7 (exposed/distributed); expose opaque public ids, not sequential ids.
- **MUST** integrity in the DB: `NOT NULL` by default, FKs, unique and check constraints. The application is not the only guard.
- **SHOULD** `text` + check over `varchar(n)`; enums as lookup table or check constraint (Postgres `ENUM` is hard to evolve); `jsonb` only for truly semi-structured data, never to dodge modeling.
- **MUST** index every FK used in joins/deletes; partial unique indexes when using soft delete (`WHERE deleted_at IS NULL`).

## 3. Migrations
- **MUST** generated/managed by the ORM tool (Prisma Migrate, Drizzle Kit, Alembic, Django, Doctrine/Laravel) and **reviewed by a human** — autogenerate is a draft.
- **MUST** forward-only in prod; small (one concern per migration); never edit a migration already applied in any shared environment.
- **MUST** zero-downtime by **expand → migrate → contract** across releases:
  1. expand: add nullable column/new table, dual-write in code;
  2. backfill in batches (separate data migration, idempotent, resumable);
  3. switch reads; enforce `NOT NULL`/constraints (`NOT VALID` then `VALIDATE CONSTRAINT`);
  4. contract: drop old column/table in a **later** release.
- **MUST NOT** in one step: rename/drop a column still read by the running version, change a column type with a table rewrite on a large table, add a `NOT NULL` column without default to a populated table.
- **MUST** Postgres: `CREATE INDEX CONCURRENTLY` (outside a transaction); `SET lock_timeout = '5s'` and `statement_timeout` in migrations; lint SQL with **Squawk**.
- **MUST** migrations run as a dedicated deploy step/job (one runner) before the new app version receives traffic — never at app startup on every replica.
- **MUST** schema drift check in CI: apply all migrations to an empty DB, then verify models match (`prisma migrate diff --exit-code`, `alembic check`, `makemigrations --check --dry-run`, `doctrine:schema:validate`).

## 4. Access and security
- **MUST** separate DB roles: `migrator` (DDL, CI/deploy only) and `app` (DML only on its schema); no superuser for apps.
- **MUST** TLS required; credentials from Secrets Manager/Key Vault with rotation, or IAM/Entra auth.
- **MUST** connection pooling sized to DB `max_connections` (PgBouncer, RDS Proxy); serverless always behind a pooler.
- **MUST** classify personal data columns (column comment/tag `pii`) and define retention + deletion jobs (LGPD). PAN never stored outside the CDE; tokenize.
- **MUST** no production data in dev/test. If realistic data is required: anonymized/synthetic pipeline approved by security.

## 5. Performance
- **MUST** keyset pagination for large lists; no `OFFSET` beyond small pages.
- **SHOULD** `EXPLAIN (ANALYZE, BUFFERS)` for new queries on tables > 100k rows, attached to the PR; `pg_stat_statements` enabled; slow query log threshold set.
- **SHOULD** N+1 detection in integration tests (query count assertions on critical endpoints).

## 6. Operations
- **MUST** backups with PITR; **restore tested** at least quarterly (monthly for `criticality: low` VPS per core), with measured RTO/RPO recorded.
- **MUST** RPO/RTO declared per criticality: high ≤ 5 min / 1 h; medium ≤ 1 h / 4 h; low ≤ 24 h / 24 h (adjust by ADR).
- **SHOULD** multi-tenant data with `tenant_id` on every row + Row-Level Security when tenants share tables.

## 7. CI (asset `assets/modules/database/database.yml`)
Ephemeral Postgres service → apply migrations from zero → drift check → Squawk on new SQL → seed test fixtures → integration tests.

## Review checklist
- [ ] Migration safe for the running version (expand/contract respected)
- [ ] Locks: concurrent index, lock_timeout, no table rewrite on big tables
- [ ] Constraints and FK indexes present; names follow convention
- [ ] PII classified; no float money; timestamptz
