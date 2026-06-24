---
scope: base rule — applies to every project
audience: AI coding agents (Claude Code, Cursor)
context: efficient, secure .gitignore and .dockerignore. Goal: never commit secrets/junk; never bloat the image/build context.
---

# Base Rule — Ignore Files (.gitignore / .dockerignore)

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification.
Two different jobs: `.gitignore` keeps secrets and junk out of version control; `.dockerignore` keeps junk and secrets out of the build context (smaller, faster, safer images). They are NOT interchangeable — maintain both.

## Shared principles

- MUST create/maintain the ignore file in the same change that introduces files that should be ignored. NEVER let a secret or a build artifact get committed/copied first and cleaned up later — for git, history is forever.
- SHOULD generate a language/framework baseline from a known-good source (e.g. github/gitignore, `npx gitignore node`) and then add project specifics, rather than writing from memory.
- MUST keep entries scoped and intentional. NEVER blanket-ignore a whole top-level source dir (`src/`, `app/`) — you'll silently drop tracked files.
- SHOULD comment non-obvious entries in PT-BR (per language.md), grouped by purpose.
- MUST verify the result: `git status --ignored` / `git check-ignore -v <path>` for git; `docker build` context size for docker. NEVER assume an entry matched.

## .gitignore — must ignore

- MUST ignore all real secret/env files: `.env`, `.env.*`, `*.local`, credentials, `*.pem`, `*.key`, `*.p12`, `*.keystore`, service-account JSON, `.npmrc`/`.pypirc` with tokens. KEEP `.env.example` tracked (placeholders only — see security.md). Pattern: ignore `.env*` then un-ignore the example with `!.env.example`.
- MUST ignore dependencies and build output: `node_modules/`, `.venv/`/`venv/`, `__pycache__/`, `dist/`, `build/`, `.next/`, `out/`, `target/`, `*.pyc`.
- MUST ignore local/IDE/OS noise: `.DS_Store`, `Thumbs.db`, `.idea/`, `.vscode/` (except shared settings you intentionally commit via `!`), `*.log`, `coverage/`, `.cache/`, `tmp/`.
- MUST ignore infra state with secrets: `*.tfstate`, `*.tfstate.*`, `.terraform/`, `*.tfvars` holding real values (keep `*.tfvars.example`).
- SHOULD ignore local test/db artifacts: `*.sqlite`, dumps, `.supabase/` local volumes, local seed data with real PII.
- NEVER git-ignore lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `poetry.lock`, `Cargo.lock`) — they MUST be committed for reproducible, supply-chain-safe builds.
- NEVER rely on `.gitignore` to protect an ALREADY-tracked file — ignore only affects untracked files. If a secret is already tracked, STOP, rotate it (security.md), and remove it from history.

## .dockerignore — must ignore

- MUST exist for any image build. Without it, `docker build` ships your whole working tree into the context — slow, fat, and a secret-leak risk (`.env`, `.git`, keys baked into layers).
- MUST ignore: `.git/`, `.gitignore`, `node_modules/` (reinstall inside the image for the target platform), `.env`/`.env.*` and all secrets, build output (`dist/`, `.next/`, `build/`), `*.log`, `coverage/`, test files, CI config, docs/markdown, `.vscode/`/`.idea/`, `Dockerfile*`/`docker-compose*` (not needed inside the image), and `.dockerignore` itself.
- NEVER copy secrets into an image. Even with `.dockerignore`, NEVER `COPY . .` then add secrets via build args that persist in layers — use runtime env/secret mounts. A secret in any layer is recoverable from the image.
- SHOULD keep the context minimal: prefer ignoring everything not needed at runtime. A lean context = faster builds and smaller attack surface.
- MUST remember `.dockerignore` does NOT read `.gitignore` — maintain it separately. An entry in one is not in the other.

## Efficiency checklist

- SHOULD order/group entries: secrets first, then deps, then build output, then local/OS noise — easy to audit at a glance.
- SHOULD use anchored patterns (`/build/` vs `build/`) when you mean a specific path, to avoid over-matching nested dirs.
- MUST re-check ignore files when adding a new tool/framework (it brings new artifacts and possibly new secret files).
