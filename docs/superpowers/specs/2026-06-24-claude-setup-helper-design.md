# claude-setup-helper — Design Spec

**Date:** 2026-06-24  
**Status:** Approved

---

## Summary

TypeScript CLI that installs Claude Code skills, plugins, and MCPs per-project (into `.claude/` of the current directory). Interactive menu via `@clack/prompts`. Personal use, runs as local script.

---

## Goals

- Zero global pollution: everything installs per-project
- Fast interactive setup for any project type
- Single source of truth for the catalog (`src/catalog.ts`)

---

## Non-Goals

- Publishing to npm
- Auto-detection of project type
- Creating or modifying CLAUDE.md

---

## Architecture

### File structure

```
claude-setup-helper/
├── src/
│   ├── index.ts          # entry point + @clack/prompts UI flow
│   ├── catalog.ts        # hardcoded catalog of all skills/plugins/MCPs
│   ├── installer.ts      # runs claude plugin install / claude mcp add
│   └── skill-fetcher.ts  # fetches GitHub repos → .claude/skills/<name>/
├── package.json
├── tsconfig.json
└── run.sh                # alias helper: node dist/index.js
```

### Invocation

```bash
# from any project root:
node /path/to/claude-setup-helper/dist/index.js
# or via shell alias:
alias claude-setup="node /path/to/claude-setup-helper/dist/index.js"
```

---

## UI Flow

```
┌  claude-setup-helper
│
◆  Linguagens:
│  ◼ TypeScript  ◻ Python  ◻ Flutter  ◻ Swift
│
◆  Adicionar testes (TypeScript)?   ← per selected language
│  ● Sim  ○ Não
│
◆  Frameworks:
│  ◼ Next.js  ◻ FastAPI
│
◆  UI/UX:
│  ● Sim  ○ Não
│
◆  DevOps:
│  ◼ AWS  ◼ Supabase
│
◆  Extras:
│  ◻ Chrome DevTools MCP  ◻ Firecrawl  ◻ Jupyter MCP
│  ◻ error-handling-patterns  ◻ superpowers  ◻ webgpu  ◻ ui-ux-pro-max
│
◆  Instalar em: /path/to/project — correto?
│  ● Sim  ○ Cancelar
│
⠸  [1/8] Instalando playwright...
✔  [2/8] supabase instalado
✖  [3/8] mcp_flutter falhou: <error>
│
✔  Concluído: 7 instalados, 1 falhou
```

QA prompt appears once per selected language that has a QA skill available (TypeScript, Python, Flutter).

---

## Installation Methods

### Plugins (official marketplace)
```bash
claude plugin install <name>@claude-plugins-official --scope project
```
Writes to project `.claude/` — no global install.

### MCPs
```bash
claude mcp add --scope project <name> <command> [args...]
```
Writes to project `.mcp.json`.

### Skills (GitHub fetch)
1. Fetch archive: `https://github.com/<org>/<repo>/archive/refs/heads/main.tar.gz`
2. Extract skill subfolder (if monorepo) or whole repo
3. Write to `.claude/skills/<skill-name>/`

No `npx skills add` — avoids global install side effect.

---

## Catalog

### TypeScript
| Item | Type | Source |
|---|---|---|
| typescript-best-practices | skill | GitHub: anthropics/claude-code-skills (or wshobson) |
| code-simplifier | plugin | `code-simplifier@claude-plugins-official` |
| vitest-testing *(QA)* | skill | GitHub |

### Python
| Item | Type | Source |
|---|---|---|
| python-best-practices | skill | GitHub |
| python-testing-patterns *(QA)* | skill | GitHub |

### Flutter
| Item | Type | Source |
|---|---|---|
| flutter-best-practices | skill | GitHub |
| dart-flutter-patterns | skill | GitHub |
| flutter-claude-skills | skill | GitHub: Harishwarrior/flutter-claude-skills |
| mcp_flutter | MCP | `claude mcp add --scope project mcp_flutter npx mcp-flutter` |
| flutter-tester *(QA)* | skill | GitHub |

### Swift
| Item | Type | Source |
|---|---|---|
| ios-swift-skills | skill | GitHub |
| swift-lsp | plugin | `swift-lsp@claude-plugins-official` |
| XcodeBuildMCP | MCP | `claude mcp add --scope project xcode npx xcode-build-mcp` |

### Next.js
| Item | Type | Source |
|---|---|---|
| nextjs-app-router-patterns | skill | GitHub |
| claude-code-nextjs-skills | skill | GitHub: laguagu/claude-code-nextjs-skills |
| shadcn | skill | GitHub |
| playwright | plugin | `playwright@claude-plugins-official` |

### UI/UX
| Item | Type | Source |
|---|---|---|
| impeccable | plugin | `pbakaus/impeccable@...` (custom marketplace) |
| awesome-design | skill | GitHub |
| frontend-design | plugin | `frontend-design@claude-plugins-official` |

### FastAPI
| Item | Type | Source |
|---|---|---|
| fastapi | skill | GitHub |
| claude-tools | skill | GitHub: rafaelkamimura/claude-tools |

### AWS
| Item | Type | Source |
|---|---|---|
| deploy-on-aws | plugin | `deploy-on-aws@claude-plugins-official` |
| aws-serverless | plugin | `aws-serverless@claude-plugins-official` |
| aws-core | plugin | `aws-core@claude-plugins-official` (includes CDK) |

### Supabase
| Item | Type | Source |
|---|---|---|
| supabase | plugin | `supabase@claude-plugins-official` (official bundle — includes MCP + skills) |
| supabase-postgres-best-practice | skill | GitHub |

### Extras
| Item | Type | Source |
|---|---|---|
| chrome-devtools-mcp | plugin | `chrome-devtools-mcp@claude-plugins-official` |
| firecrawl | plugin | `firecrawl@claude-plugins-official` |
| Jupyter MCP | MCP | `claude mcp add --scope project jupyter npx @jupyterlab/mcp-server` |
| error-handling-patterns | skill | GitHub: wshobson/agents |
| audit | skill | GitHub: pbakaus/impeccable |
| optimize | skill | GitHub: pbakaus/impeccable |
| superpowers | plugin | `superpowers@claude-plugins-official` |
| webgpu | skill | GitHub |
| ui-ux-pro-max | plugin | GitHub marketplace: nextlevelbuilder/ui-ux-pro-max-skill |

---

## Error Handling

- Each install step is independent: failure of one does not abort remaining
- Errors collected and shown in final summary with exact error message
- Exit code 0 if any succeeded, 1 if all failed

---

## GitHub Skill Fetch — Detail

For monorepos (e.g. `wshobson/agents` with multiple skills):
- Fetch full archive
- Extract only the subfolder matching the skill name
- Write to `.claude/skills/<skill-name>/`

For single-skill repos (e.g. `Harishwarrior/flutter-claude-skills`):
- Fetch archive
- Write whole repo content to `.claude/skills/<skill-name>/`

Implementation uses Node `https` + `tar` (no extra deps beyond what TypeScript projects already have, or `tar` stdlib).

---

## Open Items (implementation-time resolution)

- Exact GitHub org/repo URLs for: typescript-best-practices, python-best-practices, flutter-best-practices, dart-flutter-patterns, ios-swift-skills, nextjs-app-router-patterns, shadcn, awesome-design, fastapi skill, webgpu
- Exact MCP commands for: mcp_flutter, XcodeBuildMCP
- pbakaus/impeccable install mechanism (custom marketplace vs plugin install)
- Whether `supabase@claude-plugins-official` bundle makes `supabase-postgres-best-practice` redundant

These are catalog data, not architectural decisions — fill in during implementation via web search.
