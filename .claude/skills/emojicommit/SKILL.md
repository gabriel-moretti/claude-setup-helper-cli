---
name: emojicommit
description: Stage, group, and commit changes following the emojicommit convention and the agent branch policy. Use when the user asks to commit, runs /emojicommit, or work is finished and needs committing.
---

# Emojicommit

Commit flow enforcing `git-commits.md` (baserule). The commit-gate hook backs this mechanically — follow the flow and you will never trip it.

## Flow

1. **Inspect**: `git status` + `git diff` (and `git diff --staged`). Understand every changed file. If a changed file looks unrelated to the session's work, flag it and leave it unstaged.

2. **Branch check** — the hard fork:
   - On `main`/`master`/`prod`/`production`: **stage only.** `git add` the intended files, then present: files staged, one-line summary per logical change, and the suggested commit message(s). STOP — the human commits.
   - On any other branch: proceed to commit.
   - Uncommitted work on a primary branch that should become a branch? Offer `git checkout -b feat/<slug>` first.

3. **Group atomically**: one logical change per commit. Mixed diff (refactor + feature + config) → multiple commits, staged file-by-file (`git add <paths>`, never `git add .`).

4. **Message format**: `<emoji> <type>: <imperative subject>` — subject in English, ≤ 72 chars, no trailing period. Body (only when the why is non-obvious) in PT-BR.

| Emoji | Type | Use |
|---|---|---|
| ✨ | feat | new feature |
| 🐛 | fix | bug fix |
| ♻️ | refactor | no behavior change |
| 🔥 | remove | delete code/files |
| 📝 | docs | docs only |
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

5. **Gate before committing**: run the project's lint/typecheck (and tests if fast). Red → report and ask; don't commit broken work silently.

6. **Commit** each group. Then show `git log --oneline -n <count>` as receipt.

## Never

- `git add .` on a dirty tree.
- Commit debug prints, commented-out code, or files the session didn't touch.
- Force-push, amend pushed commits, or commit on a primary branch (hook blocks these anyway).
