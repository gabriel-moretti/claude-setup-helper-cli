import fs from 'node:fs'
import path from 'node:path'

export interface ModuleDetect {
  files?: string[]
  dirs?: string[]
  globs?: string[]
  packageDeps?: string[]
  pyprojectDeps?: string[]
  pubspecDeps?: string[]
  tfProviders?: string[]
  standards?: Record<string, unknown>
}
export interface ModuleSpec {
  depends?: string[]
  detect?: ModuleDetect
  default?: boolean
  recommendedWhen?: string
}
export interface HarnessCatalog {
  modules: Record<string, ModuleSpec>
  baseLayers: string[]
}
export interface TsDetection {
  detected: string[]
  recommended: string[]
}

// .claude/ é ignorada: o skill instalado lá traz arquivos que disparariam a detecção (ex.: playwright.config.ts)
const SKIP_DIRS = new Set(['.git', '.claude', 'node_modules', 'vendor', '.venv', 'venv', '__pycache__', '.dart_tool',
  'build', 'dist', '.next', 'coverage', '.terraform', '.gradle'])
// profundidade máxima de pastas varridas (raiz = 0); espelha o limite do projects.cjs
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
