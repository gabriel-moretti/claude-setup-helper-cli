import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { detectModulesTs, loadHarnessCatalog } from './harness-modules.js'

export type ExecFn = (cmd: string, args: string[], opts?: { cwd?: string; timeout?: number }) => string
export interface CliSelections { languages: string[]; frameworks: string[]; devops: string[] }
export interface HarnessDetection {
  suggested: string[]; recommended: string[]; default: string[]; catalog: string[]
  source: 'python' | 'ts'; warning?: string
}
export interface ApplyResult { mode: 'python' | 'fallback'; modules: string[]; report: string }

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
    // mesma semântica do detect_stacks.py --json: suggested inclui os recomendados
    suggested: [...new Set([...ts.detected, ...ts.recommended])].sort(),
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
