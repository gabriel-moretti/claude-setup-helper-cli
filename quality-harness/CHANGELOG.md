# Changelog

## [1.2.0] - 2026-11-25

_Closes the open items from 1.1.0, except the unidentified "Minuten sparen" skill._

### Changed

- **Breaking:** pin every action in core and module workflows to a full commit SHA with the version in a comment; Dependabot `github-actions` keeps them updated ([ci.yml](assets/core/.github/workflows/ci.yml))
- Pin MCP servers to exact published versions at least 14 days old instead of placeholders; the apply report lists them for team review ([modules.md](references/modules.md))
- Pin CI tools: actionlint 1.7.12, gitleaks image v8.30.1, editorconfig-checker 3.11.1 ([ci.yml](assets/core/.github/workflows/ci.yml))
- Run hadolint through `hadolint/hadolint-action` pinned by SHA instead of an untagged image ([ci.yml](assets/core/.github/workflows/ci.yml))
- Make "actions pinned by full SHA" a blocking audit check for the github module ([harness_modules.py](scripts/harness_modules.py))

### Added

- Add `php` and `docker` to the Enterprise `stack` custom property ([properties.json](assets/governance/enterprise/properties.json))
- Add a manual audit item to review pinned MCP versions (aws, azure, terraform) ([harness_modules.py](scripts/harness_modules.py))

### Fixed

- Fix the trivy action reference: tag `0.28.0` no longer exists upstream (`v0.28.0`), which would have failed the container job ([ci.yml](assets/core/.github/workflows/ci.yml))

[1.2.0]: SKILL.md

## [1.1.0] - 2026-11-25

_Optional modules (stacks, devops, practices) from `harness-modules`. Items reference the files changed; the skill is not in a Git repository yet._

### Changed

- Rename module dependency `typescript` to the `node` base layer and link base-layer references from stack modules ([modules.json](modules.json))
- Make `stacks/nextjs.md` the Next.js rules source; `harness-nextjs` stays the scaffolding tool ([node.md](references/node.md))
- Remove duplicated rules from base layers in favor of modules: ORM line in `node.md` and `python.md`, POS/Kotlin lint and drift in `flutter.md`, Terraform layout/state/tags in `infra.md` ([overlaps](references/infra.md))
- Load array keys in `lib/standards.js` as arrays instead of spreading them into objects ([lib/standards.js](assets/core/.github/scripts/lib/standards.js))
- Read Clover XML in `coverage.js` besides lcov ([coverage.js](assets/core/.github/scripts/coverage.js))
- Detect `composer.json` as stack `php` in `projects.js` and ignore `vendor/` ([projects.js](assets/core/.github/scripts/projects.js))
- Run PHP projects in `ci.yml`: composer validate/audit, formatter, PHPStan, PHPUnit/Pest and the coverage gate on Clover ([ci.yml](assets/core/.github/workflows/ci.yml))
- Run `tflint` and `terraform test` in `infra.yml` only when their config or tests exist ([infra.yml](assets/core/.github/workflows/infra.yml))
- Allow local and CI service database URLs (`localhost`, `127.0.0.1`) in the gitleaks connection-string rule ([.gitleaks.toml](assets/core/.gitleaks.toml))
- Replace `@latest` and sample tags in MCP fragments with `PIN-REVIEWED-VERSION` (fails closed until pinned) ([assets/modules](assets/modules/aws/mcp.json))
- Add docs path filters to the E2E workflow ([e2e.yml](assets/modules/qa-e2e/e2e.yml))
- Extend the skill flow with module selection, apply and audit steps ([SKILL.md](SKILL.md))

### Added

- Add 13 optional modules: Next.js, NestJS, FastAPI, Flutter, PHP, AWS, Azure, Terraform, GitHub, API contracts, database, observability, QA/E2E ([modules.md](references/modules.md))
- Add `"modules"` to `.github/standards.json` with `KNOWN_MODULES` validation and tests ([standards.md](references/standards.md))
- Add module detection from `modules.json` signals, dependency resolution and recommendations ([harness_modules.py](scripts/harness_modules.py))
- Add module audit checks and review-checklist manual items to the detector report ([detect_stacks.py](scripts/detect_stacks.py))
- Add `apply_modules.py`: additive selection, asset install, `.mcp.json` merge, FastAPI and Flutter wiring ([apply_modules.py](scripts/apply_modules.py))
- Add skill self-tests with one fixture repo per module ([test_modules.py](scripts/tests/test_modules.py))
- Add a `SECURITY.md` template for the github module ([SECURITY.md](assets/modules/github/SECURITY.md))

[1.1.0]: SKILL.md

## [1.0.0] - 2026-11-25

_Merge of `harness-qualidade` with the `emoji-guide-plus` repository-standards kit. Skill renamed to `quality-harness`; "harness-qualidade" kept in the description for triggering. This skill is not in a Git repository yet, so items reference the decision tables in the chat that produced it rather than commits or PRs._

### Changed

- **Breaking:** replace Conventional Commits with the gitmoji spec in hooks, CI, references and examples ([decision 1](references/core.md#5-commits--gitmoji-spec))
- **Breaking:** rename skill to `quality-harness` ([decision 14](SKILL.md))
- **Breaking:** rename stack `typescript` to `node` (`assets/node/`, `references/node.md`, `.lefthook/node.yml`) to match `projects.js` ([decision 6](references/node.md))
- Use one CI workflow (`ci.yml`) with kit job names; add `container`, `hygiene` and `security` jobs feeding `ci-ok` ([decision 3](references/core.md#8-ci-and-required-checks))
- Make `security` (gitleaks + PAN) always blocking, including drafts and `IN_PRODUCTION=false` ([decision 8](references/core.md#7-secrets-and-pan--always-blocking))
- Add typecheck to the CI matrix and run dependency audit as warning only ([decision 9](references/core.md#8-ci-and-required-checks))
- Make `coverage.js` the single coverage gate (75%, 85% on `main`); turn `check_lcov.py` into a wrapper that drops generated Dart code ([decision 4](references/flutter.md))
- Move `commit-msg` (commit.js) and `pre-push` (branch.js) into the core lefthook config; keep `extends` with per-stack fragments ([decision 5](references/core.md#3-lefthook))
- Rewrite `detect_stacks.py` in English with kit-aware checks, legacy-tooling and version-mismatch detection ([decision 6](scripts/detect_stacks.py))
- Rewrite `SKILL.md` and all references in English ([decision 7](SKILL.md))
- Align node package scripts with the CI contract (`format:check`, `lint`, `typecheck`, `test:coverage`) ([alignment](assets/node/package.scripts.json))
- Merge `.editorconfig` and `CODEOWNERS` from both sides; rename gitleaks rule IDs to English ([alignment](assets/core/.gitleaks.toml))
- Split Dependabot into a core block plus `dependabot.<stack>.yml` per stack ([alignment](assets/core/.github/dependabot.yml))
- Move `scan_pan.py` and `check_lcov.py` to `assets/core/scripts/quality/` so a core copy carries them ([decision 3](assets/core/scripts/quality/scan_pan.py))

### Added

- Add the kit: validators and tests, gitmoji list, workflows, PR and issue templates, labels, `standards.json`, `VERSION`, `CHANGELOG.md`, `README.md`, `CONTRIBUTING.md`, `docs/`, `cliff.toml`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` ([inventory](assets/core/docs/SETUP.md))
- Add GitHub Free and Enterprise governance scripts and rulesets ([governance](references/governance.md))
- Add references `release.md`, `standards.md`, `infra.md`, `governance.md`, `ai-agents.md` ([references](SKILL.md))
- Add `scripts/audit_history.js` for the AUDITAR track: commits, AI attribution, branches, CHANGELOG, VERSION, tags, standards ([audit](scripts/audit_history.js))
- Add the standards questionnaire and governance path choice to the skill flow ([flow](SKILL.md))
- Add an optional PCI DSS section to the feature, bugfix and hotfix PR templates ([decision 11](assets/core/.github/PULL_REQUEST_TEMPLATE/feature.md))
- Add a TODO for the unidentified "GitHub Actions: Minuten sparen" skill ([ai-agents](references/ai-agents.md))

### Removed

- **Breaking:** remove `assets/ci/quality.yml` ([decision 3](references/core.md#8-ci-and-required-checks))
- **Breaking:** remove `.lefthook/commit-msg.sh` ([decision 13](references/core.md#3-lefthook))
- Remove `fail_under` from the Python template and Vitest thresholds from the node guide ([decision 4](references/python.md))

### Fixed

- Fix shipped `scan_pan.py` and `check_lcov.py` failing the harness's own Ruff and editorconfig rules ([dogfood](assets/core/scripts/quality/scan_pan.py))
- Fix kit Markdown and `governance/free/apply.sh` heredoc failing editorconfig-checker ([dogfood](assets/core/.editorconfig))
- Fix detector false positives from TOML comments (`fail_under`, `isort`) ([dogfood](scripts/detect_stacks.py))
- Flag version tags without the `v` prefix in the audit ([dogfood](scripts/audit_history.js))

[1.0.0]: SKILL.md
