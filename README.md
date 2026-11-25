<div align="center">

```
 ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗
██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝
██║     ██║     ███████║██║   ██║██║  ██║█████╗
██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝
╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
███████╗███████╗████████╗██╗   ██╗██████╗
██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
███████╗█████╗     ██║   ██║   ██║██████╔╝
╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝
███████║███████╗   ██║   ╚██████╔╝██║
╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝
```

**Um comando. Cada projeto, configurado do jeito certo. Zero poluição global.**

[![Node 22+](https://img.shields.io/badge/node-22%2B-43a047?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Testes](https://img.shields.io/badge/testes-83%20passando-2e7d32?style=flat-square&logo=checkmarx&logoColor=white)](./test)
[![Cobertura](https://img.shields.io/badge/cobertura-99%25%20linhas-00897b?style=flat-square)](./test)
[![Python](https://img.shields.io/badge/python-3.11%2B%20(opcional)-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-546e7a?style=flat-square)](./LICENSE)

</div>

---

## Por que isso existe

Alternando entre frontends TypeScript, APIs Python, apps Flutter, código Swift, infraestrutura AWS e backends Supabase — configurar o Claude Code corretamente a cada projeto é tedioso e suscetível a erros. Caçar repos de skills, lembrar nomes de plugins, escrever o mesmo boilerplate no CLAUDE.md — tudo manual, tudo repetitivo.

`claude-setup-helper` é uma CLI interativa pessoal que instala as skills, plugins, servidores MCP, guardrails, hooks e base rules certas para o seu stack atual. **Tudo vai para a pasta `.claude/` do projeto.** Nada toca o seu `~/.claude/` global.

E quando o repositório também precisa de padrão de engenharia — lefthook, CI com checks obrigatórios, SemVer, CHANGELOG, gitmoji, rulesets — o CLI prepara o **quality-harness** da DeltaPag e deixa o Claude terminar o trabalho.

---

## Novidades

### 🧰 Quality harness integrado

Nova etapa opcional que prepara o [quality-harness](assets/quality-harness/SKILL.md) no repositório:

- **Detecção de módulos** — 13 módulos opcionais (Next.js, NestJS, FastAPI, Flutter, PHP, AWS, Azure, Terraform, GitHub, contratos de API, banco/migrations, observabilidade, QA/E2E) são detectados no repo e pré-marcados, somados ao que você escolheu nas etapas anteriores.
- **Python quando houver, TypeScript quando não** — com Python ≥ 3.11, usa os próprios scripts do harness (`detect_stacks.py --json`, `apply_modules.py`). Sem Python, cai num detector em TypeScript e grava só `.github/standards.json`. O setup nunca falha por isso.
- **Divisão clara de trabalho** — o CLI instala o skill e os módulos; o core, o questionário de padrões, o RETROFIT em etapas e a governança ficam com o skill. No fim, o CLI diz o próximo passo: `/quality-harness` no Claude.

Detalhes em [Quality harness](#quality-harness).

### 🐛 Correções no harness

- Os validadores de `.github/scripts/` agora são `.cjs`. Antes, quebravam em qualquer repo cujo `package.json` tem `"type": "module"` (comum em Next.js) — e com eles os checks `ci-ok`, `conventions` e `standards`.
- A detecção ignora `.claude/`, para o skill instalado não disparar módulos falsos.

### 📜 Base rule de commits mais rígida

`git-commits.md` agora proíbe atribuição de IA em commits e PRs (trailers `Co-Authored-By` de ferramentas de IA, linhas "Generated with ...") e prefixos de branch de IA (`claude/`, `copilot/`, `cursor/`, `codex/`) — alinhado com o hook `commit-msg` do harness.

### 🔍 Detecção automática do stack

Antes do primeiro menu, o CLI lê os manifests do projeto (`package.json`, `pyproject.toml`, `pubspec.yaml`, `Package.swift`, `cdk.json`, `supabase/`…) e já pré-seleciona linguagens, frameworks, DevOps e plataformas Flutter. Você só confirma.

---

## Funcionalidades

|  |  |
|---|---|
| 🎛️ &nbsp;**TUI bonito** | Menus via `@clack/prompts`, agrupados por stack, spinner animado por instalação |
| 🔍 &nbsp;**Detecção do stack** | Lê os manifests do projeto e pré-seleciona as opções — você só confirma |
| 📦 &nbsp;**Escopo por projeto** | Skills, plugins, MCPs — tudo em `.claude/`. Zero contaminação entre projetos |
| 🧠 &nbsp;**Skills via GitHub** | Busca tarballs diretamente dos repos de origem, extrai para `.claude/skills/` |
| 🔌 &nbsp;**Plugins com escopo** | `claude plugin install --scope project` — não é instalação global |
| 🔗 &nbsp;**MCPs com escopo** | `claude mcp add --scope project` → grava em `.mcp.json` |
| 🧪 &nbsp;**QA skills opcionais** | Por linguagem: pergunta se você quer padrões de testes incluídos |
| 🛡️ &nbsp;**Guardrails automáticos** | Seleção do stack → arquivos de regras instalados automaticamente |
| 🧰 &nbsp;**Quality harness opcional** | Detecta os módulos do repo e pré-seleciona os que se aplicam; o skill faz o resto |
| 📋 &nbsp;**CLAUDE.md idempotente** | Cria ou faz append de imports `@path` — nunca duplica |
| 🎭 &nbsp;**Hooks de qualidade** | Gates de PreToolUse, linters de PostToolUse, sons de meme opcionais |
| 🤖 &nbsp;**Skills e workflows locais** | `audit-rules`, `emojicommit`, `parallel-plan` e workflows multiagente (security-scan, perf-validate, uiux-audit…) |
| 💪 &nbsp;**Resiliente a erros** | Uma falha não aborta o resto; resumo completo no final |

---

## Início Rápido

```bash
# Clone em algum lugar permanente
git clone https://github.com/gabriel-moretti/claude-setup-helper-cli.git ~/claude-setup-helper
cd ~/claude-setup-helper

# Instale as dependências e faça o build
npm install && npm run build

# Adicione um alias — coloque isso no ~/.zshrc ou ~/.bashrc
alias claude-setup="node ~/claude-setup-helper/dist/index.js"
```

Depois, dentro de qualquer projeto:

```bash
cd ~/projetos/meu-app-nextjs
claude-setup
```

---

## Fluxo Interativo

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │   ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗              │
  │  ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝              │
  │  ██║     ██║     ███████║██║   ██║██║  ██║█████╗                │
  │  ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝                │
  │  ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗              │
  │   ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝              │
  │                                                                  │
  │  ███████╗███████╗████████╗██╗   ██╗██████╗                       │
  │  ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗                      │
  │  ███████╗█████╗     ██║   ██║   ██║██████╔╝  By: Gabriel Moretti │
  │  ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝                       │
  │  ███████║███████╗   ██║   ╚██████╔╝██║                           │
  │  ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝                           │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘

  ◇  Stack detectada
  │  typescript, nextjs, supabase

  ◆  Linguagens
  │  ◼ TypeScript   ◼ Python   ◻ Flutter   ◻ Swift

  ◆  Adicionar testes para TypeScript?
  │  ● Sim  ○ Não

  ◆  Adicionar testes para Python?
  │  ● Sim  ○ Não

  ◆  Flutter — plataformas alvo:          (só se Flutter for selecionado)
  │  ◼ iOS   ◼ Android   ◻ Web   ◻ Desktop (macOS / Windows / Linux)

  ◆  Flutter — gerência de estado:
  │  ● Riverpod   ○ Bloc   ○ Bloc + plugin VGV   ○ Provider   ○ Nenhum / outro

  ◆  Frameworks
  │  ◼ Next.js   ◻ FastAPI

  ◆  Adicionar skills de UI/UX?
  │  ● Sim  ○ Não

  ◆  DevOps
  │  ◼ AWS   ◼ Supabase

  ◆  Instalar quality-harness (padrão de repo: lefthook, CI, SemVer, gitmoji)?
  │  ● Sim  ○ Não

  ◆  Harness — módulos (pré-marcados pela detecção):
  │  ◼ github   ◼ nextjs   ◼ aws   ◼ database   ◼ qa-e2e   ◻ observability   ◻ api-contracts …

  ◆  Extras
  │  ◼ Firecrawl   ◻ Chrome DevTools   ◻ Jupyter   ◻ awesome-design

  ◆  Instalar hooks de qualidade duvidosa?
  │  ○ Sim (com sons)   ● Sim (sem sons)   ○ Não

  ◆  Adicionar Base Rules?
  │  ● Sim  ○ Não

  ◆  Adicionar skills locais (audit-rules, emojicommit, parallel-plan)?
  │  ● Sim  ○ Não

  ◆  Adicionar workflows (security-scan, perf-validate, uiux-audit, ...)?
  │  ● Sim  ○ Não

  ◆  Adicionar Guardrails?
  │  ● Sim  ○ Não

  ◆  Instalar em: ~/projetos/meu-app-nextjs?
  │  ● Confirmar  ○ Cancelar

  ✔  typescript-best-practices instalado
  ✔  python-best-practices instalado
  ✔  python-testing-patterns instalado
  ✔  nextjs-app-router-patterns instalado
  ✔  impeccable instalado
  ✔  code-simplifier instalado
  ✔  frontend-design instalado
  ✔  aws-core instalado
  ✔  supabase instalado
  ✔  firecrawl instalado
  ✔  Hooks instalados
  ✔  Base rules instaladas
  ✔  Skills locais instaladas (audit-rules, emojicommit, parallel-plan)
  ✔  Workflows instalados (5)
  ✔  Guardrails instalados (frontend, backend, nextjs-fullstack, aws-cost, aws-security, supabase)
  ✔  quality-harness → .claude/skills/quality-harness/
  ✔  Módulos → .github/standards.json, assets e .mcp.json
  ✔  CLAUDE.md atualizado

  ●  Próximo passo: rode /quality-harness no Claude para instalar o core.
  ◇  Pronto — .claude/ está configurado. Abra o Claude Code e trabalhe.
```

### Etapa quality-harness (4b)

Depois de **DevOps** (etapa 4) e antes de **Extras** (etapa 5), o CLI pergunta se o repositório deve receber o quality-harness da DeltaPag:

1. **Confirmação** — `Instalar quality-harness (padrão de repo: lefthook, CI, SemVer, gitmoji)?`. Se você recusar, nenhum arquivo relacionado é alterado.
2. **Aviso fora de repo git** — se o diretório atual não for um repositório git, o CLI pergunta antes se deve continuar mesmo assim.
3. **Aviso sem Python ≥ 3.11** — sem Python compatível, o CLI usa uma detecção simplificada em TypeScript: varre os arquivos do repo (até 3 níveis de pasta, ignorando `node_modules/`, `.claude/`, `.git/` e afins) com os sinais de detecção de `modules.json` (`files`, `dirs`, `packageDeps`, `pyprojectDeps`, `pubspecDeps`, `standards`). Os sinais `globs` e `tfProviders` e a resolução de `depends` ficam de fora; o skill aplica os módulos depois. O setup continua normalmente.
4. **Multi-select de módulos** — lista todas as chaves de `modules.json`, exceto `_baseLayers`. Os módulos detectados e os que combinam com as seleções anteriores já vêm marcados; você pode desmarcar ou marcar outros.

---

## O Que É Instalado

### Por stack

| Stack | Skills | Plugins | MCPs |
|---|---|---|---|
| **TypeScript** | typescript-best-practices | code-simplifier | — |
| **TypeScript QA** | *(vitest patterns — em breve)* | — | — |
| **Python** | python-best-practices | — | — |
| **Python QA** | python-testing-patterns | — | — |
| **Flutter** | flutter-best-practices, dart-flutter-patterns | dart-flutter (oficial — skills Flutter/Dart + Dart MCP) | — |
| **Flutter QA** | flutter-tester, patrol-e2e-testing | — | — |
| **Flutter → iOS** | owasp-mobile-security-checker | — | XcodeBuildMCP, mobile-mcp |
| **Flutter → Android** | owasp-mobile-security-checker | — | mobile-mcp |
| **Flutter → Web** | — | playwright | — |
| **Flutter → Desktop** | — | — | — |
| **Flutter → estado** | riverpod, bloc ou provider (escolha única) | vgv-ai-flutter-plugin (opção "Bloc + plugin VGV") | — |
| **Swift** | ios-swift-skills | swift-lsp | XcodeBuildMCP |
| **Next.js** | nextjs-app-router-patterns, claude-code-nextjs-skills, shadcn | playwright | — |
| **FastAPI** | fastapi-clean-architecture | — | — |
| **UI/UX** | impeccable | frontend-design | — |
| **AWS** | — | aws-core, aws-serverless, deploy-on-aws | — |
| **Supabase** | — | supabase | — |
| **Extras** | error-handling-patterns, audit, optimize, webgpu, awesome-design | chrome-devtools-mcp, firecrawl, superpowers, ui-ux-pro-max | Jupyter |

### Guardrails — mapeamento automático, sem seletor na UI

A UI só pergunta "instalar guardrails: sim/não". O mapeamento acontece por baixo:

| Arquivo de regra | Instalado quando você seleciona… |
|---|---|
| `frontend.md` | TypeScript, Next.js, Flutter ou Swift |
| `flutter.md` | Flutter |
| `flutter-mobile.md` | Flutter → iOS ou Android |
| `flutter-web.md` | Flutter → Web |
| `flutter-desktop.md` | Flutter → Desktop |
| `backend.md` | Python ou FastAPI |
| `nextjs-fullstack.md` | Next.js |
| `rest-api.md` | FastAPI |
| `aws-cost.md` | AWS |
| `aws-security.md` | AWS |
| `github-actions.md` | AWS ou Supabase |
| `supabase.md` | Supabase |

### Hooks — gates de qualidade com personalidade

| Hook | Gatilho | O que faz | Som |
|---|---|---|---|
| `irreversibility-gate` | PreToolUse (ops Supabase) | Intercepta SQL destrutivo — drop, delete, reset, migrate, pause — e pede confirmação via TTY antes de prosseguir | 🚔 sound-of-da-police |
| `secret-leak-gate` | PreToolUse (Write / Edit) | Bloqueia writes em `.env` (exceto `.env.example`), varre por chaves AWS, `service_role`, cabeçalhos de chave privada, commits via gitleaks | 🤼 john-cena |
| `quality-gate` | PostToolUse (Write / Edit) | Roda linters por extensão: `tsc` + ESLint + Prettier para TS/JS, `ruff` + `mypy` para Python, `dart analyze`, `swiftlint` | 😔 spongebob-fail |
| `service-ended` | Stop | Toca quando a sessão do Claude termina | 🐍 metalgearsolid |
| `service-input-needed` | Notification | Toca quando o Claude precisa da sua atenção | 💥 crack_the_whip |

> Sons precisam de arquivos MP3 em `~/.claude/sounds/`. O instalador cria o diretório — só jogar os arquivos lá dentro.

### Quality harness

Opcional. Quando você aceita a etapa, o CLI instala o skill `quality-harness` e grava os módulos escolhidos. A parte que exige julgamento (core, questionário de padrões, RETROFIT em etapas e governança) fica com o skill, executado pelo Claude.

Mapeamento de seleção → módulo pré-marcado:

| Seleção no CLI | Módulo pré-marcado |
|---|---|
| Framework `nextjs` | `nextjs` |
| Framework `fastapi` | `fastapi` |
| Linguagem `flutter` | `flutter` |
| DevOps `aws` | `aws` |
| DevOps `supabase` | `database` |

Também vêm marcados os módulos que o detector do harness sugere (`suggested` e `recommended`) e o `github` (`default`).

**O que o CLI faz:**

- Copia o skill para `.claude/skills/quality-harness/`, sobrescrevendo. É tooling, não conteúdo seu.
- Se houver módulos selecionados, com Python ≥ 3.11 chama `apply_modules.py --modules ...`. O script resolve `depends`, grava `.github/standards.json → modules`, copia os assets dos módulos sem sobrescrever e faz merge de `.mcp.json`. Sem Python, grava só `.github/standards.json → {"modules": [...]}`, por união e sem remover nada.
- Adiciona ao `CLAUDE.md` uma seção `## Quality harness` (com o marcador `<!-- quality-harness -->`) orientando o Claude a usar o skill `quality-harness`. Se o `CLAUDE.md` não existir, ele é criado. A seção não é duplicada em execuções repetidas.

**O que fica para o skill:** o core do harness (placeholders, VERSION por trilha, RETROFIT em etapas), o questionário de padrões e a governança (rulesets).

**Próximo passo:** o CLI mostra `Próximo passo: rode /quality-harness no Claude para instalar o core.` Sem Python, a confirmação da etapa de módulos também avisa que as dependências de módulos e os assets serão aplicados pelo skill.

---

## Arquitetura

```
claude-setup-helper/
├── src/
│   ├── index.ts           ← fluxo principal, menus @clack/prompts, resolveGuardrails()
│   ├── catalog.ts         ← todas as skills / plugins / MCPs definidos aqui
│   ├── detect.ts          ← detecção do stack pelos manifests (pré-seleção dos menus)
│   ├── installer.ts       ← installSkill / installPlugin / installMcp
│   │                         installGuardrails / installBaserules / installHooks
│   │                         updateClaudeMd (append idempotente de @path)
│   ├── skill-fetcher.ts   ← tarball GitHub → extrair → .claude/skills/<nome>/
│   ├── harness.ts         ← quality-harness: findPython, detectModules, applyModules, installHarnessSkill
│   ├── harness-modules.ts ← fallback em TS para detecção de módulos (varre o repo com os sinais de modules.json)
│   ├── header.ts          ← ASCII art CLAUDE (ciano) + SETUP (roxo)
│   └── types.ts           ← CatalogItem, Category, SkillSource, …
├── assets/
│   ├── baserules/         ← git-commits.md  ignore-files.md  language.md  security.md
│   ├── guardrails/        ← arquivos .md copiados para .claude/guardrails/
│   ├── hooks/             ← cinco scripts .sh + template hooks-settings.json
│   ├── plugins/           ← plugins locais (jira-cards)
│   ├── quality-harness/   ← skill copiado para .claude/skills/quality-harness/
│   ├── skills/            ← audit-rules, emojicommit, parallel-plan
│   ├── sounds/            ← MP3s dos hooks
│   └── workflows/         ← workflows multiagente copiados para .claude/workflows/
└── test/
    ├── catalog.test.ts         ← 14 testes — integridade e forma do catálogo
    ├── detect.test.ts          ←  8 testes — detecção do stack pelos manifests
    ├── installer.test.ts       ← 18 testes — funções de instalação + updateClaudeMd
    ├── harness.test.ts         ← 28 testes — seleções → módulos, standards.json, findPython, apply (inclui teste com Python real)
    ├── harness-modules.test.ts ← 14 testes — detecção TS com fixtures temporárias
    └── header.test.ts          ←  1 teste  — smoke test para saída do ASCII art
```

**Fluxo de instalação:**

```
Usuário seleciona o stack
        │
        ├─ skill  ──→  fetchSkill()   ──→  tarball GitHub ──→  .claude/skills/<nome>/
        │
        ├─ plugin ──→  claude plugin install <nome> --scope project
        │
        ├─ mcp    ──→  claude mcp add --scope project <nome> <cmd> [...args]
        │
        ├─ guardrails  ──→  copyLocalRules()  ──→  .claude/guardrails/
        ├─ baserules   ──→  copyLocalRules()  ──→  .claude/baserules/
        ├─ hooks       ──→  copia .sh + merge settings.json  ──→  .claude/hooks/
        ├─ quality-harness ──→  installHarnessSkill() + applyModules() ──→  .claude/skills/quality-harness/ + .github/standards.json
        └─ CLAUDE.md   ──→  updateClaudeMd()  ──→  append @path imports (idempotente)
```

---

## Como Cada Método Funciona

### Skills — zero instalação global

`npx skills add <nome>` instala globalmente. Essa ferramenta faz diferente:

```
https://github.com/<org>/<repo>/archive/refs/heads/main.tar.gz
  ↓  download (segue redirects do GitHub)
  ↓  tar xzf → diretório temporário
  ↓  (monorepo) copia apenas o subdiretório relevante
  →  .claude/skills/<nome-da-skill>/
```

Para monorepos (ex.: `wshobson/agents` hospeda várias skills), só o subdiretório relevante é extraído. Para repos de skill única, o conteúdo todo é copiado.

### Plugins — escopo de projeto

```bash
claude plugin install <nome>@<marketplace> --scope project
```

Grava apenas em `.claude/`. Nada vai para `~/.claude/`.

### MCPs — escopo de projeto

```bash
claude mcp add --scope project <nome> <comando> [...args]
```

Grava em `.mcp.json` na raiz do projeto — lido automaticamente pelo Claude Code.

### CLAUDE.md — imports idempotentes

```
Sem CLAUDE.md  →  cria com seção ## Rules + entradas @path
CLAUDE.md existe  →  faz append apenas das novas entradas @path (sem duplicar)
```

---

## Catálogo Completo

| | |
|---|---|
| [Skills →](docs/skills.md) | 18 skills em todos os stacks — fontes, repos, flags de QA |
| [Plugins →](docs/plugins.md) | 12 plugins — info de marketplace, notas de bundle |
| [MCPs →](docs/mcps.md) | Instalação direta + bundled por plugin — tabela comparativa |

---

## Adicionando ao Catálogo

Uma linha em `src/catalog.ts`, rebuild, pronto.

```typescript
// Skill — buscada do GitHub
{ label: 'minha-skill', method: 'skill',
  skill: { org: 'acme', repo: 'claude-skills', subdir: 'skills/minha-skill' } }

// Plugin — marketplace oficial
{ label: 'meu-plugin', method: 'plugin',
  plugin: { name: 'meu-plugin', marketplace: 'claude-plugins-official' } }

// MCP — subprocesso (npx / uvx / qualquer binário)
{ label: 'meu-mcp', method: 'mcp',
  mcp: { name: 'meu-mcp', command: 'npx', args: ['-y', 'meu-mcp-server'] } }
```

Adicione no array `items` da `Category` correspondente em `src/catalog.ts`, então:

```bash
npm run build
```

---

## Testes

```bash
npm test
```

83 testes, zero dependências extras. Usa `node:test` + `node:assert` nativos do Node.  
Cobertura obrigatória de **≥ 85%** em linhas, branches e funções.

| Arquivo | Linhas | Branches | Funções |
|---|---|---|---|
| `catalog.ts` | 100% | 100% | 100% |
| `detect.ts` | 100% | 83% | 100% |
| `harness.ts` | 100% | 98% | 100% |
| `harness-modules.ts` | 100% | 94% | 97% |
| `header.ts` | 100% | 100% | 100% |
| `installer.ts` | 97% | 95% | 95% |
| **Total** | **99%** | **95%** | **98%** |

> `skill-fetcher.ts` é excluído dos thresholds — faz chamadas de rede reais e pertence a testes de integração.  
> O teste de integração com Python real (`detect_stacks.py --json`) é pulado automaticamente quando não há Python ≥ 3.11.

O skill do harness tem a própria suíte:

```bash
python3 -m unittest discover assets/quality-harness/scripts/tests   # detecção, apply e módulos
cd assets/quality-harness/assets/core && node --test .github/scripts/test/*.test.cjs   # validadores
```

---

## Requisitos

- **Node.js 22+**
- **`claude` CLI** — `npm install -g @anthropic-ai/claude-code`
- **Acesso à internet** — skills são buscadas ao vivo do GitHub no momento da instalação
- **`tar`** — padrão em macOS e Linux
- **Python ≥ 3.11** — *opcional*. Sem ele, a detecção do quality-harness é simplificada e o skill aplica os módulos depois

---

<div align="center">

─────────────────────────────────────────

Feito com obsessão por **Gabriel Moretti**

</div>
