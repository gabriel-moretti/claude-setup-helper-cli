# AI agents

## Files (English, terse — token efficiency)
- `AGENTS.md`: single rule file for any agent (Claude Code, Codex, Cursor, Copilot…). Keep it short; link `CONTRIBUTING.md` for humans.
- `CLAUDE.md`: only `@AGENTS.md`.
- `.claude/**`, `**/SKILL.md`, prompts, `.cursor/rules/**`, `.github/copilot-instructions.md`: English; covered by `standards.json → ai.files`.

## `.claude/settings.json`
- `attribution.commit = ""`, `attribution.pr = ""`, `sessionUrl: false` — consistent with no-AI-attribution commits.
- Default team skills via `extraKnownMarketplaces` + `enabledPlugins` (offered when the folder is trusted):

| Skill | Purpose | Source |
|---|---|---|
| caveman | short answers, fewer output tokens | `JuliusBrussee/caveman` |
| ponytail | minimal code: reuse before writing | `DietrichGebert/ponytail` |
| superpowers | brainstorm → plan → TDD → review | `obra/superpowers-marketplace` |
| GitHub Actions: Minuten sparen | Actions minute saving | **TODO: source unidentified — do not add until the user supplies the repo** |

## Security note (state it when applying)
Third-party skills/plugins can install hooks and run code; caveman runs a local proxy. Review each repo before enabling. In PCI scope, pin each marketplace to a reviewed `ref` (tag or commit) instead of the default branch, and re-review on update.

## Agent behavior rules (already in AGENTS.md)
Branch types without AI prefixes; gitmoji commits; never AI trailers or mentions; AI usage only in the PR 🤖 section; code English; ORM first; IaC only; no tags by hand; run format/lint/typecheck/tests before done.
