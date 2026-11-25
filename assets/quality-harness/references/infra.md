# Infra and DevOps

Policy in `standards.json → infra`, checked by `standards`; human detail in `docs/INFRA.md` (pt-BR).

## Hosting by criticality
| `criticality` | Examples | Allowed hosting |
|---|---|---|
| `high` | payments, PCI DSS scope, personal data | AWS or Azure, managed services |
| `medium` | internal APIs, backoffice, integrations | AWS or Azure |
| `low` | landing pages, small internal tools, POCs | AWS, Azure or VPS + monthly security review |

Blocked: `vps` + `medium/high`; `vps` + `pciScope`; other clouds/platforms (GCP, Vercel, …) without `exceptionAdr`; `azure` + `cdk`.

## IaC
- Everything in `infra/`; Terraform default (AWS, Azure; also VPS providers); AWS CDK (TypeScript) allowed on AWS-only projects (`infra/cdk.json` switches the workflow). No console-only resources; emergency resources imported the same day.
- Never commit `*.tfstate` (`.gitignore` + Enterprise push ruleset).
- Other IaC tools (Pulumi, OpenTofu…) are not in the policy → ADR.
- Layout, versions/lock file, remote state, tags, quality gates, drift: module [devops/terraform.md](devops/terraform.md). Cloud specifics: [devops/aws.md](devops/aws.md), [devops/azure.md](devops/azure.md).

## CI/CD — GitHub Actions + OIDC
No long-lived cloud keys. Variables: `AWS_ROLE_ARN`, `AWS_REGION` (default `sa-east-1`); `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`; `TF_ROOT`. Trust policy scoped: `repo:ORG/REPO:environment:production` (deploy), `repo:ORG/REPO:pull_request` (read-only plan).

`infra.yml` (path-filtered on `infra/`, not required): Terraform `fmt -check`, `validate`, `plan` (with OIDC) / CDK `synth`, `diff`; Checkov on Terraform or synthesized CloudFormation. Container images are scanned separately in `ci.yml` (`container` job: hadolint + trivy).

## VPS
Only `low`. `vps-security-review.yml` opens `🔒️ Revisão de segurança VPS — YYYY-MM` on day 1 with the checklist (packages, Lynis, SSH, users, firewall, TLS, tested backup restore, logs, alerts, criticality) and flags last month's open issue as late.

## Database — ORM first
| Stack | ORM | Migrations |
|---|---|---|
| Node / Next.js | Prisma or Drizzle | `prisma migrate` · `drizzle-kit` |
| Python / FastAPI | SQLAlchemy 2 | Alembic |
| Python / Django | Django ORM | `makemigrations` |
| Flutter (local) | drift | drift migrations |

Declare `database.engine` + `database.orm`; raw-SQL-only requires `rawSqlAdr`. Raw SQL only for measured cases (heavy reports, bulk), always parameterized. Schema changes only via ORM migrations. Naming, types, migration safety, roles, backups: module [practices/database.md](practices/database.md).
