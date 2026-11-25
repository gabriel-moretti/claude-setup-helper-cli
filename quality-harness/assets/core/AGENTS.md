# AGENTS.md

Repo rules for coding agents. Full human guide: CONTRIBUTING.md (pt-BR). Config: `.github/standards.json`.

## Language
- Code 100% English: identifiers, functions, classes, files, DB tables/columns, ORM `@map`/`db_column`. No accents, no Portuguese words. Allowed domain terms: `code.domainTerms`.
- Comments, docs, README, commits, PR text: `docs.languages` (first = primary). Multi-language → `README.<lang>.md` per extra language.
- Agent-facing files (this file, CLAUDE.md, `.claude/**`, SKILL.md, prompts): English only. Be terse.

## Git
- Branch: `<type>/<kebab-desc>`, type ∈ feature|feat|bugfix|fix|hotfix|release|chore. Release: `release/vX.Y.Z`. Never `ai/`, `claude/`, `codex/`, `copilot/`, `cursor/`.
- Trunks: `main` = prod. `test`, `sandbox` optional. If `test` exists, work PRs target `test`; `main` takes only release/hotfix.
- Commit: `<gitmoji> [(scope)][:] <Imperative message>` (gitmoji.dev/specification). Pick gitmoji by impact: 💥 major, ✨ minor, patch per `.github/gitmoji/gitmojis.json`.
- Never attribute AI: no `Co-Authored-By` AI trailers, no "generated with/by", no 🤖 in commits or branch names. Human is the author.
- PR title = squash commit, same gitmoji format. Fill every ⭐ section of the PR template. AI usage goes only in the PR's optional 🤖 section.

## Quality
- Before done: format, lint, tests. Coverage ≥ 75% (≥ 85% for `main`). New logic needs tests.
- DB access through the project ORM (`database.orm`); schema changes only via ORM migrations. Raw SQL only with ADR in `database.rawSqlAdr`.
- Infra as code only (Terraform; AWS CDK allowed on AWS). Hosting: AWS or Azure; VPS only if `infra.criticality` = low and not PCI. No console-only resources, no long-lived cloud keys (use OIDC).
- Never commit secrets, `.env`, keys, certs, or card numbers (PAN). Fixtures use public test cards only. Gates: gitleaks + `scripts/quality/scan_pan.py` (always blocking).
- Before done also: typecheck (`pnpm typecheck`, `mypy`, `flutter analyze`). Hooks: `lefthook install`.

## Release
- SemVer. Bump `VERSION` (+ root manifests) per highest commit impact since last tag.
- CHANGELOG.md in Common Changelog: `## [X.Y.Z] - YYYY-MM-DD`, groups Changed/Added/Removed/Fixed in that order, each item linked (commit/PR/ticket), breaking first with `**Breaking:**`. Draft: `git cliff --unreleased --tag vX.Y.Z --prepend CHANGELOG.md`, then curate.
- Update every README (per language) with the new version on each release.
- Tags are created only by CI. Never create, move or delete tags.

## Validate locally
`node --test .github/scripts/test/*.test.js` · `node .github/scripts/standards.js --base main` · `node .github/scripts/release.js check --head <branch> --base main`
