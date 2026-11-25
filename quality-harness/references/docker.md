# Stack: docker (hadolint + trivy)

Not a `projects.js` stack: `ci.yml`'s `detect` step lists tracked Dockerfiles (`Dockerfile`, `Dockerfile.*`, `*.Dockerfile`), keeps those whose directory changed (all on push or when `ci.yml`/`.hadolint.yaml` change), and the `container` job runs hadolint → `docker build` → trivy (HIGH/CRITICAL, `ignore-unfixed`) per file. Result feeds `ci-ok` (follows `IN_PRODUCTION`).

## Dockerfile rules
Pinned base tag (digest in PCI); multi-stage, minimal runtime; non-root `USER`; `.dockerignore` (assets/docker); no secrets in `ARG`/`ENV` (use `--mount=type=secret` or runtime injection); `HEALTHCHECK` when the orchestrator lacks one. Revisit `ignore-unfixed` for PCI repos.

## Setup
Copy `assets/docker/.hadolint.yaml` and `.dockerignore`; `.lefthook/docker.yml` ← `assets/docker/lefthook.docker.yml` (local binary or the official image); append `assets/docker/dependabot.docker.yml`. IaC misconfig is Checkov in `infra.yml` — not duplicated here.
