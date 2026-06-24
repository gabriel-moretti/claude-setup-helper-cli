---
scope: base rule — applies to every project, every language, every domain
audience: AI coding agents (Claude Code, Cursor)
context: Deltapag + Moneo. Code reads in English; humans read in PT-BR; end users read in PT-BR.
---

# Base Rule — Language

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification.
This rule sets the language of every artifact. It overrides any default the agent might assume.

## Code → English (mandatory)

- MUST write all code in English: identifiers, variable/function/class/method names, type and interface names, enum members, module/package names, file and directory names (for source files), CLI flags, config keys you define, branch names, and git commit messages.
- MUST keep English consistent — NEVER mix Portuguese and English inside an identifier (no `calcularTotalAmount`, no `userSenha`).
- SHOULD use clear, domain-correct English terms even for Brazilian-payments concepts: `settlement` (not `liquidacao`), `reconciliation` (not `conciliacao`), `split`, `chargeback`, `merchant`, `acquirer`, `payout`. When a regulatory/business term has no clean English equivalent, keep the canonical Portuguese term verbatim (e.g. `pix`, `boleto`, `cnpj`, `cpf`) — these are proper nouns, not translations.

## Database columns → English (preferred, not mandatory)

- SHOULD name tables and columns in English (`created_at`, `merchant_id`, `amount_cents`). This is the default.
- MAY keep a Portuguese column/table name when it mirrors a regulated/legacy/official field where translating would cause ambiguity (e.g. `cnpj`, `razao_social`). NEVER translate a legal field name in a way that changes its meaning.
- MUST stay consistent within a table/schema — NEVER mix `created_at` and `data_criacao` in the same table.

## Comments & human docs → Portuguese (PT-BR)

- MUST write all human-facing prose in Portuguese (PT-BR): code comments, docstrings, commit body explanations meant for the team, README/markdown, ADRs, runbooks, PR descriptions, and inline `// TODO` / `// NOTE`.
- EXCEPTION — AI/tooling config is exempt and stays in English: anything under `.claude/`, `.cursor/`, `.github/` agent configs, these guardrail files, and similar agent-facing instruction files. Write those in English.
- Doc comments that are ALSO API contract surface (e.g. OpenAPI descriptions exposed to external integrators) SHOULD follow the audience: external/public API docs may be Portuguese if that's the integrator audience — confirm per project rather than assuming.

## User-facing messages → Portuguese (PT-BR)

- MUST write every string that can reach an end user in Portuguese: UI copy, validation messages, error messages surfaced to the client, emails, notifications, toast/alert text.
- MUST keep the machine-readable side English and stable: error `code`s, enum values, log messages, and the internal `message` are English/code; only the human-facing `message`/copy is Portuguese. NEVER localize an error `code` or an enum value.
- SHOULD route user-facing copy through an i18n/message layer (keys in English, values in PT-BR) rather than hardcoding Portuguese strings in logic — this keeps code English and copy translatable.
- NEVER leak an internal English log/exception string directly to the user; map it to a Portuguese, user-safe message.

## Quick reference

| Artifact | Language |
|---|---|
| Identifiers, code, file names, commits, branches | English (mandatory) |
| DB tables/columns | English (preferred; PT allowed for legal/legacy fields) |
| Comments, docstrings, README, ADRs, runbooks, PR text | PT-BR |
| `.claude` / `.cursor` / agent config / these guardrails | English |
| UI copy, validation & error messages to users, emails | PT-BR |
| Error `code`, enum values, log lines | English/code |
