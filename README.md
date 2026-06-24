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
[![Testes](https://img.shields.io/badge/testes-21%20passando-2e7d32?style=flat-square&logo=checkmarx&logoColor=white)](./test)
[![Cobertura](https://img.shields.io/badge/cobertura-99%25%20linhas-00897b?style=flat-square)](./test)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-546e7a?style=flat-square)](./LICENSE)

</div>

---

## Por que isso existe

Alternando entre frontends TypeScript, APIs Python, apps Flutter, código Swift, infraestrutura AWS e backends Supabase — configurar o Claude Code corretamente a cada projeto é tedioso e suscetível a erros. Caçar repos de skills, lembrar nomes de plugins, escrever o mesmo boilerplate no CLAUDE.md — tudo manual, tudo repetitivo.

`claude-setup-helper` é uma CLI interativa pessoal que instala as skills, plugins, servidores MCP, guardrails, hooks e base rules certas para o seu stack atual. **Tudo vai para a pasta `.claude/` do projeto.** Nada toca o seu `~/.claude/` global.

---

## Funcionalidades

|  |  |
|---|---|
| 🎛️ &nbsp;**TUI bonito** | Menus via `@clack/prompts`, agrupados por stack, spinner animado por instalação |
| 📦 &nbsp;**Escopo por projeto** | Skills, plugins, MCPs — tudo em `.claude/`. Zero contaminação entre projetos |
| 🧠 &nbsp;**Skills via GitHub** | Busca tarballs diretamente dos repos de origem, extrai para `.claude/skills/` |
| 🔌 &nbsp;**Plugins com escopo** | `claude plugin install --scope project` — não é instalação global |
| 🔗 &nbsp;**MCPs com escopo** | `claude mcp add --scope project` → grava em `.mcp.json` |
| 🧪 &nbsp;**QA skills opcionais** | Por linguagem: pergunta se você quer padrões de testes incluídos |
| 🛡️ &nbsp;**Guardrails automáticos** | Seleção do stack → arquivos de regras instalados automaticamente |
| 📋 &nbsp;**CLAUDE.md idempotente** | Cria ou faz append de imports `@path` — nunca duplica |
| 🎭 &nbsp;**Hooks de qualidade** | Gates de PreToolUse, linters de PostToolUse, sons de meme opcionais |
| 💪 &nbsp;**Resiliente a erros** | Uma falha não aborta o resto; resumo completo no final |

---

## Início Rápido

```bash
# Clone em algum lugar permanente
git clone https://github.com/gabrielmoretti/claude-setup-helper.git ~/claude-setup-helper
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

  ◆  Linguagens
  │  ◼ TypeScript   ◼ Python   ◻ Flutter   ◻ Swift

  ◆  Adicionar testes para TypeScript?
  │  ● Sim  ○ Não

  ◆  Adicionar testes para Python?
  │  ● Sim  ○ Não

  ◆  Frameworks
  │  ◼ Next.js   ◻ FastAPI

  ◆  Adicionar skills de UI/UX?
  │  ● Sim  ○ Não

  ◆  DevOps
  │  ◼ AWS   ◼ Supabase

  ◆  Extras
  │  ◼ Firecrawl   ◻ Chrome DevTools   ◻ Jupyter   ◻ awesome-design

  ◆  Instalar hooks de qualidade duvidosa?
  │  ○ Sim (com sons)   ● Sim (sem sons)   ○ Não

  ◆  Instalar baserules?
  │  ● Sim  ○ Não

  ◆  Instalar guardrails?
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
  ✔  Guardrails instalados (frontend, backend, nextjs-fullstack, aws-cost, aws-security, supabase)
  ✔  Baserules instaladas
  ✔  Hooks instalados
  ✔  CLAUDE.md atualizado

  ◇  Pronto — .claude/ está configurado. Abra o Claude Code e trabalhe.
```

---

## O Que É Instalado

### Por stack

| Stack | Skills | Plugins | MCPs |
|---|---|---|---|
| **TypeScript** | typescript-best-practices | code-simplifier | — |
| **TypeScript QA** | *(vitest patterns — em breve)* | — | — |
| **Python** | python-best-practices | — | — |
| **Python QA** | python-testing-patterns | — | — |
| **Flutter** | flutter-best-practices, dart-flutter-patterns, flutter-claude-skills | — | flutter-mcp |
| **Flutter QA** | flutter-tester | — | — |
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
| `frontend.md` | TypeScript, Next.js ou UI/UX |
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

---

## Arquitetura

```
claude-setup-helper/
├── src/
│   ├── index.ts           ← fluxo principal, menus @clack/prompts, resolveGuardrails()
│   ├── catalog.ts         ← todas as skills / plugins / MCPs definidos aqui
│   ├── installer.ts       ← installSkill / installPlugin / installMcp
│   │                         installGuardrails / installBaserules / installHooks
│   │                         updateClaudeMd (append idempotente de @path)
│   ├── skill-fetcher.ts   ← tarball GitHub → extrair → .claude/skills/<nome>/
│   ├── header.ts          ← ASCII art CLAUDE (ciano) + SETUP (roxo)
│   └── types.ts           ← CatalogItem, Category, SkillSource, …
├── assets/
│   ├── guardrails/        ← arquivos .md copiados para .claude/guardrails/
│   ├── baserules/         ← ignore-files.md  language.md  security.md
│   └── hooks/             ← cinco scripts .sh + template hooks-settings.json
└── test/
    ├── catalog.test.ts    ←  7 testes  — integridade e forma do catálogo
    ├── installer.test.ts  ← 13 testes  — funções de instalação + updateClaudeMd
    └── header.test.ts     ←  1 teste   — smoke test para saída do ASCII art
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

21 testes, zero dependências extras. Usa `node:test` + `node:assert` nativos do Node.  
Cobertura obrigatória de **≥ 85%** em linhas, branches e funções.

| Arquivo | Linhas | Branches | Funções |
|---|---|---|---|
| `catalog.ts` | 100% | 100% | 100% |
| `header.ts` | 100% | 100% | 100% |
| `installer.ts` | 96% | 93% | 92% |
| **Total** | **99%** | **93%** | **98%** |

> `skill-fetcher.ts` é excluído dos thresholds — faz chamadas de rede reais e pertence a testes de integração.

---

## Requisitos

- **Node.js 22+**
- **`claude` CLI** — `npm install -g @anthropic-ai/claude-code`
- **Acesso à internet** — skills são buscadas ao vivo do GitHub no momento da instalação
- **`tar`** — padrão em macOS e Linux

---

<div align="center">

─────────────────────────────────────────

Feito com obsessão por **Gabriel Moretti**

</div>
