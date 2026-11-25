# ☁️ Infra e DevOps

Política definida em `.github/standards.json → infra` e validada pelo check `standards`.

## 1. Onde hospedar

```
O projeto está no escopo PCI DSS ou trata dados de cartão / pessoais?
├─ sim → criticality: high → AWS ou Azure
└─ não → parar o serviço afeta clientes ou receita?
         ├─ sim → criticality: medium → AWS ou Azure
         └─ não → criticality: low → AWS, Azure ou VPS (com revisão mensal)
```

```json
"infra": { "criticality": "high", "hosting": "aws", "iac": "terraform", "pciScope": true, "exceptionAdr": null }
```

| Combinação | Resultado do check |
|---|---|
| `vps` + `medium`/`high` | ❌ bloqueia |
| `vps` + `pciScope: true` | ❌ bloqueia |
| `gcp`, `vercel`, … sem ADR | ❌ bloqueia — registre a decisão em `docs/adr/` e aponte em `exceptionAdr` |
| `azure` + `cdk` | ❌ bloqueia — CDK é AWS; use Terraform |

## 2. Infra como código

```
infra/
  modules/            módulos reutilizáveis
  envs/
    production/       main.tf · backend.tf · terraform.tfvars
    test/
    sandbox/
```

- **Terraform** é o padrão (AWS e Azure). **AWS CDK** (TypeScript) é aceito em projetos só AWS — `infra/cdk.json` ativa o caminho CDK no workflow.
- Estado remoto com lock: S3 (`use_lockfile = true`, Terraform ≥ 1.10) na AWS, ou Storage Account com lease no Azure. Nunca estado local commitado (`*.tfstate` é bloqueado no push pelo ruleset Enterprise e pelo `.gitignore`).
- Nada criado à mão no console. Se precisou criar em emergência, importe para o Terraform no mesmo dia.
- Tags obrigatórias em todo recurso: `project`, `environment`, `criticality`, `owner`, `managed-by=terraform`.

## 3. GitHub Actions → nuvem sem chave fixa (OIDC)

| Variável do repositório | Para quê |
|---|---|
| `AWS_ROLE_ARN` | role assumida pelo Actions via OIDC (`token.actions.githubusercontent.com`) |
| `AWS_REGION` | padrão `sa-east-1` |
| `AZURE_CLIENT_ID` · `AZURE_TENANT_ID` · `AZURE_SUBSCRIPTION_ID` | federated credential do Azure AD |
| `TF_ROOT` | diretório para o `terraform plan` no PR (ex.: `infra/envs/production`) |

Restrinja a trust policy da role ao repositório e ao ambiente: `repo:ORG/REPO:environment:production` para deploy e `repo:ORG/REPO:pull_request` (somente leitura) para o plano.

## 4. O que o workflow `infra` faz

| Etapa | Terraform | CDK |
|---|---|---|
| 🎨 Formatação | `terraform fmt -check -recursive` | — (lint do projeto TS) |
| 🔍️ Validação | `terraform validate` em cada diretório | `cdk synth` |
| 📋 Plano (com OIDC) | `terraform plan` no resumo do job | `cdk diff` |
| 🔒️ Segurança | Checkov (terraform) | Checkov (CloudFormation sintetizado) |

## 5. VPS — revisão mensal

Só para `criticality: low`. Todo dia 1, o workflow `vps-security-review` abre a issue **🔒️ Revisão de segurança VPS — AAAA-MM** com o checklist (pacotes, Lynis, SSH, usuários, firewall, TLS, backup com restauração testada, logs, alertas, criticidade). Se a do mês anterior ainda estiver aberta, ela recebe um aviso de atraso.

Mesmo em VPS, provisione com Terraform (provedores como Hetzner, DigitalOcean e Linode têm provider oficial).
