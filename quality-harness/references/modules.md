# Harness modules

Optional, additive rule sets layered on top of `core` (repo standards: SemVer, gitmoji, Conventional Branch, Common Changelog, English code, coverage 75/85, ORM-first, IaC, OIDC). A module never relaxes `core`. If a module conflicts with `core`, `core` wins.

## Selection
`modules.json` (skill root) lists detection signals. The harness:
1. Detects candidates (CRIAR: ask; RETROFIT/AUDITAR: detect, then confirm with user).
2. Writes the chosen list to `.github/standards.json` → `"modules": [...]`.
3. Applies each module's rules, CI additions and assets. Re-running with a new module only adds; it never removes other modules.

## Rule keywords
- **MUST** — enforced by CI or blocking in review.
- **SHOULD** — default; deviation needs a one-line reason in the PR.
- **AVOID** — anti-pattern; needs an ADR to use.

## Index
| Module | File | Depends on |
|---|---|---|
| Next.js | stacks/nextjs.md | node (base) |
| NestJS | stacks/nestjs.md | node (base) |
| FastAPI | stacks/fastapi.md | python (base) |
| Flutter (mobile) | stacks/flutter.md | flutter (base) |
| PHP | stacks/php.md | — |
| AWS | devops/aws.md | terraform or cdk, github |
| Azure | devops/azure.md | terraform, github |
| Terraform | devops/terraform.md | — |
| GitHub | devops/github.md | core |
| API contracts | practices/api-contracts.md | — (stack modules implement) |
| Database and migrations | practices/database.md | ORM rule from core |
| Observability | practices/observability.md | — |
| QA and E2E | practices/qa-e2e.md | stack modules for unit tests |

## Shared contract every stack module honors
- Coverage report in **lcov** at `<project>/coverage/lcov.info` (PHP: see stacks/php.md).
- Commands the CI calls: format check, lint, test with coverage.
- Generated code excluded from coverage and from the English-identifier check (`code.ignore`).
- Config validated at startup; app fails fast on missing/invalid env.
- Logs structured (JSON) with redaction of secrets, tokens, PAN, CVV, CPF/CNPJ, e-mail, phone.
- Errors over HTTP follow RFC 9457 (`application/problem+json`).
- Health endpoints: `/health/live` (process) and `/health/ready` (dependencies).

## Assets
| Path | Install to | Purpose |
|---|---|---|
| assets/aws/mcp.json | merge into `.mcp.json` | AWS docs, pricing, billing/cost, IaC MCP servers |
| assets/aws/ai-readonly-cost-policy.json | IAM policy of the `ai-readonly` role | read-only cost access for agents and cost review |
| assets/aws/cost-review.yml | `.github/workflows/` | monthly cost-by-service issue + FinOps checklist |
| assets/azure/mcp.json | merge into `.mcp.json` | Azure MCP + Microsoft Learn MCP |
| assets/terraform/.tflint.hcl | `infra/.tflint.hcl` | tflint rulesets (pinned) |
| assets/terraform/drift.yml | `.github/workflows/` | weekly drift detection issue |
| assets/terraform/mcp.json | merge into `.mcp.json` | Terraform registry docs MCP |
| assets/github/mcp.json | merge into `.mcp.json` | GitHub MCP, read-only |
| assets/api-contracts/.spectral.yaml | repo root | API conventions as lint rules (paths, camelCase, problem+json, money, idempotency) |
| assets/api-contracts/api-contract.yml | `.github/workflows/` | Spectral + oasdiff breaking-change gate |
| assets/database/database.yml | `.github/workflows/` | migrations from zero, drift check, Squawk |
| assets/database/.squawk.toml | repo root | Postgres migration linter config |
| assets/observability/otel-collector.yaml | collector deployment | redaction + tail sampling |
| assets/observability/runbook-template.md | `docs/runbooks/_template.md` | runbook per alert |
| assets/observability/postmortem.md | `docs/postmortems/_template.md` | blameless postmortem |
| assets/qa-e2e/playwright.config.ts | web project root | Playwright defaults |
| assets/qa-e2e/e2e.yml | `.github/workflows/` | sharded E2E, @critical on PR, full nightly |
| assets/qa-e2e/k6-smoke.js | `perf/` | release performance gate |
| assets/qa-e2e/JOURNEYS.md | `e2e/JOURNEYS.md` | critical journeys registry |

MCP fragments are pinned to exact versions (see Integration below).

## Integration into quality-harness
- Files: `references/{stacks,devops,practices}/`, this index at `references/modules.md`, `modules.json` at the skill root, assets at `assets/modules/<module>/`.
- Base layers (`node`, `python`, `flutter`, `docker`) are detected by `projects.js` and never listed in `"modules"`. `"flutter"` in `"modules"` always means the Flutter module; its dependency is the `flutter` base layer.
- Detection: `scripts/detect_stacks.py` (signals) · apply: `scripts/apply_modules.py` · audit: module checks in `scripts/harness_modules.py`.
- MCP fragments: pinned to exact published versions at least 14 days old when the skill was built (aws-documentation 1.2.5, aws-pricing 1.1.1, billing-cost-management 0.0.45, aws-iac 1.0.26, @azure/mcp 3.0.0, terraform-mcp-server 1.4.1). Pinned ≠ reviewed: the team reviews them; Dependabot does not update `.mcp.json`.
- Actions in core and module workflows are pinned by full SHA with the version in a comment; Dependabot (`github-actions`) keeps them updated.
- Open TODO: the "GitHub Actions: Minuten sparen" skill is unidentified (see ai-agents.md).
