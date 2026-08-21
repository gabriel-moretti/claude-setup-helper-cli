# Plan — Package rules as a personal Claude Code plugin

Status: idea, not started. Execute when the rule set starts being copied into product repos (deltapag / aki-mais / alquimeat / zoov) — copy-paste is the trigger; before that, this repo alone is fine.

## Problem

`CLAUDE.md` here `@`-includes ~20 rule files (~all guardrails) into every session. Two issues once rules go company-wide:

1. **Context bloat**: a Flutter repo pays tokens for supabase.md, aws-cdk.md, nextjs-fullstack.md on every turn.
2. **Copy-paste drift**: copying `.claude/` into each product repo forks the rules; fixes stop propagating.

## Shape

One plugin, e.g. `deltapag-standards`, hosted in a git repo (this one or extracted), installed via marketplace entry in each machine's `~/.claude/settings.json`.

```
deltapag-standards/
├── .claude-plugin/plugin.json
├── skills/
│   ├── emojicommit/SKILL.md
│   └── audit-rules/SKILL.md
├── hooks/
│   ├── hooks.json            # PreToolUse wiring (commit-gate, migration-gate, secret-leak-gate, irreversibility-gate)
│   └── *.sh
├── rules/
│   ├── baserules/*.md        # always applicable
│   └── guardrails/*.md       # stack-specific
└── workflows/                 # guardrail-compliance.js, migration-review.js, perf-validate.js, security-scan.js, uiux-audit.js
```

## Selective loading (the point of the exercise)

Plugins don't auto-inject rules — that's the feature. Each product repo's `CLAUDE.md` gets a short header:

```markdown
## Rules
@~/.claude/plugins/deltapag-standards/rules/baserules/language.md
@~/.claude/plugins/deltapag-standards/rules/baserules/security.md
@~/.claude/plugins/deltapag-standards/rules/baserules/git-commits.md
@~/.claude/plugins/deltapag-standards/rules/baserules/ignore-files.md
@~/.claude/plugins/deltapag-standards/rules/guardrails/<only-this-repo's-stack>.md
```

Provide a `/setup-rules` skill in the plugin that detects the repo stack (same logic as audit-rules step 1) and writes this header — so per-repo selection is generated, not hand-maintained.

Note: verify `@`-include of absolute/`~` paths outside the repo works at execution time; if not, `/setup-rules` copies the selected files into the repo's `.claude/rules/` and re-running it refreshes them (versioned copy > drifting fork).

## Migration steps (when triggered)

1. Add `.claude-plugin/plugin.json` + restructure per above (keep this repo as the source).
2. Move hooks wiring from `.claude/settings.json` into plugin `hooks/hooks.json`.
3. Build `/setup-rules` skill (stack detection → CLAUDE.md header or `.claude/rules/` copy).
4. Add marketplace entry; install in each machine/repo; delete per-repo copies.
5. Versioning: tag releases; product repos update deliberately, not implicitly.

## Open questions

- Private plugin distribution for the team (git-based marketplace works; check auth for private repo on teammates' machines).
- Whether hooks should be per-repo opt-out (a repo without a DB doesn't need migration-gate — harmless though, it only matches DB commands).
- Whether to split `rules/` into its own plugin vs bundling with skills/workflows (start bundled; split only if teams want rules without tooling).
