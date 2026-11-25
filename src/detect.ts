import fs from 'node:fs'
import path from 'node:path'

export interface DetectedStack {
  languages: string[]
  frameworks: string[]
  devops: string[]
  flutterTargets: string[]
}

function readJson(file: string): any {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function readText(file: string): string {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

function exists(dir: string, rel: string): boolean {
  return fs.existsSync(path.join(dir, rel))
}

function hasFileMatching(dir: string, re: RegExp): boolean {
  try {
    return fs.readdirSync(dir).some((f) => re.test(f))
  } catch {
    return false
  }
}

/** Detect languages/frameworks/devops from manifests in projectDir. Keys match catalog keys. */
export function detectStack(dir: string): DetectedStack {
  const languages = new Set<string>()
  const frameworks = new Set<string>()
  const devops = new Set<string>()
  const flutterTargets = new Set<string>()

  // Node / TypeScript
  const pkg = readJson(path.join(dir, 'package.json'))
  if (pkg) {
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
    if (deps['typescript'] || exists(dir, 'tsconfig.json')) languages.add('typescript')
    if (deps['next']) frameworks.add('nextjs')
    if (deps['@supabase/supabase-js'] || deps['supabase']) devops.add('supabase')
    if (Object.keys(deps).some((d) => d.startsWith('@aws-sdk/') || d.startsWith('aws-cdk') || d === 'serverless')) {
      devops.add('aws')
    }
  }

  // Python
  const pyproject = readText(path.join(dir, 'pyproject.toml'))
  const requirements = hasFileMatching(dir, /^requirements.*\.txt$/)
    ? readText(path.join(dir, fs.readdirSync(dir).find((f) => /^requirements.*\.txt$/.test(f))!))
    : ''
  if (pyproject || requirements || exists(dir, 'setup.py')) {
    languages.add('python')
    if (/fastapi/i.test(pyproject) || /fastapi/i.test(requirements)) frameworks.add('fastapi')
    if (/\bboto3\b|aws-cdk/i.test(pyproject + requirements)) devops.add('aws')
  }

  // Flutter / Swift
  if (exists(dir, 'pubspec.yaml')) {
    languages.add('flutter')
    // plataformas habilitadas = pastas geradas pelo `flutter create --platforms`
    for (const t of ['ios', 'android', 'web']) if (exists(dir, t)) flutterTargets.add(t)
    if (['macos', 'windows', 'linux'].some((d) => exists(dir, d))) flutterTargets.add('desktop')
  }
  if (exists(dir, 'Package.swift') || hasFileMatching(dir, /\.xcodeproj$|\.xcworkspace$/)) languages.add('swift')

  // DevOps by config files
  if (exists(dir, 'supabase')) devops.add('supabase')
  if (exists(dir, 'cdk.json') || exists(dir, 'samconfig.toml') || exists(dir, 'serverless.yml') || exists(dir, 'template.yaml')) {
    devops.add('aws')
  }

  return {
    languages: [...languages],
    frameworks: [...frameworks],
    devops: [...devops],
    flutterTargets: [...flutterTargets],
  }
}
