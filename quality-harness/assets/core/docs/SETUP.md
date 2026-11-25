# ⚙️ Setup — GitHub Free ou Enterprise

O kit funciona nos dois planos. **O que muda é onde a regra é garantida**: no Free privado ela é sinalizada (checks + hooks + auditoria); no Free público e no Enterprise ela **bloqueia**.

## 1. Copiar para o repositório

```bash
cp -r .github .claude .lefthook governance scripts lefthook.yml cliff.toml .editorconfig .gitattributes .gitleaks.toml .gitignore \
      AGENTS.md CLAUDE.md VERSION CHANGELOG.md README.md CONTRIBUTING.md docs /caminho/do/repo/

# placeholders
grep -rlE 'OWNER/REPO|@OWNER/' . --include='*.md' --include='*.yml' --include='CODEOWNERS' \
  | xargs sed -i 's#OWNER/REPO#minha-org/meu-repo#g; s#@OWNER/#@minha-org/#g; s#sponsors/OWNER#sponsors/minha-org#g'

# .lefthook/: mantenha só os fragmentos das stacks do repo (node, python, flutter, docker) e ajuste o extends do lefthook.yml
lefthook install          # hooks locais (todos os planos)
# edite .github/standards.json: idiomas dos docs, termos de domínio, criticidade, hosting, IaC, banco/ORM
node --test .github/scripts/test/*.test.js
```

Crie as trunks opcionais se for usar: `git push origin main:test` · `git push origin main:sandbox`.

## 2A. 🆓 Caminho GitHub Free

```bash
gh auth login
governance/free/apply.sh minha-org/meu-repo
IN_PRODUCTION=true governance/common/repo.sh minha-org/meu-repo   # quando entrar em produção
```

| Aplica | Repo público | Repo privado |
|---|---|---|
| Merge: squash (trabalho) + merge commit (back-merge), título do PR como commit | ✅ | ✅ |
| Variáveis `IN_PRODUCTION`, `COVERAGE_MIN`, `COVERAGE_MIN_PROD` | ✅ | ✅ |
| Environments `production` (só tags `v*`), `test`, `sandbox` | ✅ com aprovação | ✅ sem aprovação |
| Ruleset `main`: PR, code owners, squash, linear, checks obrigatórios | ✅ | ❌ |
| Ruleset `test`/`sandbox` e tags `v*` só pelo workflow | ✅ | ❌ |
| Secret scanning + push protection | ✅ | ❌ (pago) |

**Repo privado no Free** — sem rulesets, a defesa fica em camadas:
1. **Hooks locais** (lefthook) barram commit e branch fora do padrão antes do push.
2. **Checks** rodam em todo PR e ficam vermelhos (não bloqueiam o botão de merge).
3. **Auditoria pós-merge**: o `conventions` roda em todo push em `main/test/sandbox` e acusa o que escapou.
4. **Tags** saem só do workflow; combine com o time não criar tags na mão.

## 2B. 🏢 Caminho GitHub Enterprise

```bash
# 1. Regras da ORGANIZAÇÃO — padrões entram em modo evaluate (registra sem bloquear)
governance/enterprise/apply-org.sh minha-org

# 2. Marque cada repositório (a propriedade escolhe as regras)
governance/enterprise/set-repo.sh minha-org/meu-repo in_production=false stack=node,python   # criticality/hosting vêm do standards.json
governance/enterprise/set-repo.sh minha-org/pagamentos in_production=true pci_dss=true stack=python

# 3. Acompanhe Organization → Settings → Rulesets → Insights por 1–2 semanas, depois:
governance/enterprise/apply-org.sh minha-org --enforce

# (opcional) exigir os workflows de um repositório central em todos os repos em produção
governance/enterprise/apply-org.sh minha-org --enforce --required-workflows minha-org/.github
```

| Ruleset de organização | Alvo | Regra |
|---|---|---|
| 🌳 Branches convencionais | todos os repos e branches | `branch_name_pattern` — mesma regex do CI, sem prefixos de IA |
| 😜 Commits gitmoji sem atribuição de IA | todos | `commit_message_pattern` (gitmoji) + padrão negado (IA) — vale até para o squash editado no botão de merge |
| 🛡️ main · em produção | `in_production=true` | PR + 1 aprovação + code owners + última push aprovada, squash, linear, 4 checks |
| 🌱 main · pré-produção | `in_production=false` | PR, squash, `conventions` |
| 🧪 test e sandbox | todos | PR, squash ou merge, `ci-ok` + `conventions` |
| 🏷️ Tags de versão | `refs/tags/v*` | só GitHub Actions cria; imutáveis |
| 🔖 Formato de tags | todas as tags | `tag_name_pattern` SemVer |
| 🔐 Arquivos sensíveis | push em todos | bloqueia `.env`, chaves (`.pem`, `.key`, `.p12`…), `tfstate`, arquivos > 10 MB |
| 💳 Escopo PCI DSS | `pci_dss=true` | 2 aprovações, commits assinados |
| ⚙️ Workflows obrigatórios | `in_production=true` (opcional) | `ci.yml` e `conventions.yml` centrais |

Propriedades: `in_production`, `pci_dss`, `stack`, `criticality` e `hosting` — as duas últimas espelham o `standards.json` e servem para inventário e filtros na organização.

As regex dos rulesets são geradas por `governance/enterprise/patterns.js` a partir de `gitmojis.json` e `lib/branch.js` — as mesmas fontes do CI. Ao atualizar a lista de gitmojis, rode `apply-org.sh` de novo.

> ⚠️ Rode primeiro sem `--enforce`: o modo *evaluate* mostra quem seria barrado sem travar ninguém, e confirma que o motor de regex do GitHub aceitou os padrões.

## 3. Comparativo rápido

| Recurso | Free privado | Free público | Enterprise |
|---|---|---|---|
| Hooks locais + checks + auditoria pós-merge | ✅ | ✅ | ✅ |
| Checks bloqueando merge | ❌ | ✅ | ✅ |
| Tags `v*` protegidas | ❌ | ✅ | ✅ |
| Nome de branch / mensagem de commit / formato de tag barrados no push | ❌ | ❌ | ✅ |
| Regras por propriedade (`in_production`, `pci_dss`) para a org inteira | ❌ | ❌ | ✅ |
| Modo evaluate | ❌ | ❌ | ✅ |
| Push rulesets (arquivos sensíveis) | ❌ | ❌ | ✅ |
| Environment `production` com aprovação | ❌ | ✅ | ✅ |

Planos mudam com frequência — confira a [documentação do GitHub](https://docs.github.com/pt/get-started/learning-about-github/githubs-plans) antes de decidir. GitHub Team/Pro libera os rulesets de repositório para repos privados (equivale à coluna "Free público" na parte de bloqueio).

## 4. Variáveis e segredos

| Nome | Tipo | Padrão | Para quê |
|---|---|---|---|
| `IN_PRODUCTION` | variável | `false` | `true` torna o `ci-ok` bloqueante |
| `COVERAGE_MIN` | variável | `75` | cobertura mínima fora de `main` |
| `COVERAGE_MIN_PROD` | variável | `85` | cobertura mínima em `main` |
| `MOVING_TAGS` | variável | — | `true` mantém `vX` e `vX.Y` |
| `AWS_ROLE_ARN` · `AWS_REGION` | variável | — | OIDC para plano e deploy na AWS |
| `AZURE_CLIENT_ID` · `AZURE_TENANT_ID` · `AZURE_SUBSCRIPTION_ID` | variável | — | OIDC para plano e deploy no Azure |
| `TF_ROOT` | variável | — | diretório do `terraform plan` nos PRs |
| `RELEASE_APP_ID` / `RELEASE_APP_KEY` | variável / segredo | — | GitHub App para o PR de back-merge disparar os checks |
| `PROD_REVIEWER_TEAM` | env do script | — | time que aprova deploys em `production` |

## 5. Agentes de IA

`AGENTS.md` + `CLAUDE.md` + `.claude/settings.json` vão junto com o repositório. Ao abrir o projeto no Claude Code e confiar na pasta, ele oferece instalar os marketplaces e as skills padrão (caveman, ponytail, superpowers) e já trabalha sem atribuição em commits e PRs. Outros agentes (Codex, Cursor, Copilot…) leem o `AGENTS.md`; as skills têm instalação própria descrita em cada repositório.

## 6. Mapa de arquivos

```
.github/
  ISSUE_TEMPLATE/          7 issue forms + config (links de dúvida, segurança, apoio)
  PULL_REQUEST_TEMPLATE/   feature · bugfix · hotfix · release · chore · other
  pull_request_template.md seletor manual
  workflows/               ci · conventions(+standards) · release-check · release · deploy · pr-template · infra · vps-security-review
  standards.json           idiomas · termos de domínio · criticidade · hosting · IaC · banco/ORM
  scripts/                 validadores (Node ≥ 20, sem dependências) + testes
  gitmoji/gitmojis.json    lista oficial fixada
  dependabot.yml · CODEOWNERS · labels.yml · ci-projects.example.json
governance/
  common/repo.sh           configurações válidas em qualquer plano
  free/                    apply.sh + rulesets de repositório
  enterprise/              apply-org.sh · set-repo.sh · properties.json · patterns.js · rulesets de org
scripts/                   sync-labels.sh · deploy.sh
.claude/settings.json      skills padrão + atribuição de IA desligada
AGENTS.md · CLAUDE.md      regras para agentes (inglês)
lefthook.yml · cliff.toml · .editorconfig · VERSION · CHANGELOG.md · README.md · CONTRIBUTING.md
docs/                      SETUP · INFRA · TEMPLATES
```
