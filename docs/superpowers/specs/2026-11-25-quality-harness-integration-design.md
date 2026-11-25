# Integração do quality-harness no claude-setup — Design

- **Data:** 2026-11-25
- **Status:** aprovado (brainstorming)
- **Escopo:** CLI `claude-setup-helper` + skill `quality-harness`

## Objetivo

Fazer o `claude-setup` oferecer o quality-harness da DeltaPag e instalá-lo de acordo com a necessidade do repositório: detectar quais módulos opcionais se aplicam, deixar o usuário confirmar e aplicar só esses. A parte que exige julgamento (core, questionário de padrões, RETROFIT em etapas, governança) continua no skill, executado pelo Claude.

## Decisões

| # | Decisão | Escolha |
|---|---|---|
| 1 | Papel do CLI | **Híbrido** — o CLI instala o skill, detecta e seleciona módulos e grava `standards.json`; o skill faz o resto |
| 2 | Dependência de Python | **Chamar os scripts Python quando houver Python ≥ 3.11**; caso contrário, fallback em TS que só detecta e grava `standards.json → modules` |
| 3 | Core do harness (`assets/core/`) | **O CLI não copia.** O skill instala (placeholders, VERSION por trilha, RETROFIT em etapas) |
| 4 | Atribuição de IA em commits | **Adotar a regra do harness** em `git-commits.md`: proibir trailers de atribuição de IA e prefixos de branch de IA |

## Fora de escopo

- Copiar `assets/core/` pelo CLI.
- Rodar o questionário de padrões (`references/standards.md`) ou a governança (rulesets) pelo CLI.
- Portar `apply_modules.py` para TypeScript.
- Resolver `depends` no fallback sem Python (o skill resolve depois).

## Fluxo no CLI

Nova etapa depois de **DevOps** e antes de **Hooks**:

```
◆ Instalar quality-harness (padrão de repo: lefthook, CI, SemVer, gitmoji)?  [sim/não]
◆ Harness — módulos:   (multi-select, pré-marcado)
   ☑ github  ☑ nextjs  ☐ nestjs  ☑ database  ☐ observability ...
```

- Se o diretório atual não for um repositório git, a etapa pergunta antes se deve continuar mesmo assim.
- As opções do multi-select são todas as chaves de `modules.json`, exceto `_baseLayers`.
- **Pré-marcação** = união de:
  1. Detector do harness: módulos `suggested`, `recommended` e `default` (`github`).
  2. Seleções anteriores no CLI:

| Seleção no CLI | Módulo pré-marcado |
|---|---|
| Framework `nextjs` | `nextjs` |
| Framework `fastapi` | `fastapi` |
| Linguagem `flutter` | `flutter` |
| DevOps `aws` | `aws` |
| DevOps `supabase` | `database` |

### Na instalação

1. Copiar `assets/quality-harness/` para `<projeto>/.claude/skills/quality-harness/`, sobrescrevendo (é tooling, não conteúdo do usuário).
2. Se houver módulos selecionados:
   - **Com Python ≥ 3.11:** `apply_modules.py <projeto> --modules a,b`. O script resolve `depends`, faz a união em `.github/standards.json → modules`, copia os assets dos módulos sem sobrescrever e faz o merge de `.mcp.json`.
   - **Sem Python:** gravar só `.github/standards.json → {"modules": [...]}` (união, ordenada, sem remover nada).
3. Adicionar ao `CLAUDE.md` (via `updateClaudeMd`, que já deduplica) uma linha orientando o Claude a usar o skill `quality-harness` para o core, o questionário e a governança.
4. Mensagem final: `Próximo passo: rode /quality-harness no Claude para instalar o core.` Sem Python, acrescentar: `Dependências de módulos e assets serão aplicados pelo skill.`

## Componentes

| Unidade | Responsabilidade | Depende de |
|---|---|---|
| `assets/quality-harness/` | O skill, movido da raiz do repo para `assets/` (mesmo padrão dos outros assets) | — |
| `src/harness.ts` (novo) | `findPython()`, `detectModules(dir, selections)`, `applyModules(dir, modules)`, `installHarnessSkill(dir, toolRoot)`, `mapSelectionsToModules(...)`, `writeStandardsModules(dir, modules)`, `validateModules(modules, catalog)` | `harness-modules.ts`, `child_process` |
| `src/harness-modules.ts` (novo) | Fallback em TS: lê `modules.json` e avalia os sinais `files`, `dirs`, `packageDeps`, `pyprojectDeps`, `pubspecDeps`, `standards` e `default`. Ignora `globs` e `tfProviders` | `fs` |
| `src/index.ts` | Nova etapa de prompt e de instalação, no mesmo padrão de spinner e `InstallResult` | `harness.ts` |
| `assets/quality-harness/scripts/detect_stacks.py` | Nova flag `--json`: imprime `{"suggested": [], "recommended": [], "default": [], "catalog": []}` a partir de `harness_modules.detect()` | `harness_modules.py` |
| `assets/baserules/git-commits.md` | Nova regra: `NEVER add AI attribution trailers (Co-Authored-By for AI tools) or AI branch prefixes (claude/, copilot/, ...)` | — |
| `assets/skills/emojicommit/` | Conferir e remover qualquer instrução que adicione atribuição de IA | — |

Ao mover o skill para `assets/`, atualizar referências em `README.md` e na documentação de `docs/`.

## Detecção

1. `findPython()` testa `python3` e depois `python` com `-c "import sys, tomllib; print(sys.version_info[0], sys.version_info[1])"`. Aceita versão ≥ 3.11 e guarda o resultado em cache por execução. Retorna `null` se nenhum servir.
2. **Com Python:** `execFileSync(python, [detect_stacks.py, dir, '--json'], { timeout: 20000 })`. JSON inválido, exit code diferente de zero ou timeout gera um aviso e cai no fallback em TS.
3. **Fallback em TS:** só a partir de `modules.json`. Tipos de sinal desconhecidos são ignorados: pode detectar menos, nunca inventa módulo.
4. Aviso quando não há Python: `Python ≥ 3.11 não encontrado — usando detecção simplificada; o skill aplica os módulos depois.`

## Tratamento de erros

- A falha da detecção nunca interrompe o setup: só gera um aviso e usa o fallback.
- Exit code diferente de zero em `apply_modules.py` → `InstallResult { label: 'quality-harness módulos', success: false, error: stderr }`. A cópia do skill é um item separado e continua com sucesso, para o usuário poder reaplicar pelo Claude.
- `writeStandardsModules`: se o `standards.json` existente tiver JSON inválido, falha fechado (reporta o erro e não sobrescreve).
- `validateModules` aceita só chaves de `modules.json` (exceto `_baseLayers`) antes de montar o argumento `--modules`.
- Todas as chamadas usam `execFileSync` com array de argumentos, sem shell.

## Idempotência

- Rodar o CLI de novo recopia o skill.
- `apply_modules.py` já é aditivo: não remove módulos nem sobrescreve arquivos.
- O fallback faz união em `modules`.
- A linha do `CLAUDE.md` é deduplicada por `updateClaudeMd`.

## Testes

Node test runner, mantendo o gate de 85% de cobertura.

- **`test/harness.test.ts`:**
  - `mapSelectionsToModules`: cada mapeamento, e deduplicação.
  - `writeStandardsModules`: arquivo novo, merge com arquivo existente (preserva outras chaves), JSON inválido é recusado.
  - `validateModules`: rejeita chave desconhecida e `_baseLayers`.
  - `findPython` com função de exec injetada: ok, versão antiga, ausente.
  - `installHarnessSkill`: `SKILL.md` chega em `.claude/skills/quality-harness/`.
- **`test/harness-modules.test.ts`:** detecção TS com fixtures em diretório temporário:
  - `package.json` com `next`
  - `pubspec.yaml` com `flutter` + pasta `android/`
  - `nest-cli.json`
  - `.github/` e o módulo `default`
  - tolerância a sinal desconhecido
- **Integração:** roda o `detect_stacks.py --json` real e confere o formato do JSON. É pulado (`skip`) quando não há Python ≥ 3.11.
- **Skill:** novo caso em `assets/quality-harness/scripts/tests/test_modules.py` para a saída `--json`.
- **`test/installer.test.ts`:** confere que o `git-commits.md` instalado contém a regra de atribuição de IA.

## Critérios de aceite

- Em um repo Next.js com Python ≥ 3.11: `nextjs` e `github` vêm pré-marcados. Depois da instalação, `.github/standards.json` lista os módulos (com `node` resolvido como base layer, fora de `modules`) e `.claude/skills/quality-harness/SKILL.md` existe.
- No mesmo repo sem Python: mesma pré-marcação, `standards.json → modules` gravado, o aviso de fallback aparece e o setup termina com exit code 0.
- Recusar o harness não muda nenhum arquivo relacionado a ele.
- `npm test` passa com cobertura ≥ 85%, e `python3 -m unittest discover assets/quality-harness/scripts/tests` passa.
