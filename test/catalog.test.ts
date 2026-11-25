import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LANGUAGES, FRAMEWORKS, UIUX, DEVOPS, EXTRAS, FLUTTER_TARGETS, FLUTTER_STATE } from '../src/catalog.js'
import type { CatalogItem, Category } from '../src/types.js'

function allItems(cats: Category[]): CatalogItem[] {
  return cats.flatMap((c) => [...c.items, ...(c.qa ?? [])])
}

const ALL: CatalogItem[] = [
  ...allItems(LANGUAGES),
  ...allItems(FRAMEWORKS),
  ...UIUX.items,
  ...allItems(DEVOPS),
  ...allItems(FLUTTER_TARGETS),
  ...allItems(FLUTTER_STATE),
  ...EXTRAS.mcps,
  ...EXTRAS.skills,
]

test('every item has a label', () => {
  for (const item of ALL) {
    assert.ok(item.label.length > 0, `empty label in item: ${JSON.stringify(item)}`)
  }
})

test('skill items have org and repo (no TODO)', () => {
  for (const item of ALL.filter((i) => i.method === 'skill')) {
    assert.ok(item.skill, `skill item missing .skill: ${item.label}`)
    assert.notEqual(item.skill!.org, 'TODO', `org is TODO in: ${item.label}`)
    assert.notEqual(item.skill!.repo, 'TODO', `repo is TODO in: ${item.label}`)
    assert.ok(item.skill!.org.length > 0, `empty org in: ${item.label}`)
    assert.ok(item.skill!.repo.length > 0, `empty repo in: ${item.label}`)
  }
})

test('plugin items have name and marketplace', () => {
  for (const item of ALL.filter((i) => i.method === 'plugin')) {
    assert.ok(item.plugin, `plugin item missing .plugin: ${item.label}`)
    assert.ok(item.plugin!.name.length > 0, `empty plugin name in: ${item.label}`)
    assert.ok(item.plugin!.marketplace.length > 0, `empty marketplace in: ${item.label}`)
  }
})

test('mcp items have name, command, and args array', () => {
  for (const item of ALL.filter((i) => i.method === 'mcp')) {
    assert.ok(item.mcp, `mcp item missing .mcp: ${item.label}`)
    assert.ok(item.mcp!.name.length > 0, `empty mcp name in: ${item.label}`)
    assert.ok(item.mcp!.command.length > 0, `empty mcp command in: ${item.label}`)
    assert.ok(Array.isArray(item.mcp!.args), `mcp.args not array in: ${item.label}`)
  }
})

test('each item method matches its source field', () => {
  for (const item of ALL) {
    if (item.method === 'skill')  assert.ok(item.skill,  `skill source missing: ${item.label}`)
    if (item.method === 'plugin') assert.ok(item.plugin, `plugin source missing: ${item.label}`)
    if (item.method === 'mcp')    assert.ok(item.mcp,    `mcp source missing: ${item.label}`)
    if (item.method === 'local')  assert.ok(item.local,  `local source missing: ${item.label}`)
  }
})

test('local items have a non-empty dir', () => {
  for (const item of ALL.filter((i) => i.method === 'local')) {
    assert.ok(item.local, `local item missing .local: ${item.label}`)
    assert.ok(item.local!.dir.length > 0, `empty local dir in: ${item.label}`)
  }
})

test('EXTRAS.mcps contains only plugin or mcp items (no skills)', () => {
  for (const item of EXTRAS.mcps) {
    assert.ok(
      item.method === 'plugin' || item.method === 'mcp',
      `unexpected method in EXTRAS.mcps: ${item.label} (${item.method})`,
    )
  }
})

test('catalog is non-empty in every main section', () => {
  assert.ok(LANGUAGES.length > 0, 'LANGUAGES empty')
  assert.ok(FRAMEWORKS.length > 0, 'FRAMEWORKS empty')
  assert.ok(UIUX.items.length > 0, 'UIUX empty')
  assert.ok(DEVOPS.length > 0, 'DEVOPS empty')
})

const GUARDRAILS_DIR = path.resolve(fileURLToPath(import.meta.url), '..', '..', 'assets', 'guardrails')

test('every guardrail referenced by a category exists in assets/guardrails', () => {
  for (const c of [...LANGUAGES, ...FRAMEWORKS, ...DEVOPS, ...FLUTTER_TARGETS, ...FLUTTER_STATE]) {
    for (const f of c.guardrails ?? []) {
      assert.ok(fs.existsSync(path.join(GUARDRAILS_DIR, f)), `missing guardrail ${f} (category ${c.key})`)
    }
  }
})

test('Flutter targets cover mobile, web and desktop with their guardrails', () => {
  const keys = FLUTTER_TARGETS.map((t) => t.key)
  assert.deepEqual(keys, ['ios', 'android', 'web', 'desktop'])
  for (const t of FLUTTER_TARGETS) assert.ok((t.guardrails ?? []).length > 0, `no guardrail for ${t.key}`)
})

test('Flutter state choices include a no-op option', () => {
  assert.ok(FLUTTER_STATE.some((c) => c.key === 'none' && c.items.length === 0))
})

test('third-party marketplace plugins declare a repo to register', () => {
  for (const item of ALL.filter((i) => i.method === 'plugin' && i.plugin!.marketplace !== 'claude-plugins-official')) {
    assert.ok(item.plugin!.repo, `plugin ${item.label} needs plugin.repo to add its marketplace`)
  }
})

test('skills without subdir are not pointed at multi-skill repos known to lack a root SKILL.md', () => {
  const flutter = LANGUAGES.find((l) => l.key === 'flutter')!
  for (const it of [...flutter.items, ...(flutter.qa ?? [])]) {
    if (it.skill?.repo === 'flutter-claude-skills') assert.ok(it.skill.subdir, `${it.label} must use a subdir`)
  }
})

test('every framework declares languages that exist in LANGUAGES', () => {
  const langKeys = LANGUAGES.map((l) => l.key)
  for (const fw of FRAMEWORKS) {
    assert.ok(fw.languages && fw.languages.length > 0, `framework ${fw.key} has no languages`)
    for (const k of fw.languages!) assert.ok(langKeys.includes(k), `framework ${fw.key} references unknown language ${k}`)
  }
})
