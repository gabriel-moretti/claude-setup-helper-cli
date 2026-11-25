# Critical journeys

A journey listed here without a covering test blocks releases of `criticality: high` projects.

| Journey | Priority | Owner | Test | Tags | Envs |
|---|---|---|---|---|---|
| Login with valid credentials | P1 | @org/team | `e2e/auth/login.spec.ts` | @smoke @critical | sandbox, test, production |
| Create payment (Pix) and see confirmation | P1 | @org/team | `e2e/payments/pix.spec.ts` | @critical | sandbox |
| Refund a captured payment | P2 | @org/team | `e2e/payments/refund.spec.ts` | @critical | sandbox |

Rules: Priority P1 = revenue or access blocked if broken. `@smoke` tests are read-only. Envs = where the test may run (`test` is prod-connected).
