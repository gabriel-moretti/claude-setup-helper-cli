# Core — language-agnostic layer

Applied to every repo. Human-facing files stay pt-BR; this reference and AI files are English.

## Contents
1. Gate levels · 2. Files · 3. Lefthook · 4. Branches and trunks · 5. Commits (gitmoji, no AI attribution) · 6. PRs, labels, CODEOWNERS · 7. Secrets and PAN · 8. CI and required checks · 9. Actions minute saving

## 1. Gate levels

| Level | Where | Runs | Target |
|---|---|---|---|
| 0 | Editor | `.editorconfig`, format on save | instant |
| 1 | `pre-commit` | format + lint `--fix` on staged, gitleaks, PAN scan | < 5 s |
| 2 | `commit-msg` | `commit.js`: strip AI trailers, validate gitmoji | instant |
| 3 | `pre-push` | `branch.js`, typecheck, fast tests | < 60 s |
| 4 | CI | everything, repo-wide; source of truth | — |

Hooks are convenience (`--no-verify` exists); CI is the guarantee. Every hook check has a CI twin, never the reverse. Slow pre-commit check → move to pre-push.

## 2. Files (`assets/core/` → repo root)

| Path | Purpose |
|---|---|
| `.editorconfig`, `.gitattributes`, `.gitignore` | whitespace, LF, binaries, generated files out of diffs |
| `lefthook.yml` | core hooks + `extends` of `.lefthook/<stack>.yml` |
| `.gitleaks.toml` | default rules + connection strings + PEM keys |
| `scripts/quality/scan_pan.py` | PAN scanner (hook + CI) |
| `scripts/quality/check_lcov.py` | Flutter: drops generated code from lcov, delegates to `coverage.js` |
| `.github/scripts/**` | validators, Node ≥ 20, zero deps, tests in `test/` |
| `.github/standards.json` | project policy (see `standards.md`) |
| `.github/gitmoji/gitmojis.json` | pinned official gitmoji list |
| `.github/workflows/*` | `ci`, `conventions` (+`standards`), `release-check`, `release`, `deploy`, `pr-template`, `infra`, `vps-security-review` |
| `.github/PULL_REQUEST_TEMPLATE/*`, `pull_request_template.md`, `ISSUE_TEMPLATE/*` | PR templates by branch type; 7 issue forms |
| `.github/CODEOWNERS`, `labels.yml`, `dependabot.yml`, `ci-projects.example.json` | ownership, labels (`scripts/sync-labels.sh`), updates, CI override |
| `VERSION`, `CHANGELOG.md`, `README.md`, `cliff.toml` | release (see `release.md`) |
| `CONTRIBUTING.md`, `docs/{SETUP,INFRA,TEMPLATES}.md` | human guide (pt-BR) |
| `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` | AI rules (see `ai-agents.md`) |
| `.git-blame-ignore-revs` | mass-format commits (RETROFIT) |

After copying: replace `OWNER/REPO` and `@OWNER/` placeholders (command in `docs/SETUP.md`), then `node --test .github/scripts/test/*.test.js`.

**Runtime requirements in the repo:** Node ≥ 20 (validators), Python 3 (`scripts/quality`), lefthook, gitleaks, editorconfig-checker.

## 3. Lefthook

Root `lefthook.yml` owns `commit-msg` (commit.js), `pre-push` (branch.js) and the cross-stack `pre-commit` (gitleaks, PAN, editorconfig). Each stack fragment (`assets/<stack>/lefthook.<stack>.yml` → `.lefthook/<stack>.yml`) adds its own pre-commit/pre-push commands. Remove absent stacks from `extends`. Monorepo: set `root:` and `glob` in the fragment.

## 4. Branches and trunks

Conventional Branch 1.1.0 **minus AI prefixes**: `<type>/<kebab-desc>`, type ∈ `feature|feat`, `bugfix|fix`, `hotfix`, `release` (`release/vX.Y.Z`), `chore`. Rejected: `ai/ claude/ codex/ copilot/ cursor/`. Allowed exceptions: `dependabot/`, `gh-readonly-queue/`. Ticket keys fit the description (`feat/fig-123-split-payment`). Source of truth: `.github/scripts/lib/branch.js` (same regex in hook, CI and Enterprise rulesets).

| Trunk | Role | Required |
|---|---|---|
| `main` | production; every version is a `vX.Y.Z` tag here | yes |
| `test` | sandbox using the production environment | optional |
| `sandbox` | isolated sandbox | optional |

If `test` exists, `main` accepts only `release/*` and `hotfix/*` (`conventions` detects it). Flows: full (`work → test → release/vX.Y.Z → main`), lean (`work → main → release/vX.Y.Z → main`), hotfix (`hotfix/* → main`, then automatic back-merge PR to `test`/`sandbox`, merged with a **merge commit**).

## 5. Commits — gitmoji spec

```
<gitmoji> [(scope)][:] <Imperative message>
```
Unicode emoji or `:code:` from the pinned list; header ≤ 100 chars; blank line before body. The gitmoji's `semver` field drives the required version bump (💥 major, ✨ minor, patch list in `gitmojis.json`). Removing public API (🔥 ⚰️ ➖) is breaking only with 💥.

**Never AI attribution:** no AI `Co-Authored-By`, no "generated with/by", no 🤖. `commit.js` strips AI trailers in `commit-msg`; `conventions` rejects remaining mentions and AI-tool authors. AI as a code *subject* is fine. AI usage may be declared only in the PR's optional 🤖 section (not in history: squash uses the PR title).

Never reintroduce Conventional Commits (commitlint, commitizen, `type(scope):` regexes).

## 6. PRs, labels, CODEOWNERS

- PR title = squash commit, gitmoji format. Release PR: `🔖 Release vX.Y.Z`.
- `pr-template` applies the template by branch prefix, requires ⭐ sections, labels the PR. feature/bugfix/hotfix templates carry an optional 💳 PCI section.
- Merge: squash for work → trunk; merge commit only for trunk back-merges.
- Labels from `labels.yml` via `scripts/sync-labels.sh`.
- CODEOWNERS: gates (`.github/`, `governance/`, hooks, `scripts/quality/`, `.claude/`, `AGENTS.md`, `VERSION`, `CHANGELOG.md`) owned by platform; `.gitleaks.toml` also by security; PCI code paths need explicit owners.

## 7. Secrets and PAN — always blocking

No baseline, no `IN_PRODUCTION` softening, run on drafts too.
- **gitleaks**: hook `gitleaks git --pre-commit --staged --redact` (≥ 8.19); CI scans the PR commit range. False positive → `[allowlist]` with a reason or `gitleaks:allow` on the line; never disable a rule.
- **scan_pan.py**: 13–19 digits (space/hyphen allowed), known brand prefix (Visa, Mastercard, Amex, Elo, Hipercard, Discover, Diners, JCB) **and** valid Luhn; public test cards allowlisted; output masked (`411111******1111`); `pan:allow <reason>` per line.
- Real PAN already pushed = PCI incident: follow the incident procedure; rewriting history alone does not remove clones.

## 8. CI and required checks

Stable contexts (rulesets reference them — never rename): `ci-ok`, `conventions`, `standards`, `release-check`, `pr-template`.

`ci.yml` jobs: `detect` → `quality` (matrix node/python/flutter: format, lint, typecheck, tests, coverage gate, dependency audit as warning) · `container` (hadolint, build, trivy per touched Dockerfile) · `hygiene` (editorconfig-checker, actionlint) · `security` (gitleaks + PAN) → `ci-ok`.

`ci-ok` logic: `security` ≠ success → fail always. Otherwise draft → pass with notice. Quality/container/hygiene failures fail only when `vars.IN_PRODUCTION == 'true'`, else warning. Coverage: single gate `.github/scripts/coverage.js` on `coverage/lcov.info` — 75% (`COVERAGE_MIN`), 85% when target is `main` (`COVERAGE_MIN_PROD`). Do not add `fail_under`/Vitest thresholds (double gate).

Projects detected by `projects.js` (`package.json`→node, `pyproject.toml`→python, `pubspec.yaml`→flutter, depth ≤ 3; override `.github/ci-projects.json`). All actions are pinned by full commit SHA with the version in a comment (`uses: org/action@<sha> # vX.Y.Z`); Dependabot `github-actions` updates them. Tools fetched by scripts are pinned too (actionlint 1.7.12, gitleaks image v8.30.1). `permissions: contents: read` at top.

## 9. Actions minute saving

Changed-projects-only matrix; drafts skip heavy CI (`security` still runs); docs-only changes skip tests; `concurrency` cancels superseded PR runs; `timeout-minutes` on every job; path filters only on non-required workflows (`infra`); required checks always report (pass when nothing to run). Caches: pnpm, uv, Flutter. More (artifact retention, runner choice, reusable workflows): module [devops/github.md](devops/github.md) §3.
