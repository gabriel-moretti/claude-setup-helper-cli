# Integração do quality-harness — Plano de implementação

Spec: `docs/superpowers/specs/2026-11-25-quality-harness-integration-design.md`
Branch de integração: `feat/quality-harness-integration`

## Pré-requisito (humano, antes da execução)

Os worktrees dos agentes partem do `HEAD` de `main`. Hoje `quality-harness/`, `assets/guardrails/flutter*.md` e as mudanças em `src/`/`test/` **não estão commitados** e não existiriam nos worktrees. Commitar esse trabalho em `main` (ou numa branch base) antes de rodar a Fase 4.

## Convenções para todos os agentes

- Código e identificadores em inglês; mensagens ao usuário do CLI em PT-BR; comentários em PT-BR.
- Commits no formato emojicommit (`✨ feat: ...`, `✅ test: ...`), assunto em inglês, corpo em PT-BR, **sem trailer de atribuição de IA**.
- Nunca ler nem editar arquivos `.env`.
- Gate: `npm test` (cobertura ≥ 85% em linhas, funções e branches). Python: `python3 -m unittest discover assets/quality-harness/scripts/tests`.
- Testes de tarefas ainda não implementadas falham até a onda delas ser integrada; isso é esperado.

## Ondas

| Onda | Tarefas (em paralelo) |
|---|---|
| 1 | t1 mover skill · t2 testes `harness.ts` · t3 testes `harness-modules.ts` · t4 regra de atribuição de IA |
| 2 | t5 `detect_stacks.py --json` · t6 `src/harness-modules.ts` |
| 3 | t7 `src/harness.ts` |
| 4 | t8 integração em `src/index.ts` |
| 5 | t9 README |

Caminho crítico: t3 → t6 → t7 → t8 → t9.

---

## t1 — Mover o skill para `assets/quality-harness/`

- **Tier:** sonnet-low · **Kind:** implementation · **Wave:** 1 · **Depends on:** —
- **Files:** `quality-harness/**` → `assets/quality-harness/**`

Passos:
1. `git mv quality-harness assets/quality-harness`
2. Conferir que nenhum caminho absoluto quebrou: os scripts usam `Path(__file__).resolve().parent.parent` (`SKILL_ROOT`), então a mudança é transparente.
3. `python3 -m unittest discover assets/quality-harness/scripts/tests` → esperado: `OK`.
4. Commit: `♻️ refactor: move quality-harness skill under assets`.

---

## t2 — Testes de contrato de `src/harness.ts`

- **Tier:** sonnet-medium · **Kind:** tests · **Wave:** 1 · **Depends on:** —
- **Files:** `test/harness.test.ts` (novo)

Interface sob teste (implementada em t7, importar de `../src/harness.js`):

```ts
export type ExecFn = (cmd: string, args: string[], opts?: { cwd?: string; timeout?: number }) => string
export interface CliSelections { languages: string[]; frameworks: string[]; devops: string[] }
export interface HarnessDetection {
  suggested: string[]; recommended: string[]; default: string[]; catalog: string[]
  source: 'python' | 'ts'; warning?: string
}
export interface ApplyResult { mode: 'python' | 'fallback'; modules: string[]; report: string }

export function harnessSkillRoot(toolRoot: string): string
export function findPython(exec?: ExecFn): string | null
export function mapSelectionsToModules(sel: CliSelections): string[]
export function validateModules(modules: string[], toolRoot: string): string[]
export function detectModules(projectDir: string, toolRoot: string, python: string | null, exec?: ExecFn): HarnessDetection
export function preselectModules(det: HarnessDetection, sel: CliSelections): string[]
export function installHarnessSkill(projectDir: string, toolRoot: string): void
export function writeStandardsModules(projectDir: string, modules: string[]): string[]
export function applyModules(projectDir: string, toolRoot: string, modules: string[], python: string | null, exec?: ExecFn): ApplyResult
export function addHarnessNote(projectDir: string): void
```

Esqueleto (mesmo estilo de `test/installer.test.ts`):

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  harnessSkillRoot, findPython, mapSelectionsToModules, validateModules, detectModules,
  preselectModules, installHarnessSkill, writeStandardsModules, applyModules, addHarnessNote,
  type ExecFn, type HarnessDetection,
} from '../src/harness.js'

const TOOL_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'csh-harness-'))
const fail = (stderr: string): never => { const e: any = new Error('fail'); e.stderr = Buffer.from(stderr); throw e }
```

Casos obrigatórios (um `test()` cada, sempre limpando o tmp com `try/finally`):

1. `harnessSkillRoot` → `path.join(TOOL_ROOT, 'assets', 'quality-harness')` e `SKILL.md` existe lá.
2. `findPython`:
   - exec que retorna `'3 12\n'` para `python3` → `'python3'`.
   - exec que lança para `python3` e retorna `'3 11'` para `python` → `'python'`.
   - exec que retorna `'3 10'` em ambos → `null`.
   - exec que sempre lança → `null`.
   - O exec recebe `['-c', 'import sys, tomllib; print(sys.version_info[0], sys.version_info[1])']`.
3. `mapSelectionsToModules({languages:['flutter'], frameworks:['nextjs','fastapi'], devops:['aws','supabase']})` → `['aws','database','fastapi','flutter','nextjs']`. Com seleções vazias → `[]`. Chaves duplicadas não se repetem.
4. `validateModules(['nextjs','github'], TOOL_ROOT)` → `['github','nextjs']`. `validateModules(['nope'], TOOL_ROOT)` lança Error com `nope` na mensagem. `validateModules(['_baseLayers'], TOOL_ROOT)` e `validateModules(['node'], TOOL_ROOT)` lançam.
5. `detectModules` com Python injetado: exec retorna `JSON.stringify({suggested:['github','nextjs'], recommended:['qa-e2e'], default:['github'], catalog:['github','nextjs','qa-e2e']})` → `source === 'python'`, campos iguais, sem `warning`. O exec é chamado com args `[<toolRoot>/assets/quality-harness/scripts/detect_stacks.py, projectDir, '--json']`.
6. `detectModules` com Python que lança ou retorna `'not json'` ou `'{"suggested": 1}'` → `source === 'ts'` e `warning` definido.
7. `detectModules(dir, TOOL_ROOT, null)` num tmp com `package.json` `{"dependencies":{"next":"15"}}` e `next.config.ts` → `source === 'ts'`, `suggested` contém `nextjs`, `catalog` contém todos os módulos de `modules.json` (exceto `_baseLayers`). Sem `warning`.
8. `preselectModules`: det com `suggested:['github']`, `default:['github']`, `recommended:['qa-e2e']`, `catalog:['database','github','qa-e2e']` (sem `aws`); sel com `devops:['aws','supabase']` → `['database','github','qa-e2e']` (`aws` filtrado por não estar no catálogo; resultado ordenado).
9. `installHarnessSkill(dir, TOOL_ROOT)` → `.claude/skills/quality-harness/SKILL.md` e `.claude/skills/quality-harness/modules.json` existem. Segunda chamada não lança.
10. `writeStandardsModules`:
    - arquivo ausente → cria `.github/standards.json` com `{"modules":["a","b"]}` (ordenado) e retorna a lista.
    - arquivo existente `{"docs":{"languages":["pt-BR"]},"modules":["x"]}` + `['b','x']` → preserva `docs`, `modules` = `['b','x']`.
    - arquivo existente com `'{ invalid'` → lança e o conteúdo do arquivo continua `'{ invalid'`.
    - arquivo existente com `'[]'` → lança.
11. `applyModules` com Python injetado: exec retorna `'## report'` → `{mode:'python', report:'## report', modules:[...]}`. Args = `[<skill>/scripts/apply_modules.py, projectDir, '--modules', 'github,nextjs']`. Exec que lança com stderr `'boom'` → `applyModules` lança Error cuja mensagem contém `boom`.
12. `applyModules(dir, TOOL_ROOT, ['nextjs'], null)` → `mode:'fallback'`, `.github/standards.json` contém `nextjs`.
13. `applyModules` com módulo desconhecido lança antes de chamar exec (exec espião não chamado).
14. `addHarnessNote`: sem `CLAUDE.md` → cria com `<!-- quality-harness -->`. Chamada repetida → o marcador aparece uma única vez. `CLAUDE.md` existente preserva o conteúdo anterior.
15. **Integração real** (`test('detectModules: real python --json', { skip: findPython() === null }, ...)`): tmp com `.github/workflows/ci.yml` → `source === 'python'` e `suggested` contém `github`.

Commit: `✅ test: add contract tests for quality-harness integration`.

---

## t3 — Testes de contrato de `src/harness-modules.ts`

- **Tier:** sonnet-medium · **Kind:** tests · **Wave:** 1 · **Depends on:** —
- **Files:** `test/harness-modules.test.ts` (novo)

Interface sob teste (implementada em t6):

```ts
export interface ModuleDetect {
  files?: string[]; dirs?: string[]; globs?: string[]
  packageDeps?: string[]; pyprojectDeps?: string[]; pubspecDeps?: string[]; tfProviders?: string[]
  standards?: Record<string, unknown>
}
export interface ModuleSpec { depends?: string[]; detect?: ModuleDetect; default?: boolean; recommendedWhen?: string }
export interface HarnessCatalog { modules: Record<string, ModuleSpec>; baseLayers: string[] }
export interface TsDetection { detected: string[]; recommended: string[] }

export function loadHarnessCatalog(skillRoot: string): HarnessCatalog
export function detectModulesTs(projectDir: string, catalog: HarnessCatalog): TsDetection
```

Skill root nos testes: `path.join(TOOL_ROOT, 'assets', 'quality-harness')`. Helper `makeRepo(files: Record<string,string>): string` que escreve os arquivos num tmp.

Casos:
1. `loadHarnessCatalog` → `baseLayers` = `['node','python','flutter','docker']`; `modules` tem `nextjs` e `github`; **não** tem `_baseLayers`.
2. Repo vazio → `detected` = `['github']` (só o `default`), `recommended` = `[]`.
3. `apps/web/package.json` `{"dependencies":{"next":"15"}}` → `detected` contém `nextjs` (monorepo, profundidade 2).
4. `api/package.json` `{"dependencies":{"@nestjs/core":"11"}}` + `api/nest-cli.json` → `nestjs`.
5. `pyproject.toml` com `dependencies = ["fastapi>=0.115"]` → `fastapi`; com `dependencies = ["fastapi-users"]` (sem fastapi) → não contém `fastapi`.
6. `app/pubspec.yaml` (`dependencies:\n  flutter:\n    sdk: flutter\n`) + `app/android/build.gradle` → `flutter`.
7. Gate de base layer: só `android/build.gradle` e `ios/Runner/Info.plist`, sem `pubspec.yaml` → **não** contém `flutter`.
8. `.github/standards.json` `{"database":{"engine":"postgres"}}` → `database` (valor `"*"`); `{"infra":{"hosting":"aws"}}` → `aws`.
9. `nextjs` detectado → `recommended` contém `qa-e2e`; se `playwright.config.ts` também existe (`qa-e2e` detectado) → `recommended` não contém `qa-e2e`.
10. Sinais ignorados: um catálogo sintético `{modules:{x:{detect:{globs:['**/*.tf'], tfProviders:['hashicorp/aws'], unknownKey:[1]} as any}}, baseLayers:[]}` num repo com `main.tf` → `detected` = `[]`, sem lançar.
11. Pastas ignoradas: `node_modules/next/package.json` com `next` → não contém `nextjs` se não houver outro sinal.
12. Profundidade: `package.json` `{}` na raiz (base layer `node` presente) + `a/b/c/d/nest-cli.json` (pasta de profundidade 4) → **não** contém `nestjs`; com `a/b/c/nest-cli.json` → contém `nestjs`.
13. `package.json` com JSON inválido não lança.

Commit: `✅ test: add contract tests for harness module detection fallback`.

---

## t4 — Regra de atribuição de IA na baserule

- **Tier:** sonnet-low · **Kind:** implementation · **Wave:** 1 · **Depends on:** —
- **Files:** `assets/baserules/git-commits.md`, `.claude/baserules/git-commits.md`, `test/installer.test.ts`

Passos:
1. Em `assets/baserules/git-commits.md`, na seção `## Commit message format (emojicommit)`, depois da linha `- SHOULD keep each commit atomic...`, inserir:

```markdown
- NEVER add AI attribution to commits or PRs: no `Co-Authored-By` trailers for AI tools (Claude, Copilot, Cursor, ...), no "Generated with ..." lines. The quality-harness `commit-msg` hook strips them anyway.
```

2. Em `## Branching`, depois da linha `- SHOULD name branches in English...`, inserir:

```markdown
- NEVER use AI-tool branch prefixes (`claude/`, `copilot/`, `cursor/`, `codex/`). Use the Conventional Branch prefixes above.
```

3. Copiar o arquivo resultante para `.claude/baserules/git-commits.md` (cópia instalada neste repo).
4. Em `test/installer.test.ts`, adicionar:

```ts
test('installBaserules: git-commits.md forbids AI attribution and AI branch prefixes', () => {
  const dir = tmpDir()
  try {
    installBaserules(dir, TOOL_ROOT)
    const content = fs.readFileSync(path.join(dir, '.claude', 'baserules', 'git-commits.md'), 'utf8')
    assert.match(content, /NEVER add AI attribution/)
    assert.match(content, /claude\//)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
```

5. `npm test` → o novo teste passa (os testes de t2/t3 podem falhar até as ondas 2 e 3).
6. Commit: `📝 docs: forbid AI attribution and AI branch prefixes in git rules`.

---

## t5 — Flag `--json` em `detect_stacks.py`

- **Tier:** sonnet-medium · **Kind:** implementation · **Wave:** 2 · **Depends on:** t1
- **Files:** `assets/quality-harness/scripts/detect_stacks.py`, `assets/quality-harness/scripts/tests/test_modules.py`, `assets/quality-harness/CHANGELOG.md`

Passos:
1. Em `main()`, logo depois da validação `if not repo.is_dir(): ...`, inserir:

```python
    if "--json" in sys.argv:
        det = hm.detect(repo, in_production="--in-production" in sys.argv)
        catalog, _ = hm.load_catalog()
        print(json.dumps({
            "suggested": det.suggested,
            "recommended": sorted(det.recommended),
            "default": sorted(name for name, spec in catalog.items() if spec.get("default")),
            "catalog": sorted(catalog),
        }))
        return 0
```

   Conferir que `hm.load_catalog()` devolve o catálogo **sem** `_baseLayers`. Se devolver com ele, filtrar chaves que começam com `_`.
2. Atualizar a docstring de uso: `--json  print module detection as JSON ({suggested, recommended, default, catalog}) and exit.`
3. Em `test_modules.py`, adicionar em `DetectionTest`:

```python
    def test_detect_stacks_json_output(self) -> None:
        root = make_repo(FIXTURES["nextjs"])
        try:
            out = subprocess.run(
                [sys.executable, str(SCRIPTS / "detect_stacks.py"), str(root), "--json"],
                capture_output=True, text=True, check=True,
            ).stdout
            data = json.loads(out)
            self.assertEqual(set(data), {"suggested", "recommended", "default", "catalog"})
            self.assertIn("nextjs", data["suggested"])
            self.assertIn("github", data["default"])
            self.assertNotIn("_baseLayers", data["catalog"])
        finally:
            shutil.rmtree(root)
```

4. Em `CHANGELOG.md` do skill, sob uma nova entrada `## [Unreleased]` → `### Added`: `- Add \`--json\` to \`detect_stacks.py\` for machine-readable module detection ([detect_stacks.py](scripts/detect_stacks.py))`.
5. `python3 -m unittest discover assets/quality-harness/scripts/tests` → `OK`.
6. Commit: `✨ feat: add --json output to harness stack detector`.

---

## t6 — `src/harness-modules.ts` (fallback de detecção em TS)

- **Tier:** sonnet-high · **Kind:** implementation · **Wave:** 2 · **Depends on:** t1, t3
- **Files:** `src/harness-modules.ts` (novo)

Implementação (interface de t3):

```ts
import fs from 'node:fs'
import path from 'node:path'

// (interfaces ModuleDetect, ModuleSpec, HarnessCatalog, TsDetection exatamente como em t3)

const SKIP_DIRS = new Set(['.git', 'node_modules', 'vendor', '.venv', 'venv', '__pycache__', '.dart_tool',
  'build', 'dist', '.next', 'coverage', '.terraform', '.gradle'])
// profundidade máxima de pastas varridas (raiz = 0); espelha o limite do projects.js
const MAX_DEPTH = 3

export function loadHarnessCatalog(skillRoot: string): HarnessCatalog {
  const raw = JSON.parse(fs.readFileSync(path.join(skillRoot, 'modules.json'), 'utf8')) as Record<string, unknown>
  const baseLayers = Array.isArray(raw['_baseLayers']) ? (raw['_baseLayers'] as string[]) : []
  const modules: Record<string, ModuleSpec> = {}
  for (const [key, value] of Object.entries(raw)) if (!key.startsWith('_')) modules[key] = value as ModuleSpec
  return { modules, baseLayers }
}

interface Snapshot { files: string[]; dirs: string[] } // caminhos relativos POSIX

function scan(root: string): Snapshot {
  const files: string[] = []
  const dirs: string[] = []
  const walk = (rel: string, depth: number): void => {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue
        dirs.push(r)
        if (depth < MAX_DEPTH) walk(r, depth + 1)
      } else if (e.isFile()) {
        files.push(r)
      }
    }
  }
  walk('', 0)
  return { files, dirs }
}

const baseName = (p: string): string => p.slice(p.lastIndexOf('/') + 1)

function read(root: string, rel: string): string {
  try {
    return fs.readFileSync(path.join(root, rel), 'utf8')
  } catch {
    return ''
  }
}

function named(snap: Snapshot, name: string): string[] {
  return snap.files.filter((f) => baseName(f) === name)
}

function packageDeps(root: string, snap: Snapshot): Set<string> {
  const out = new Set<string>()
  for (const f of named(snap, 'package.json')) {
    try {
      const j = JSON.parse(read(root, f))
      for (const k of Object.keys({ ...(j.dependencies ?? {}), ...(j.devDependencies ?? {}) })) out.add(k.toLowerCase())
    } catch {
      // package.json inválido: ignora, a detecção é best-effort
    }
  }
  return out
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function pyprojectHas(text: string, dep: string): boolean {
  // nome do pacote entre aspas, seguido de extras/versão/aspas — evita casar "fastapi-users"
  return new RegExp(`["']${escapeRe(dep)}(\\[[^\\]]*\\])?\\s*([<>=~!;,"']|$)`, 'im').test(text)
}

function pubspecHas(text: string, dep: string): boolean {
  return new RegExp(`^\\s+${escapeRe(dep)}\\s*:`, 'm').test(text)
}

function dotted(obj: unknown, p: string): unknown {
  let cur: unknown = obj
  for (const key of p.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[key]
  }
  return cur
}

function presentBaseLayers(snap: Snapshot): Set<string> {
  const out = new Set<string>()
  if (named(snap, 'package.json').length) out.add('node')
  if (named(snap, 'pyproject.toml').length || snap.files.some((f) => /^requirements.*\.txt$/.test(baseName(f)))) out.add('python')
  if (named(snap, 'pubspec.yaml').length) out.add('flutter')
  if (snap.files.some((f) => baseName(f).startsWith('Dockerfile'))) out.add('docker')
  return out
}

export function detectModulesTs(projectDir: string, catalog: HarnessCatalog): TsDetection {
  const snap = scan(projectDir)
  const layers = presentBaseLayers(snap)
  const pkg = packageDeps(projectDir, snap)
  const pyText = named(snap, 'pyproject.toml').map((f) => read(projectDir, f)).join('\n')
    + snap.files.filter((f) => /^requirements.*\.txt$/.test(baseName(f))).map((f) => read(projectDir, f).split('\n').map((l) => `"${l.trim()}"`).join('\n')).join('\n')
  const pubText = named(snap, 'pubspec.yaml').map((f) => read(projectDir, f)).join('\n')
  let standards: unknown = null
  try {
    standards = JSON.parse(read(projectDir, '.github/standards.json') || 'null')
  } catch {
    standards = null
  }

  const detected: string[] = []
  for (const [name, spec] of Object.entries(catalog.modules)) {
    const d = spec.detect ?? {}
    let hit =
      (d.files ?? []).some((f) => named(snap, f).length > 0) ||
      (d.dirs ?? []).some((dir) => snap.dirs.some((x) => baseName(x) === dir)) ||
      (d.packageDeps ?? []).some((dep) => pkg.has(dep.toLowerCase())) ||
      (d.pyprojectDeps ?? []).some((dep) => pyprojectHas(pyText, dep)) ||
      (d.pubspecDeps ?? []).some((dep) => pubspecHas(pubText, dep)) ||
      Object.entries(d.standards ?? {}).some(([p, want]) => {
        if (p === 'in_production') return false // não é campo do standards.json
        const val = dotted(standards, p)
        return val !== undefined && val !== null && (want === '*' || val === want)
      })
    // módulo de stack exige a base layer (android/ sem pubspec não é Flutter)
    const baseDeps = (spec.depends ?? []).filter((x) => catalog.baseLayers.includes(x))
    if (hit && !baseDeps.every((x) => layers.has(x))) hit = false
    if (hit || spec.default) detected.push(name)
  }

  const recommended: string[] = []
  if (!detected.includes('qa-e2e') && detected.some((m) => m === 'nextjs' || m === 'flutter') && catalog.modules['qa-e2e']) {
    recommended.push('qa-e2e')
  }
  return { detected: detected.sort(), recommended }
}
```

Passos:
1. Criar o arquivo acima (com as interfaces de t3).
2. `npx tsc --noEmit` → sem erros.
3. `node --import tsx/esm --test test/harness-modules.test.ts` → todos passam.
4. Commit: `✨ feat: add TypeScript fallback for harness module detection`.

---

## t7 — `src/harness.ts`

- **Tier:** sonnet-high · **Kind:** implementation · **Wave:** 3 · **Depends on:** t2, t5, t6
- **Files:** `src/harness.ts` (novo)

Implementação (interface de t2):

```ts
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { detectModulesTs, loadHarnessCatalog } from './harness-modules.js'

// (tipos ExecFn, CliSelections, HarnessDetection, ApplyResult exatamente como em t2)

const PY_PROBE = ['-c', 'import sys, tomllib; print(sys.version_info[0], sys.version_info[1])']
const NOTE_MARKER = '<!-- quality-harness -->'

const defaultExec: ExecFn = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: opts.cwd, timeout: opts.timeout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

export function harnessSkillRoot(toolRoot: string): string {
  return path.join(toolRoot, 'assets', 'quality-harness')
}

export function findPython(exec: ExecFn = defaultExec): string | null {
  for (const cmd of ['python3', 'python']) {
    try {
      const [major, minor] = exec(cmd, PY_PROBE, { timeout: 5000 }).trim().split(/\s+/).map(Number)
      if (major === 3 && minor >= 11) return cmd
    } catch {
      // interpretador ausente ou sem tomllib (< 3.11): tenta o próximo
    }
  }
  return null
}

// seleção no CLI → módulo do harness (tabela da spec)
const SELECTION_MAP: Record<'languages' | 'frameworks' | 'devops', Record<string, string>> = {
  languages: { flutter: 'flutter' },
  frameworks: { nextjs: 'nextjs', fastapi: 'fastapi' },
  devops: { aws: 'aws', supabase: 'database' },
}

export function mapSelectionsToModules(sel: CliSelections): string[] {
  const out = new Set<string>()
  for (const group of ['languages', 'frameworks', 'devops'] as const) {
    for (const key of sel[group]) {
      const mod = SELECTION_MAP[group][key]
      if (mod) out.add(mod)
    }
  }
  return [...out].sort()
}

export function validateModules(modules: string[], toolRoot: string): string[] {
  const { modules: catalog } = loadHarnessCatalog(harnessSkillRoot(toolRoot))
  const unknown = modules.filter((m) => !Object.hasOwn(catalog, m))
  if (unknown.length > 0) throw new Error(`Módulos do harness desconhecidos: ${unknown.join(', ')}`)
  return [...new Set(modules)].sort()
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')

export function detectModules(projectDir: string, toolRoot: string, python: string | null, exec: ExecFn = defaultExec): HarnessDetection {
  const skillRoot = harnessSkillRoot(toolRoot)
  let warning: string | undefined
  if (python) {
    try {
      const out = exec(python, [path.join(skillRoot, 'scripts', 'detect_stacks.py'), projectDir, '--json'], { timeout: 20000 })
      const data = JSON.parse(out) as Record<string, unknown>
      if (isStringArray(data.suggested) && isStringArray(data.recommended) && isStringArray(data.default) && isStringArray(data.catalog)) {
        return { suggested: data.suggested, recommended: data.recommended, default: data.default, catalog: data.catalog, source: 'python' }
      }
      throw new Error('formato inesperado')
    } catch {
      warning = 'Detecção do harness via Python falhou — usando detecção simplificada.'
    }
  }
  const catalog = loadHarnessCatalog(skillRoot)
  const ts = detectModulesTs(projectDir, catalog)
  const defaults = Object.entries(catalog.modules).filter(([, s]) => s.default).map(([k]) => k).sort()
  return {
    suggested: ts.detected,
    recommended: ts.recommended,
    default: defaults,
    catalog: Object.keys(catalog.modules).sort(),
    source: 'ts',
    ...(warning ? { warning } : {}),
  }
}

export function preselectModules(det: HarnessDetection, sel: CliSelections): string[] {
  const all = new Set([...det.suggested, ...det.recommended, ...det.default, ...mapSelectionsToModules(sel)])
  return [...all].filter((m) => det.catalog.includes(m)).sort()
}

export function installHarnessSkill(projectDir: string, toolRoot: string): void {
  const target = path.join(projectDir, '.claude', 'skills', 'quality-harness')
  fs.rmSync(target, { recursive: true, force: true })
  fs.cpSync(harnessSkillRoot(toolRoot), target, {
    recursive: true,
    // não leva caches de Python para o projeto
    filter: (src) => !src.includes(`${path.sep}__pycache__`),
  })
}

export function writeStandardsModules(projectDir: string, modules: string[]): string[] {
  const file = path.join(projectDir, '.github', 'standards.json')
  let current: Record<string, unknown> = {}
  if (fs.existsSync(file)) {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf8'))
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('não é um objeto JSON')
      current = parsed as Record<string, unknown>
    } catch (err) {
      throw new Error(`.github/standards.json inválido — não foi sobrescrito: ${(err as Error).message}`)
    }
  }
  const previous = isStringArray(current.modules) ? current.modules : []
  const merged = [...new Set([...previous, ...modules])].sort()
  current.modules = merged
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(current, null, 2) + '\n', 'utf8')
  return merged
}

export function applyModules(projectDir: string, toolRoot: string, modules: string[], python: string | null, exec: ExecFn = defaultExec): ApplyResult {
  const valid = validateModules(modules, toolRoot)
  if (!python) {
    return { mode: 'fallback', modules: writeStandardsModules(projectDir, valid), report: '' }
  }
  const script = path.join(harnessSkillRoot(toolRoot), 'scripts', 'apply_modules.py')
  try {
    const report = exec(python, [script, projectDir, '--modules', valid.join(',')], { timeout: 60000 })
    return { mode: 'python', modules: valid, report }
  } catch (err: any) {
    const stderr = err?.stderr?.toString().trim()
    throw new Error(stderr || err?.message || 'apply_modules.py falhou')
  }
}

export function addHarnessNote(projectDir: string): void {
  const file = path.join(projectDir, 'CLAUDE.md')
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
  if (existing?.includes(NOTE_MARKER)) return
  const section =
    `\n## Quality harness\n\n${NOTE_MARKER}\n` +
    'This repo uses the `quality-harness` skill (`.claude/skills/quality-harness/`). Use it to install or audit the ' +
    'repo standards core (CRIAR / RETROFIT / AUDITAR), run the standards questionnaire and apply governance. ' +
    'Selected modules live in `.github/standards.json` → `modules`.\n'
  if (existing === null) fs.writeFileSync(file, `# Project Rules\n${section}`, 'utf8')
  else fs.appendFileSync(file, section, 'utf8')
}
```

Passos:
1. Criar o arquivo.
2. `npx tsc --noEmit` → sem erros.
3. `npm test` → tudo verde, cobertura ≥ 85%. Se a cobertura de branches de `harness.ts` ficar abaixo do mínimo, adicionar casos em `test/harness.test.ts`; **não** excluir o arquivo da cobertura.
4. Commit: `✨ feat: add quality-harness detection and install helpers`.

---

## t8 — Integração em `src/index.ts`

- **Tier:** sonnet-high · **Kind:** implementation · **Wave:** 4 · **Depends on:** t7
- **Files:** `src/index.ts`

Passos:
1. Imports: `import fs from 'node:fs'` e `import { findPython, detectModules, preselectModules, installHarnessSkill, applyModules, addHarnessNote } from './harness.js'`.
2. Depois do bloco `// 4. DevOps — optional` (`for (const d of devops) ...`), inserir:

```ts
  // 4b. Quality harness — padrão de repo; o core é instalado depois pelo skill
  let harnessModules: string[] | null = null
  let harnessPython: string | null = null
  const wantHarness = await confirm({
    message: 'Instalar quality-harness (padrão de repo: lefthook, CI, SemVer, gitmoji)?',
    initialValue: false,
  })
  bail(wantHarness)
  if (wantHarness) {
    let proceed = true
    if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
      const goOn = await confirm({ message: 'Este diretório não é um repositório git. Continuar mesmo assim?', initialValue: false })
      bail(goOn)
      proceed = goOn as boolean
    }
    if (proceed) {
      harnessPython = findPython()
      if (!harnessPython) log.warn('Python ≥ 3.11 não encontrado — usando detecção simplificada; o skill aplica os módulos depois.')
      const det = detectModules(process.cwd(), TOOL_ROOT, harnessPython)
      if (det.warning) log.warn(det.warning)
      const initial = preselectModules(det, {
        languages: langs.map((l) => l.key),
        frameworks: fws.map((f) => f.key),
        devops: devops.map((d) => d.key),
      })
      const picked = await multiselect({
        message: 'Harness — módulos (pré-marcados pela detecção):',
        options: det.catalog.map((m) => ({ value: m, label: m })),
        initialValues: initial,
        required: false,
      })
      bail(picked)
      harnessModules = picked as string[]
    }
  }
```

3. Na condição `if (toInstall.length === 0 && hooksChoice === 'no' && ...)`, acrescentar `&& harnessModules === null`.
4. No resumo (`note(...)`), acrescentar a linha:

```ts
  const harnessLine = harnessModules !== null
    ? `\n  quality-harness: skill${harnessModules.length ? ` + módulos ${harnessModules.join(', ')}` : ''}`
    : ''
```

   Incluir `harnessLine` depois de `localLine` e somar `(harnessModules !== null ? 1 : 0)` a `extras`.
5. Depois do bloco `// Guardrails install` e antes de `// CLAUDE.md update`, inserir:

```ts
  // Quality harness install
  if (harnessModules !== null) {
    const s = spinner()
    s.start('Instalando quality-harness...')
    try {
      installHarnessSkill(projectDir, TOOL_ROOT)
      addHarnessNote(projectDir)
      results.push({ label: 'quality-harness skill', success: true })
      s.stop('OK quality-harness → .claude/skills/quality-harness/')
    } catch (err: any) {
      results.push({ label: 'quality-harness skill', success: false, error: err?.message ?? String(err) })
      s.stop('FALHOU quality-harness skill', 2)
    }
    if (harnessModules.length > 0) {
      const sm = spinner()
      sm.start(`Aplicando módulos do harness (${harnessModules.join(', ')})...`)
      try {
        const res = applyModules(projectDir, TOOL_ROOT, harnessModules, harnessPython)
        results.push({ label: 'quality-harness módulos', success: true })
        sm.stop(res.mode === 'python'
          ? `OK módulos → .github/standards.json, assets e .mcp.json`
          : `OK módulos → .github/standards.json (dependências e assets serão aplicados pelo skill)`)
        if (res.mode === 'python' && res.report.trim()) note(res.report.trim(), 'Relatório do harness')
      } catch (err: any) {
        results.push({ label: 'quality-harness módulos', success: false, error: err?.message ?? String(err) })
        sm.stop('FALHOU quality-harness módulos', 2)
      }
    }
  }
```

6. Antes de `outro(...)`, quando `harnessModules !== null`: `log.info('Próximo passo: rode /quality-harness no Claude para instalar o core.')`.
7. `npx tsc --noEmit` e `npm run build` → sem erros. `npm test` → verde.
8. Smoke manual (o executor registra a saída): num tmp com `git init` e `package.json` `{"dependencies":{"next":"15"}}`, rodar `node --import tsx/esm -e "import('./src/harness.js').then(h => console.log(JSON.stringify(h.detectModules(process.argv[1], process.cwd(), h.findPython()))))" <tmp>` → `suggested` contém `nextjs` e `github`.
9. Commit: `✨ feat: offer quality-harness install with module preselection`.

---

## t9 — Documentação

- **Tier:** haiku · **Kind:** docs · **Wave:** 5 · **Depends on:** t8
- **Files:** `README.md`

Passos (texto em PT-BR):
1. Em `## Funcionalidades`, adicionar o item: quality-harness opcional, com detecção de módulos e pré-seleção.
2. Em `## Fluxo Interativo`, descrever a nova etapa 4b: confirmação, aviso fora de repo git, aviso sem Python ≥ 3.11 e multi-select pré-marcado.
3. Em `## O Que É Instalado`, criar a subseção `### Quality harness` com:
   - a tabela de mapeamento seleção → módulo (da spec);
   - o que o CLI faz (skill em `.claude/skills/quality-harness/`, `apply_modules.py` ou fallback em `standards.json`, nota no `CLAUDE.md`);
   - o que fica para o skill (core, questionário, RETROFIT, governança) e o próximo passo `/quality-harness`.
4. Na árvore de `## Arquitetura`: adicionar `harness.ts`, `harness-modules.ts`, `assets/quality-harness/`, `test/harness.test.ts` e `test/harness-modules.test.ts`.
5. No diagrama "Fluxo de instalação": adicionar `├─ quality-harness ──→ installHarnessSkill() + applyModules() ──→ .claude/skills/quality-harness/ + .github/standards.json`.
6. Em `## Requisitos`: Python ≥ 3.11 é opcional (sem ele, a detecção é simplificada e o skill aplica os módulos depois).
7. Commit: `📝 docs: document quality-harness integration`.

---

## Task Graph

```json
{ "tasks": [
  { "id": "t1", "title": "Move quality-harness skill under assets/", "deps": [], "tier": "sonnet-low", "kind": "implementation" },
  { "id": "t2", "title": "Contract tests for src/harness.ts", "deps": [], "tier": "sonnet-medium", "kind": "tests" },
  { "id": "t3", "title": "Contract tests for src/harness-modules.ts", "deps": [], "tier": "sonnet-medium", "kind": "tests" },
  { "id": "t4", "title": "AI attribution rule in git-commits baserule", "deps": [], "tier": "sonnet-low", "kind": "implementation" },
  { "id": "t5", "title": "detect_stacks.py --json flag + python test", "deps": ["t1"], "tier": "sonnet-medium", "kind": "implementation" },
  { "id": "t6", "title": "src/harness-modules.ts TS detection fallback", "deps": ["t1", "t3"], "tier": "sonnet-high", "kind": "implementation" },
  { "id": "t7", "title": "src/harness.ts detection/apply/install helpers", "deps": ["t2", "t5", "t6"], "tier": "sonnet-high", "kind": "implementation" },
  { "id": "t8", "title": "Wire quality-harness step into src/index.ts", "deps": ["t7"], "tier": "sonnet-high", "kind": "implementation" },
  { "id": "t9", "title": "README documentation", "deps": ["t8"], "tier": "haiku", "kind": "docs" }
] }
```
