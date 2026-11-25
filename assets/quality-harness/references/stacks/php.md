# Module: PHP

Applies to: PHP applications (Laravel, Symfony, or legacy/plain PHP). Includes a retrofit path for legacy code.

## 1. Baseline
- **MUST** supported PHP version (active or security support), pinned in `composer.json` (`"php": "^8.3"`) and the Docker image.
- **MUST** `declare(strict_types=1);` in every new file.
- **MUST** Composer with committed `composer.lock`; `composer validate --strict` and `composer audit` in CI.
- **MUST** PSR-4 autoloading; no `require`/`include` of class files.
- Format: PER Coding Style via **PHP-CS-Fixer** (or **Laravel Pint** in Laravel). Static analysis: **PHPStan** (Larastan for Laravel; Symfony extension for Symfony). Upgrades: **Rector**.

## 2. Framework choice (new projects)
- **SHOULD** Laravel for product apps and admin/backoffice; Symfony for long-lived domain-heavy services or teams already on Symfony. Plain PHP only for tiny scripts.
- **MUST** ORM: Eloquent (Laravel) or Doctrine (Symfony) with versioned migrations. No string-concatenated SQL; raw queries only with bindings.

## 3. Structure and design
- **MUST** controllers thin; business logic in services/actions; validation in Form Requests (Laravel) or Validator constraints/DTOs (Symfony).
- **MUST** typed properties, parameters and return types; enums instead of string constants; readonly value objects for money and IDs.
- **MUST** money as integer minor units or `brick/money` — never float.
- **SHOULD** dependency injection through the container; no static facades in domain code (Laravel: facades ok in controllers/infra only).

## 4. Security
- **MUST** passwords with `password_hash()`/framework hasher; CSRF on state-changing forms; output escaped by the template engine (Blade/Twig) — no raw echo of user input.
- **MUST** `display_errors=Off`, `expose_php=Off` in prod; errors to structured logs with redaction.
- **MUST** sessions: `secure`, `httponly`, `samesite=lax|strict`; regenerate id on login.
- **AVOID** `eval`, `unserialize` on untrusted input, `extract`, dynamic includes, `shell_exec` with user data.
- **MUST** file uploads validated by content type and size, stored outside the web root or in object storage.

## 5. Tests and coverage
- PHPUnit 10+ or Pest; coverage driver **PCOV** in CI (faster than Xdebug).
- Emit Clover: `--coverage-clover coverage/clover.xml`. The core gate (`coverage.cjs`) reads Clover; `projects.cjs` detects `composer.json` as stack `php` and `ci.yml` runs composer validate/audit, formatter, PHPStan, tests and the gate (75/85).
- Feature/HTTP tests for each route (validation, auth, success); database tests with transactions/refresh or Testcontainers.

## 6. Runtime
- php-fpm + nginx (or FrankenPHP/RoadRunner when justified); OPcache enabled with `validate_timestamps=0` in prod images; non-root container user.
- Queues for slow work (Laravel Horizon/SQS, Symfony Messenger) with retries and dead-letter.

## 7. Legacy retrofit (ratchet)
1. Lock dependencies and PHP version in Docker; add `composer audit`.
2. PHPStan at level 0 with a **baseline** file; raise the level only when the baseline for that level is empty. New code must pass the target level (CI on changed files).
3. Formatter applied in a dedicated commit (`🎨`), listed in `.git-blame-ignore-revs`.
4. Rector rule sets for PHP version upgrades, one set per PR.
5. Characterization tests around code before refactoring it; coverage gate applies to changed files first.

## Review checklist
- [ ] strict_types, full types, no float money
- [ ] Queries through ORM/bindings; output escaped
- [ ] PHPStan clean at target level (no new baseline entries)
- [ ] Tests for new routes; composer audit clean
