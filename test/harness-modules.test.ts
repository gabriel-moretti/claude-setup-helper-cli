import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadHarnessCatalog, detectModulesTs, type HarnessCatalog } from '../src/harness-modules.js'

const TOOL_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const SKILL_ROOT = path.join(TOOL_ROOT, 'assets', 'quality-harness')

function makeRepo(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'csh-modules-'))
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, content)
  }
  return dir
}

function detect(files: Record<string, string>, catalog?: HarnessCatalog) {
  const dir = makeRepo(files)
  try {
    return detectModulesTs(dir, catalog ?? loadHarnessCatalog(SKILL_ROOT))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

test('loadHarnessCatalog: reads base layers and modules without _baseLayers', () => {
  const catalog = loadHarnessCatalog(SKILL_ROOT)
  assert.deepEqual(catalog.baseLayers, ['node', 'python', 'flutter', 'docker'])
  assert.ok('nextjs' in catalog.modules)
  assert.ok('github' in catalog.modules)
  assert.ok(!('_baseLayers' in catalog.modules))
})

test('detectModulesTs: empty repo only yields default module', () => {
  const det = detect({})
  assert.deepEqual(det.detected, ['github'])
  assert.deepEqual(det.recommended, [])
})

test('detectModulesTs: detects nextjs in a monorepo (depth 2)', () => {
  const det = detect({ 'apps/web/package.json': '{"dependencies":{"next":"15"}}' })
  assert.ok(det.detected.includes('nextjs'))
})

test('detectModulesTs: detects nestjs via dependency and nest-cli.json', () => {
  const det = detect({
    'api/package.json': '{"dependencies":{"@nestjs/core":"11"}}',
    'api/nest-cli.json': '{}',
  })
  assert.ok(det.detected.includes('nestjs'))
})

test('detectModulesTs: fastapi matches exact dependency name only', () => {
  const yes = detect({ 'pyproject.toml': '[project]\nname = "x"\ndependencies = ["fastapi>=0.115"]\n' })
  assert.ok(yes.detected.includes('fastapi'))
  const no = detect({ 'pyproject.toml': '[project]\nname = "x"\ndependencies = ["fastapi-users"]\n' })
  assert.ok(!no.detected.includes('fastapi'))
})

test('detectModulesTs: detects flutter via pubspec and android dir', () => {
  const det = detect({
    'app/pubspec.yaml': 'dependencies:\n  flutter:\n    sdk: flutter\n',
    'app/android/build.gradle': '',
  })
  assert.ok(det.detected.includes('flutter'))
})

test('detectModulesTs: flutter is gated by its base layer', () => {
  const det = detect({ 'android/build.gradle': '', 'ios/Runner/Info.plist': '' })
  assert.ok(!det.detected.includes('flutter'))
})

test('detectModulesTs: standards.json signals', () => {
  const db = detect({ '.github/standards.json': '{"database":{"engine":"postgres"}}' })
  assert.ok(db.detected.includes('database'))
  const aws = detect({ '.github/standards.json': '{"infra":{"hosting":"aws"}}' })
  assert.ok(aws.detected.includes('aws'))
})

test('detectModulesTs: recommends qa-e2e for nextjs unless already detected', () => {
  const pkg = { 'package.json': '{"dependencies":{"next":"15"}}', 'next.config.ts': 'export default {}\n' }
  assert.ok(detect(pkg).recommended.includes('qa-e2e'))
  const withE2e = detect({ ...pkg, 'playwright.config.ts': 'export default {}\n' })
  assert.ok(withE2e.detected.includes('qa-e2e'))
  assert.ok(!withE2e.recommended.includes('qa-e2e'))
})

test('detectModulesTs: ignores unsupported signals without throwing', () => {
  const catalog = {
    modules: { x: { detect: { globs: ['**/*.tf'], tfProviders: ['hashicorp/aws'], unknownKey: [1] } as any } },
    baseLayers: [],
  } as HarnessCatalog
  const det = detect({ 'main.tf': 'provider "aws" {}\n' }, catalog)
  assert.deepEqual(det.detected, [])
})

test('detectModulesTs: skips node_modules', () => {
  const det = detect({ 'node_modules/next/package.json': '{"dependencies":{"next":"15"}}' })
  assert.ok(!det.detected.includes('nextjs'))
})

test('detectModulesTs: respects max directory depth', () => {
  const deep = detect({ 'package.json': '{}', 'a/b/c/d/nest-cli.json': '{}' })
  assert.ok(!deep.detected.includes('nestjs'))
  const ok = detect({ 'package.json': '{}', 'a/b/c/nest-cli.json': '{}' })
  assert.ok(ok.detected.includes('nestjs'))
})

test('detectModulesTs: invalid package.json does not throw', () => {
  assert.doesNotThrow(() => detect({ 'package.json': '{ not json' }))
})

test('detectModulesTs: ignores .claude directory', () => {
  const det = detect({
    'package.json': '{}',
    '.claude/skills/x/playwright.config.ts': 'export default {}\n',
  })
  assert.ok(!det.detected.includes('qa-e2e'))
})
