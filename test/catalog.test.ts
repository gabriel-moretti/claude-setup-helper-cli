import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LANGUAGES, FRAMEWORKS, UIUX, DEVOPS, EXTRAS } from '../src/catalog.js'
import type { CatalogItem, Category } from '../src/types.js'

function allItems(cats: Category[]): CatalogItem[] {
  return cats.flatMap((c) => [...c.items, ...(c.qa ?? [])])
}

const ALL: CatalogItem[] = [
  ...allItems(LANGUAGES),
  ...allItems(FRAMEWORKS),
  ...UIUX.items,
  ...allItems(DEVOPS),
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
