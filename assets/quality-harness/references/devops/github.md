# Module: GitHub

Platform practices beyond `core` (core already provides branches, commits, templates, rulesets, release and governance scripts).

## 1. Actions security
- **MUST** `permissions:` declared in every workflow, default `contents: read`; grant writes per job only.
- **MUST** pin third-party actions to a **full commit SHA** with the version in a comment (`uses: org/action@<sha> # v4.2.1`); Dependabot `github-actions` ecosystem keeps them updated. Actions from `actions/*` and `github/*` SHOULD also be pinned.
- **MUST** never run untrusted PR code with secrets: `pull_request_target` only for metadata tasks (labels, templates) and never checks out the PR head.
- **MUST** treat `${{ github.event.* }}` text (titles, bodies, branch names) as untrusted: pass via `env:`, never interpolate into `run:`.
- **MUST** cloud access via OIDC (`id-token: write` only in deploy/plan jobs).
- **MUST** environments `production`, `test`, `sandbox` with deployment branch/tag policies; production with required reviewers where the plan allows.
- **SHOULD** self-hosted runners only ephemeral (one job per runner), never on public repos.

## 2. Reuse
- **SHOULD** org-level reusable workflows (`workflow_call`) and composite actions in a central repo (`ORG/.github` or `ORG/actions`), versioned by tag and pinned by SHA in consumers.
- **SHOULD** organization templates (repo template with the harness core) for new repos.

## 3. Cost and speed (Actions minutes)
- Path filters on non-required workflows; required checks always report (skip inside the job, not via `paths`).
- `concurrency` with `cancel-in-progress` on PRs; `timeout-minutes` on every job; skip drafts.
- Caches for package managers; artifacts `retention-days` short (1–7) unless release assets.
- macOS/Windows/larger runners only where required (iOS builds, Windows targets) and on release paths.
- Matrix only for affected projects (core `projects.cjs --base`).

## 4. Security features
- **MUST** secret scanning + push protection, Dependabot alerts and security updates where available.
- **SHOULD** code scanning (CodeQL default setup) — free on public repos; GitHub Code Security on private.
- **MUST** `SECURITY.md` with the private reporting channel (core issue config links to Security Advisories).

## 5. Settings as code
- **SHOULD** manage org/repo settings, teams, rulesets and environments with the Terraform `integrations/github` provider (or core governance scripts) — no click-ops for protections.
- **MUST** teams over individual collaborators; CODEOWNERS references teams.

## 6. AI tooling
- **GitHub MCP Server** (remote, [github/github-mcp-server](https://github.com/github/github-mcp-server)) — default to the **read-only** endpoint (`/readonly`) and only needed toolsets; fragment `assets/modules/github/mcp.json`.
- Agents never approve PRs, merge to `main`, create tags, or change rulesets/settings.

## Review checklist
- [ ] New workflow: permissions minimal, actions pinned by SHA, untrusted input via env
- [ ] Timeouts, concurrency, path filters/skip logic in place
- [ ] Secrets only in environments that need them
