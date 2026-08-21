# Base Rule — Git & Commits

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human.

## Commit message format (emojicommit)

- MUST format every commit subject as: `<emoji> <type>: <imperative subject>` — e.g. `✨ feat: add merchant settlement report`, `🐛 fix: reject expired idempotency keys`.
- MUST write subject in English, imperative mood, ≤ 72 chars, no trailing period. Body (when needed) in PT-BR explaining the WHY (per language.md).
- MUST pick the emoji/type from this table:

| Emoji | Type | Use |
|---|---|---|
| ✨ | feat | new feature |
| 🐛 | fix | bug fix |
| ♻️ | refactor | no behavior change |
| 🔥 | remove | delete code/files |
| 📝 | docs | docs/README/ADR only |
| ✅ | test | add/fix tests |
| 🎨 | style | formatting, no logic |
| ⚡️ | perf | performance |
| 🔒 | security | security fix/hardening |
| ⬆️ | deps | upgrade dependencies |
| 🔧 | chore | config, tooling |
| 🚀 | deploy | CI/CD, release |
| 🗃️ | db | migrations, schema |
| 🚑 | hotfix | critical prod fix |
| ⏪ | revert | revert commit |

- SHOULD keep each commit atomic: one logical change. NEVER mix a refactor and a feature in one commit.
- NEVER commit commented-out code, debug prints, `console.log`, or TODO-without-owner as part of a "done" change.

## Agent commit policy (hard boundary)

- Agents and subagents MAY commit only on non-main branches (feature/fix/chore branches) and in merge flows.
- On `main`/`prod`/the primary branch: agents MUST only `git add` (stage) the changes and report what was staged. The human reviews and commits. NEVER commit directly to the primary branch as an agent.
- NEVER force-push, rewrite history (`rebase -i`, `commit --amend` on pushed commits), or delete branches without explicit human approval.
- STOP before: merging into the primary branch, tagging a release, or any push that triggers a production deploy.

## Branching

- SHOULD name branches in English: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `hotfix/<slug>`.
- MUST branch off the primary branch fresh; NEVER stack work on a stale branch without rebasing/merging first.
- SHOULD keep branches short-lived; a branch older than a sprint is a merge-conflict factory.

## Hygiene

- MUST run the project's lint/type/test gate before committing (or state explicitly that it was skipped and why).
- NEVER use `git add .` blind on a dirty tree — stage the files you touched, review the diff, then commit. Unrelated files in a commit are how secrets and junk land in history.
- STOP before any history-destructive operation: `reset --hard` on shared work, `clean -fd`, filter-branch/filter-repo.
