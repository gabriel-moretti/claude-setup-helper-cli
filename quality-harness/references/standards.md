# Standards — `.github/standards.json` and the `standards` check

## Schema
```json
{
  "code":     { "language": "en", "enforcement": "error", "domainTerms": ["pix","boleto","cnpj","cpf","cep","nsu","ted","rav","nfe","nfse","icms","pis","cofins","cnab","sped","mei"], "ignore": ["**/generated/**", "**/*.g.dart", "..."] },
  "docs":     { "languages": ["pt-BR"] },
  "ai":       { "language": "en", "files": ["AGENTS.md", "CLAUDE.md", ".claude/**", "**/SKILL.md", ".cursor/rules/**", ".github/copilot-instructions.md", "prompts/**"] },
  "infra":    { "criticality": "low|medium|high", "hosting": "aws|azure|vps|<other>", "iac": "terraform|cdk", "pciScope": false, "exceptionAdr": null },
  "database": { "engine": null, "orm": null, "rawSqlAdr": null },
  "modules":  ["github", "nextjs", "database"]
}
```
Missing keys fall back to `lib/standards.js` DEFAULTS.

## Questionnaire (ask during CRIAR/RETROFIT; fill the file from answers)
1. Docs languages — `["pt-BR"]` or multi (`["en","pt-BR"]` → `README.pt-BR.md`). First = primary.
2. Extra domain terms beyond the defaults (product names, acquirer jargon: e.g. `mdr`, `ur`, `edi` if used as identifiers).
3. Criticality — PCI/card/personal data → `high`; outage hits clients/revenue → `medium`; else `low`.
4. Hosting — `aws` or `azure`; `vps` only for `low` and never PCI; anything else requires an ADR in `exceptionAdr`.
5. IaC — `terraform` (AWS/Azure) or `cdk` (AWS only).
6. PCI scope — `pciScope` (also Enterprise property `pci_dss`).
7. Database — `engine` + `orm` (Prisma/Drizzle, SQLAlchemy 2 + Alembic, Django ORM, drift). No ORM → ADR in `rawSqlAdr`.
8. Modules — after 1–7 (hosting/IaC drive `aws`/`azure`/`terraform`); see `modules.md` and SKILL.md step 4.

`modules`: optional modules only (never base layers). `lib/standards.js` validates names against `KNOWN_MODULES` (= keys of the skill's `modules.json`); unknown name → `standards` fails. Written by `scripts/apply_modules.py` (additive).

## Rules enforced by `standards.js`
- **Code 100% English**: identifiers, file names, DB tables/columns, ORM-mapped names (`@map`, `db_column`, `__tablename__`, `Column("…")`, Drizzle, TypeORM). Heuristic: accents + dictionary of common Brazilian-system words; comments and strings ignored; `domainTerms` allowed.
- **Ratchet**: PR mode checks only **added lines** (`--base <target>`); legacy Portuguese doesn't block but can't grow. Full audit: `node .github/scripts/standards.js --all`.
- **AI-facing files English** (`ai.files` globs) — terse, token-efficient.
- **Docs languages**: each extra language needs its README.
- **Infra/DB policy**: see `infra.md`.

Human-facing text (comments, docs, README, commits, PRs, issues, CHANGELOG) uses `docs.languages`.
