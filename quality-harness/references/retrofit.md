# RETROFIT — existing repos

Philosophy: **ratchet**. Legacy may be below standard; nothing new may make it worse; the bar only goes up. Two built-in mechanisms already follow it: `standards.js` checks only added lines, and `IN_PRODUCTION=false` keeps quality checks advisory while the repo catches up. Security gates never ratchet.

## Order (one PR per stage)
1. **Security, no baseline.** gitleaks over full history (`gitleaks git --redact`) + `scan_pan.py --all`. Findings first: rotate secrets; real PAN = incident. Then enable hooks + `security` job.
2. **Core without code changes.** `.editorconfig`, `.gitattributes`, lefthook (commit.js, branch.js), `.github/**` (workflows, scripts, templates, `standards.json` from the questionnaire), `AGENTS.md`, `.claude/`, `VERSION` (= current manifest version), `CHANGELOG.md` (start at current version), CODEOWNERS. Keep `IN_PRODUCTION=false`. Remove replaced tooling: commitlint/commitizen/Conventional Commits hooks, husky, pre-commit framework, old `quality.yml`.
3. **History.** Old Conventional Commits and branch names stay (never rewrite shared history). Rename open branches to Conventional Branch; enforcement starts now. First release after the retrofit computes the bump from commits since the last SemVer tag; if old tags aren't SemVer, create the first `vX.Y.Z` via the release flow.
4. **Mass formatting.** Formatter only, single commit in the docs language, e.g. `🎨 Aplica formatação padrão (ruff)`; add SHA to `.git-blame-ignore-revs`; `git config blame.ignoreRevsFile .git-blame-ignore-revs`. Do it when few branches are open.
5. **Lint baseline.** Ruff `--add-noqa` (+ `RUF100` to drop stale ones); ESLint `--suppress-all` / `--prune-suppressions` (ESLint ≥ 9.24); Biome: safe `--write`, rest `biome-ignore` with reason or `overrides` to `warn` in legacy dirs; Dart `// ignore_for_file:` or temporary analyzer excludes. One Jira chore per suppression batch.
6. **Types gradually.** mypy `strict` + per-module `ignore_errors` overrides removed one PR at a time; TS strict flags one by one.
7. **Code language.** Portuguese identifiers don't block (`standards` checks added lines only). Rename modules opportunistically; DB tables/columns via ORM migrations with `@map`/`db_column` during transition. `standards.js --all` measures progress.
8. **Coverage and go-live.** Measure; raise tests until 75% (85% on `main`); then set `IN_PRODUCTION=true` (Enterprise: `in_production` property) — everything becomes blocking.

## Never
Mix reformatting with behavior changes; disable a rule globally because legacy violates it; make a gate blocking before the trunk passes it; rewrite pushed history to "fix" commit messages.
