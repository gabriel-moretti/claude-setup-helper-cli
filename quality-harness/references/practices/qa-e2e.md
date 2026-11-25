# Module: QA and E2E

Applies to repos with user journeys or service-to-service integrations. Complements stack modules (unit tests) and the core coverage gate (75/85 — a floor, not a goal).

## 1. Test portfolio
| Level | Tool (default) | Scope | Required |
|---|---|---|---|
| Unit | Vitest/Jest, pytest, flutter_test, PHPUnit/Pest | pure logic, fast | all PRs |
| Integration | Testcontainers (Postgres, Redis, LocalStack) | repository, queue, HTTP boundary | all PRs |
| Contract | Pact (consumer-driven) or OpenAPI schema validation | between our services/clients | PRs touching an API |
| E2E web | **Playwright** | critical journeys in a browser | PRs to `main`, release, nightly |
| E2E mobile | Flutter `integration_test` (+ Patrol or Maestro for native UI) | critical app journeys | release, nightly |
| Accessibility | axe (`@axe-core/playwright`) | every E2E page | with E2E |
| Visual | Playwright screenshots / Flutter goldens | key screens/components | PRs touching UI |
| Performance | **k6** | critical endpoints | release branch |
| Security (DAST) | OWASP ZAP baseline | deployed sandbox/test | weekly + release |
| Mutation | Stryker / mutmut / Infection | critical domain modules | SHOULD, nightly |

## 2. Critical journeys
- **MUST** `e2e/JOURNEYS.md` lists critical journeys with owner, priority and the test that covers each (template asset). A journey without a test is a release blocker for `criticality: high`.
- **MUST** every bugfix adds a regression test at the lowest level that reproduces it (core bugfix template).

## 3. E2E rules (Playwright)
- **MUST** selectors by role/label (`getByRole`, `getByLabel`), then `data-testid`; never CSS chains or text that changes with i18n.
- **MUST** no fixed sleeps; rely on auto-waiting and web-first assertions.
- **MUST** independent tests: each creates its own data through API/seed fixtures and cleans up; no ordering dependencies.
- **MUST** auth via stored state per role (setup project), not UI login in every test.
- **MUST** CI: sharded, `retries: 2` in CI only, trace/video/screenshot **on failure** uploaded with short retention (asset `e2e.yml`, `playwright.config.ts`).
- **SHOULD** tags: `@smoke` (minutes, post-deploy), `@critical` (release gate), `@full` (nightly).

## 4. Environments and data
- **MUST** full E2E runs on ephemeral preview or `sandbox`. Remember: `test` consumes the **production** environment — only read-only `@smoke` runs there, with dedicated test merchants/accounts.
- **MUST** synthetic test data; payment flows use the acquirer/PSP sandbox and their **public test cards** (the core PAN scanner allowlists them). Never real cards, never production data.
- **SHOULD** external dependencies faked at the boundary (MSW, WireMock, Prism from OpenAPI) for PR runs; real sandbox integrations nightly.

## 5. Flaky test policy
- **MUST** a flaky test is quarantined (`@quarantine` tag + issue with owner) within 1 day, fixed or deleted within 10 business days; quarantine is tracked, never a permanent skip.
- **SHOULD** track flakiness rate from CI reports (Playwright JSON reporter) per week.

## 6. Performance (k6)
- **MUST** for `criticality: high` endpoints, thresholds in code (e.g. `http_req_duration{p(95)} < 800`, `http_req_failed < 1%`) run on the release branch against sandbox; regression > 20% blocks the release (asset `k6-smoke.js`).
- Load/stress tests only in sandbox with prior notice to dependencies (acquirer sandboxes have rate limits).

## 7. Release QA
- rc tag deployed → `@critical` E2E + k6 + ZAP baseline → results linked in the release PR → sign-off checkbox.
- Post-deploy production: `@smoke` read-only within 5 minutes; failure → rollback per runbook.

## Review checklist
- [ ] Change covered at the right level (not everything in E2E)
- [ ] Journey list updated if a critical flow changed
- [ ] New E2E: role selectors, no sleeps, own data, works in parallel
- [ ] No real card/personal data in fixtures
