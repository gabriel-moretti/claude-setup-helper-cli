---
name: quality-harness
description: Installs, retrofits or audits DeltaPag's repository quality and standards harness (harness-qualidade / padrão de código) in any repo. Core — lefthook, gitmoji commits without AI attribution, Conventional Branch without AI prefixes, trunks, SemVer, Common Changelog, CI required checks, coverage 75/85, secrets and PAN scanning, PR templates, English code, infra/ORM policy, AI agent files, GitHub Free/Enterprise rulesets; base layers node, python, flutter, docker; optional modules Next.js, NestJS, FastAPI, Flutter mobile/POS, PHP, AWS, Azure, Terraform, GitHub, API contracts, database/migrations, observability, QA/E2E. Use whenever someone wants to create a repo with standards, add lint/hooks/CI/release flow to an existing repo, set up gitmoji, SemVer, CHANGELOG, rulesets, coverage gates, framework or cloud rules, MCP for AWS/Azure/Terraform/GitHub, or audit what a repo is missing, even without saying "harness".
---

# Quality harness

Gates that keep non-standard code, commits, branches and releases out of `main`. Two layers:

1. **Core** (language-agnostic) — always applied. `references/core.md`.
2. **Base layers** — tooling per detected stack: `node`, `python`, `flutter`, `docker` (+ `php` CI stack; rules in the php module). Ids match `.github/scripts/projects.cjs`.
3. **Optional modules** — framework, cloud and practice rules on demand (`references/modules.md`, catalog `modules.json`). A module never relaxes core; core wins on conflict.

Principle: hooks are convenience, CI is the guarantee. Every hook check has a CI twin.

## Tracks
| Track | When | Result |
|---|---|---|
| **CRIAR** | new/empty repo | full harness, `IN_PRODUCTION=false` until go-live |
| **RETROFIT** | repo with code | staged rollout with ratchet (`references/retrofit.md`) |
| **AUDITAR** | "what's missing?" | report only, no changes |

Unclear → run the detector; code without harness = RETROFIT.

## Flow

### 1. Detect
```bash
python3 <skill>/scripts/detect_stacks.py <repo> --history [--in-production]
```
Stacks (with paths, monorepo-aware), core/stack gaps, legacy tooling, version mismatches, **module suggestions** (signal per module, recommended, dependencies) and module audits; `--history` adds `audit_history.js` (gitmoji/AI attribution on recent commits, branch names, CHANGELOG, VERSION/manifests, tags, `standards.cjs --all` when installed). No repo access → ask for tree and manifests.

**AUDITAR:** module sections list mechanical checks (✅/❌/⚠️) and the module's review checklist as manual items (📝). If `standards.json` has no `"modules"`, show the suggested list and confirm before auditing it as selected. Also run, when the repo has the validators: `node .github/scripts/standards.cjs --all`, `node --test .github/scripts/test/*.test.cjs`; and governance gaps (ask the plan, compare with `references/governance.md`). Report by priority: security > CI/required checks > release > hooks > style. Stop.

### 2. Core
Read `references/core.md`. Copy `assets/core/` to the repo root (includes `.github/**`, `.claude/`, `AGENTS.md`, `CLAUDE.md`, `lefthook.yml`, `cliff.toml`, `VERSION`, `CHANGELOG.md`, `README.md`, `CONTRIBUTING.md`, `docs/`, `scripts/`). Replace `OWNER/REPO` / `@OWNER/` placeholders (`docs/SETUP.md`). Set `VERSION` (CRIAR `0.1.0`; RETROFIT current manifest version). Run `node --test .github/scripts/test/*.test.cjs`.
Release rules: `references/release.md`. AI files: `references/ai-agents.md` (state the third-party skill security note).

### 3. Base layers
| Stack | Reference | Assets |
|---|---|---|
| node (`package.json`) | `references/node.md` | `assets/node/` |
| python (`pyproject.toml`) | `references/python.md` | `assets/python/` |
| flutter (`pubspec.yaml`) | `references/flutter.md` | `assets/flutter/` |
| docker (`Dockerfile*`) | `references/docker.md` | `assets/docker/` |

Each: config files, `lefthook.<stack>.yml` → `.lefthook/<stack>.yml` (keep only present stacks in root `extends`), append `dependabot.<stack>.yml` to `.github/dependabot.yml`. Framework rules are modules (step 5); `harness-nextjs` is scaffolding only.

### 4. Standards questionnaire
Ask (one compact round; `ask_user_input` where available), then write `.github/standards.json` — `references/standards.md`: docs languages; extra domain terms; criticality; hosting; IaC; PCI scope; DB engine + ORM. Infra policy: `references/infra.md`.

### 5. Modules
Read `references/modules.md` (rule keywords MUST/SHOULD/AVOID, shared contract: lcov path, CI commands, fail-fast config, redacted JSON logs, RFC 9457 errors, `/health/live` + `/health/ready`).
- **CRIAR:** after the questionnaire (hosting/IaC drive `aws`/`azure`/`terraform`), ask which modules apply with `ask_user_input` (multi-select): pre-check detected + recommended ones; `github` is checked by default.
- **RETROFIT / AUDITAR:** show the detector's module list; confirm before applying.
- Apply: `python3 <skill>/scripts/apply_modules.py <repo> --modules a,b` — resolves `depends` (base layers reported, `aws` + `infra.iac=terraform` adds `terraform`), writes the union to `.github/standards.json → "modules"` (never removes), copies assets without overwriting, installs module workflows only for selected modules, merges MCP fragments into `.mcp.json`, adds module wiring (fastapi Ruff `ANN`/`ASYNC`; flutter coverage excludes).
- Then read each selected module file under `references/{stacks,devops,practices}/` and apply its rules to the code/config you touch.
- Module workflows (`cost-review`, `drift`, `api-contract`, `database`, `e2e`) are **not** required checks; never add them to rulesets unless the user says so.
- **MCP:** fragments are pinned to exact published versions (≥ 14 days old at build time); the apply report lists them for team review — pinned is not reviewed. Never use `@latest` or invent versions. Defaults are read-only identities/endpoints.
- **Human templates** (runbook, postmortem, `JOURNEYS.md`): translate to `docs.languages[0]` when it isn't `en` (the report lists them); keep headings' structure.

### 6. CI
Workflows ship in `assets/core/.github/workflows/`. Keep job/context names. Monorepo: `projects.cjs` auto-detects (depth ≤ 3) or use `.github/ci-projects.json`. Variables: `IN_PRODUCTION`, `COVERAGE_MIN`, `COVERAGE_MIN_PROD`, optional `GITLEAKS_IMAGE` (pin), OIDC vars, `RELEASE_APP_ID`/`RELEASE_APP_KEY`.

### 7. Governance
Ask: **Free public**, **Free private**, or **Enterprise**. Apply per `references/governance.md` (`assets/governance/` → `governance/`). Enterprise: evaluate first, enforce after 1–2 weeks. Free private: say plainly that checks can't block merges.

### 8. RETROFIT ordering
Follow `references/retrofit.md` stage by stage, one PR each. Never mix reformatting with behavior changes.

### 9. Verify
- `node --test .github/scripts/test/*.test.cjs` green.
- `lefthook install`; non-gitmoji commit rejected; AI `Co-Authored-By` trailer stripped; `git push` from `claude/x` rejected.
- `python3 scripts/quality/scan_pan.py --all` clean.
- `node .github/scripts/standards.cjs --all` (CRIAR: clean; RETROFIT: findings recorded, not blocking).
- `node .github/scripts/release.cjs check --head <release-branch> --base main` on a dry-run release branch when a release is part of the job.
- Re-run `detect_stacks.py --history`; module sections show no ❌ for selected modules (or each ❌ is reported).
- Skill self-test: `python3 -m unittest discover <skill>/scripts/tests`.

## Delivery
Short prose: track, stacks, files created/changed, gates and level (hook/CI, blocking vs advisory), baselines left, `standards.json` answers, governance path and the manual steps still needed (scripts to run with `gh`, variables, GitHub App for back-merge, `IN_PRODUCTION=true` at go-live). Not verifiable locally: workflow runs, rulesets API, GitHub regex engine acceptance (Enterprise evaluate mode first).

## Hard rules
- Never reintroduce Conventional Commits, AI branch prefixes, or AI attribution.
- Never rename `ci-ok`, `conventions`, `standards`, `release-check`, `pr-template`; never change 75/85, tag scheme (`vX.Y.Z`, `vX.Y.Z-rc.N`, optional `vX`/`vX.Y`) or trunk names.
- Secrets/PAN gates: no baseline, always blocking.
- Code identifiers English; human-facing text in `docs.languages`; AI-facing text English.
- Don't edit tested validators in `.github/scripts` unless a test proves a bug; keep the suite green.
- Modules are additive; never change module rules, thresholds or conventions while applying them.
