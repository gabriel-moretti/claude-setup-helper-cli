# 🛠️ claude-setup-helper

> One command to set up Claude Code exactly right — for any project, any stack.

![Node 18+](https://img.shields.io/badge/node-18%2B-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## What is this?

As a fullstack dev jumping between Python APIs, TypeScript frontends, Flutter apps, Swift code, AWS infra, and Supabase backends, setting up Claude Code correctly for each project is tedious and error-prone. `claude-setup-helper` is an interactive CLI that installs exactly the right skills, plugins, and MCP servers for your current project stack — **with zero global pollution**. Everything lands in the project's `.claude/` folder.

---

## ✨ Features

- 🎛️ **Interactive menu** — beautiful prompts via `@clack/prompts`, grouped by stack
- 📦 **Per-project install** — nothing touches your global `~/.claude/` config
- 🧠 **Skills via GitHub** — fetches skill files directly from source repos into `.claude/skills/`
- 🔌 **Plugins scoped to project** — `claude plugin install --scope project`
- 🔗 **MCPs scoped to project** — `claude mcp add --scope project` → writes to `.mcp.json`
- 🧪 **Optional QA skills** — per language, ask if you want testing patterns included
- 💪 **Error-resilient** — one failure doesn't abort the rest; summary shows what failed and why

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/your-username/claude-setup-helper.git ~/claude-setup-helper
cd ~/claude-setup-helper

# Install dependencies and build
npm install && npm run build

# Add a shell alias (add to ~/.zshrc or ~/.bashrc)
alias claude-setup="node ~/claude-setup-helper/dist/index.js"

# Or use the included wrapper script
chmod +x ~/claude-setup-helper/run.sh
alias claude-setup="~/claude-setup-helper/run.sh"
```

**Use it inside any project:**

```bash
cd ~/projects/my-nextjs-app
claude-setup
```

---

## 📋 Menu Overview

```
┌  claude-setup-helper
│
◆  Linguagens (choose at least 1):
│  ◼ TypeScript   ◻ Python   ◻ Flutter   ◻ Swift
│
◆  Adicionar testes para TypeScript?
│  ● Sim  ○ Não
│
◆  Frameworks (optional):
│  ◼ Next.js   ◻ FastAPI
│
◆  Adicionar skills de UI/UX?
│  ● Sim  ○ Não
│
◆  DevOps (optional):
│  ◼ AWS   ◼ Supabase
│
◆  Extras (optional):
│  ◻ Chrome DevTools MCP   ◻ Firecrawl   ◻ Jupyter MCP
│  ◻ error-handling-patterns   ◻ superpowers   ◻ webgpu   ◻ ui-ux-pro-max   ◻ awesome-design
│
◆  Instalar em: /path/to/project?
│  ● Sim  ○ Cancelar
```

### What gets installed per category

| Category | Skills | Plugins | MCPs |
|---|---|---|---|
| **TypeScript** | typescript-best-practices | code-simplifier | — |
| **Python** | python-best-practices | — | — |
| **Flutter** | flutter-best-practices, dart-flutter-patterns, flutter-claude-skills | — | flutter-mcp |
| **Swift** | ios-swift-skills | swift-lsp | XcodeBuildMCP |
| **Next.js** | nextjs-app-router-patterns, claude-code-nextjs-skills, shadcn | playwright | — |
| **FastAPI** | fastapi-clean-architecture | — | — |
| **UI/UX** | impeccable | frontend-design | — |
| **AWS** | — | aws-core, aws-serverless, deploy-on-aws | — |
| **Supabase** | — | supabase (bundle) | — |
| **Extras** | error-handling-patterns, audit, optimize, webgpu, awesome-design | chrome-devtools-mcp, firecrawl, superpowers, ui-ux-pro-max | Jupyter MCP |

---

## ⚙️ How It Works

### 🧠 Skills — GitHub fetch
Skills are fetched directly from their source GitHub repositories and extracted into `.claude/skills/<name>/` in your project. No `npx skills add` — that installs globally. This tool fetches the tarball, extracts the relevant subfolder, and writes locally.

```
GitHub archive (tar.gz) → extract → .claude/skills/<skill-name>/
```

### 🔌 Plugins — scoped install
```bash
claude plugin install <name>@<marketplace> --scope project
```
Installs into the project's `.claude/` directory. Nothing goes to `~/.claude/`.

### 🔗 MCPs — project scope
```bash
claude mcp add --scope project <name> <command> [...args]
```
Writes to `.mcp.json` in your project root, which Claude Code picks up automatically.

---

## 📚 Full Catalog

- [Skills →](docs/skills.md) — all skills, sources, and descriptions
- [Plugins →](docs/plugins.md) — all plugins with marketplace info
- [MCPs →](docs/mcps.md) — all MCP servers with install commands

---

## ➕ Extending

Adding a new entry is a one-liner in `src/catalog.ts`:

```typescript
// Add a skill (fetched from GitHub)
{ label: 'my-skill', method: 'skill', skill: { org: 'acme', repo: 'claude-skills', subdir: 'skills/my-skill' } }

// Add a plugin (official marketplace)
{ label: 'my-plugin (plugin)', method: 'plugin', plugin: { name: 'my-plugin', marketplace: 'claude-plugins-official' } }

// Add an MCP
{ label: 'my-mcp', method: 'mcp', mcp: { name: 'my-mcp', command: 'npx', args: ['-y', 'my-mcp-server'] } }
```

Drop it into the appropriate `items` array in any `Category`, rebuild (`npm run build`), done.

---

## 📋 Requirements

- **Node.js 18+**
- **`claude` CLI** installed and in PATH (`npm install -g @anthropic-ai/claude-code`)
- **Internet access** — skills are fetched live from GitHub at install time
- **`tar`** available (standard on macOS/Linux)
