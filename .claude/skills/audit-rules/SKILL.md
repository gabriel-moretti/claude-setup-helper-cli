---
name: audit-rules
description: Audit the current repository against the personal baserules and guardrails (language, security, stack-specific). Use when the user runs /audit-rules or asks for a compliance/rules check of a codebase.
---

# Audit Rules

Checks a repo against the rule set in `~/Personal-Projects/claude/.claude/` (`baserules/` + `guardrails/`). If the repo has its own `.claude/baserules|guardrails`, those take precedence.

## Flow

1. **Detect stack** (fast, no deep read): lockfiles + manifests — `package.json` (Next.js? Prisma? Tailwind?), `pyproject.toml`/`requirements*.txt` (FastAPI? Pydantic?), `pubspec.yaml` (Flutter), `supabase/`, `Dockerfile`, `.github/workflows/`, `cdk.json`/`*.yml` CFN templates, LLM SDK deps (`anthropic`, `@anthropic-ai/*`, bedrock).

2. **Select applicable rules**: always `language.md`, `security.md`, `ignore-files.md`, `git-commits.md`; plus only the guardrails matching the detected stack. List the selection to the user before scanning.

3. **Scan** — read each selected rule file, then check the repo against its MUST/NEVER items. Prioritize by rule severity:
   - NEVER violations (hardcoded secret, Supabase admin/service key reachable from client code, float money, `using (true)` policy, unpinned 3rd-party action, `any` to silence errors)
   - MUST gaps (table without RLS, endpoint without auth, missing `.dockerignore`, no idempotency key on money mutation, naive datetimes, PT-BR identifiers / English comments per language.md)
   - SHOULD deviations without justification — report only the material ones.
   Scale: small repo (< ~50 source files) → scan inline. Larger → dispatch parallel Explore agents, one per rule domain.

4. **Report** — table, ordered by severity:

   | Severity | Rule | Location | Violation | Fix |
   |---|---|---|---|---|
   | 🔴 NEVER / 🟠 MUST / 🟡 SHOULD | `file.md` § section | `path:line` | what's wrong | one-line fix |

   End with: top 3 fixes by risk, and a count of what was checked vs skipped (no silent coverage gaps).

5. **Deep mode** — if the user asked for a thorough/comprehensive audit, offer the multi-agent workflow instead:
   `Workflow({ scriptPath: "~/Personal-Projects/claude/workflows/guardrail-compliance.js", args: { repo: "<abs path>" } })`
   (Requires the user's explicit opt-in per Workflow tool rules.)

## Never

- Report a violation without `path:line` evidence — read the code, don't pattern-guess.
- Auto-fix during the audit. Report first; fix only on request.
