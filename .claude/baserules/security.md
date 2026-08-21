---
scope: base rule — applies to every project, every language, every domain
audience: AI coding agents (Claude Code, Cursor)
context: Deltapag fintech (LGPD, PCI-adjacent) + Moneo. Secure-by-default coding baseline.
note: domain files (aws-security, supabase, backend, rest-api, github-actions) extend this — this is the floor, not the ceiling.
---

# Base Rule — Security

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human.
This is the secure-coding floor for all code. Never trade it away for speed or convenience.

## Secrets & keys (never leak)

- NEVER hardcode secrets, API keys, tokens, passwords, connection strings, or private keys in source, tests, fixtures, comments, or commit history. Read them from env/secret store at runtime.
- NEVER commit a `.env` (or any real-secret file). Commit a `.env.example` with empty/placeholder values only. Ensure secret files are git-ignored before writing them (see ignore-files.md).
- NEVER log, print, echo, or include in error responses/stack traces: secrets, tokens, full card data (PAN/CVV), passwords, or session identifiers. Mask when a value must appear (e.g. card BIN+last4, key id only).
- NEVER expose a server-side/admin/service-role secret to client code or a public/`NEXT_PUBLIC_` variable. If a key bypasses access control (e.g. Supabase `service_role`), it lives only in trusted server runtime.
- MUST assume any secret that ever touched a commit, a log, or a screenshot is compromised — STOP and tell the human to rotate it rather than quietly reusing it.
- SHOULD run a secret scanner (gitleaks/trufflehog) in CI and fail the build on a finding.

## No bypasses (the rule is the rule)

- NEVER disable, comment out, weaken, or add an exception to an auth/authz check, signature verification, TLS/cert validation, RLS policy, CSRF/CORS rule, or input validation to "make it work." If something is blocked, fix the real cause or STOP and ask.
- NEVER add a hidden backdoor, debug bypass, hardcoded master password, `if (env === 'dev') skipAuth`, magic header/param that skips checks, or "god mode" flag. A dev-only shortcut WILL reach prod.
- NEVER disable security linters/scanners or add blanket suppressions (`// nosec`, `eslint-disable`, `# noqa`) to silence a real security warning. Suppress only with a specific rule id + a PT-BR comment justifying it, and prefer fixing.
- NEVER set `verify=false`, `rejectUnauthorized: false`, `InsecureSkipVerify`, or accept any/self-signed certs in code paths that reach production.

## Input is hostile

- MUST validate and sanitize all external input (HTTP body/query/headers, queue/webhook payloads, file uploads, env at boundaries) against a schema before use. Treat everything from outside the process as attacker-controlled.
- NEVER build SQL, shell commands, file paths, or HTML by string concatenation with untrusted input. Use parameterized queries, safe argument arrays, path normalization with allow-lists, and context-aware output encoding. (Prevents SQLi, command injection, path traversal, XSS.)
- NEVER pass untrusted input to `eval`, dynamic `require`/`import`, deserialization of arbitrary types, or a template engine without escaping.
- MUST enforce size/type/range limits on input and uploads; reject by default, allow-list what's permitted. NEVER use a deny-list as the only filter.
- MUST verify webhook authenticity (HMAC/signature) before acting on the payload.

## AuthN / AuthZ

- MUST authenticate by default and enforce object-level authorization (does THIS principal own/may-access THIS record?) in the server/data layer — not only in the UI or a route guard.
- MUST derive the caller's identity from the verified token/session, NEVER from a client-supplied id/role field.
- MUST scope every data access by tenant/merchant; NEVER run an unscoped query that can cross tenant boundaries.
- SHOULD apply least-privilege everywhere (DB roles, IAM, service tokens). Grant the minimum; NEVER use an admin/root credential for routine work.

## Crypto & data handling

- MUST use vetted libraries for crypto, hashing, and tokens. NEVER roll your own crypto. Hash passwords with a slow KDF (argon2/bcrypt/scrypt) + salt; NEVER store plaintext or fast-hash (md5/sha1) passwords.
- MUST use cryptographically secure randomness for tokens/ids/secrets (CSPRNG), NEVER `Math.random()` for anything security-relevant.
- MUST enforce TLS in transit and encryption at rest for PII/financial data (LGPD). NEVER send sensitive data over plaintext channels.
- SHOULD collect and retain the minimum PII necessary (data minimization), and NEVER put PII/card data in logs, analytics events, or URLs/query strings.

## Dependencies & supply chain

- MUST prefer maintained, widely-used libraries over hand-rolled security code. NEVER add an unvetted/abandoned dependency to a sensitive path.
- SHOULD pin dependency versions (lockfile committed) and run dependency/vulnerability scanning in CI. STOP before adding a dependency that handles auth, crypto, or payments without review.

## Errors & failure mode

- MUST fail closed: on an auth/validation/crypto error, deny the action. NEVER fall through to a permissive default on failure.
- MUST return generic, PT-BR, user-safe error messages to clients; keep detailed diagnostics in server logs (English) keyed by a trace id. NEVER leak internals (stack traces, SQL, file paths, library versions) to the client.

## STOP-and-ask triggers

Halt and surface the issue before: weakening any security control to unblock work, handling/rotating a leaked secret, adding a dependency on a sensitive path, introducing any auth/crypto/PII flow, or anything you'd be uncomfortable defending in a post-incident review.
