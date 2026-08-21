---
domain: GitHub Actions (CI/CD)
audience: AI coding agents (Claude Code, Cursor)
context: Deltapag fintech. CI has access to secrets and can deploy to prod — it is a supply-chain attack surface.
priority_order: supply-chain-safety > least-privilege > deploy-safety > reliability > speed
---

# Guardrails — GitHub Actions

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human.

## Supply-chain & action pinning

- MUST pin third-party actions to a full commit SHA, not a tag/branch. Tags are mutable and can be hijacked. NEVER use `@main` or a floating `@v3` for a third-party action; first-party `actions/*` SHOULD be SHA-pinned too.
- MUST vet any new action before adding it (owner, popularity, what it does with secrets). NEVER add an unknown action that receives secrets or the `GITHUB_TOKEN`.
- SHOULD enable Dependabot for actions to surface pinned-SHA updates, and review them.

## Permissions (least-privilege)

- MUST set `permissions:` explicitly at the workflow (and tighten per-job), defaulting to `contents: read`. NEVER leave the default broad `GITHUB_TOKEN` scope. Grant `write` scopes only on the specific job that needs them.
- MUST prefer OIDC (`id-token: write` + cloud role assumption) over long-lived cloud keys for AWS/Supabase deploys. NEVER store static AWS access keys as repo secrets when OIDC is available.
- SHOULD use environment-scoped secrets and required reviewers on the `production` environment, so prod deploys need human approval.

## Untrusted input — the `pull_request_target` trap

- NEVER use `pull_request_target` (or `workflow_run`) to check out and execute code from a fork PR with secrets in scope. That hands secrets to attacker-controlled code. If you must label/comment on fork PRs, do it without checking out or running their code.
- NEVER interpolate untrusted context (`${{ github.event.pull_request.title }}`, issue/comment/branch names) directly into a `run:` shell — it's script injection. Pass via `env:` and reference as a quoted shell variable instead.
- MUST require approval to run workflows from first-time/fork contributors.

## Secrets handling

- NEVER echo, print, or write secrets to logs/artifacts. NEVER pass a secret as a command-line arg (it can appear in process listings/logs) — use `env:`.
- MUST scope each secret to the workflow/environment that needs it. NEVER reuse one secret across prod and non-prod.
- NEVER commit secrets; SHOULD run a secret scanner (gitleaks/trufflehog) and dependency/SAST checks in CI and fail on findings.

## Deploy safety (reversibility)

- STOP before a workflow that deploys to production, runs DB migrations, or moves infra: it MUST gate on a protected `production` environment with required reviewers. NEVER auto-deploy to prod on every push to main without a gate, for a fintech system.
- MUST run the full check suite (lint, type, test, security scan) as a required status before merge/deploy. NEVER allow deploy on red.
- MUST make deploy steps idempotent/re-runnable and document the rollback path in the workflow or runbook. STOP before any irreversible step (destructive migration, infra delete) — require explicit approval.
- SHOULD pin concurrency (`concurrency:` group) so overlapping deploys can't race.

## Hygiene

- MUST set a `timeout-minutes` on jobs so a hung run doesn't burn minutes indefinitely.
- SHOULD scope `paths:`/branch filters so workflows run only when relevant.

## STOP-and-ask triggers

Halt before: adding/upgrading a third-party action, granting a `write` token scope, anything touching `pull_request_target`/fork-PR execution, auto-deploying to prod, or a workflow that runs migrations or deletes infra.
