# Deltapag Guardrails — agent rules

Imperative rule files for AI coding agents (Claude Code, Cursor) working in Deltapag and related projects (Moneo). Each file is self-contained context you load into the agent for the relevant task. They are written to be read by an agent, not narrated to a human — short, directive, and opinionated for a fintech sub-acquirer under LGPD.

## Convention

Every file uses the same keywords:

- `MUST` — hard rule, never violate.
- `NEVER` — prohibited.
- `SHOULD` — default; deviating requires a one-line justification in the PR.
- `STOP` — halt and surface a plan to the human before acting (irreversible or production-financial actions).

Conflict order when rules collide: **correctness > security > reversibility > consistency > performance > convenience.**

## Files

| File | Use when the agent is working on… |
|------|-----------------------------------|
| `rest-api.md` | designing/changing REST endpoints, contracts, status codes, idempotency |
| `frontend.md` | client UI (React/web), forms, accessibility, Moneo clarity requirements |
| `nextjs-fullstack.md` | Next.js App Router — the server/client boundary, Server Actions, caching |
| `backend.md` | services/Lambda/workers, queues, webhooks, money-moving logic |
| `aws-cost.md` | writing IaC / provisioning AWS, controlling standing spend |
| `aws-security.md` | IAM, network, encryption, secrets, public-exposure on AWS |
| `flutter.md` | any Flutter/Dart app — secrets in the binary, analyze/format gate, state, money as int |
| `flutter-mobile.md` | Flutter on iOS/Android — secure storage, ATS/cleartext, permissions, signing |
| `flutter-web.md` | Flutter Web — public bundle, CSP/CORS, caching, `dart:io` on web |
| `flutter-desktop.md` | Flutter on macOS/Windows/Linux — sandbox/entitlements, signing, auto-update |
| `supabase.md` | Postgres + RLS, Auth, Edge Functions, Storage, migrations |
| `github-actions.md` | CI/CD workflows, action pinning, deploy gating, secrets in CI |

For Next.js work, load `nextjs-fullstack.md` together with `frontend.md` and `backend.md` — it governs the seam, the other two govern each side.

## How to use

- Drop the relevant file(s) into the agent's context (e.g. reference from `CLAUDE.md`, a Cursor rule, or paste at task start).
- The `STOP-and-ask triggers` block at the bottom of each file is the reversibility contract — it tells the agent exactly when to halt and present a plan before doing something irreversible or touching production money flows.

## Maintenance

These are living standards. When a rule causes friction or a near-miss happens, update the file and note why. Revisit when the stack, regulatory posture, or project mix changes.
