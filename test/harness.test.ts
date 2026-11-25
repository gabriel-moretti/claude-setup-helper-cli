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
const SKILL_ROOT = path.join(TOOL_ROOT, 'assets', 'quality-harness')
const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'csh-harness-'))
const fail = (stderr: string): never => { const e: any = new Error('fail'); e.stderr = Buffer.from(stderr); throw e }
const PROBE_ARGS = ['-c', 'import sys, tomllib; print(sys.version_info[0], sys.version_info[1])']

function withTmp(fn: (dir: string) => void): void {
  const dir = tmpDir()
  try {
    fn(dir)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

function write(dir: string, rel: string, content: string): void {
  const file = path.join(dir, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content, 'utf8')
}

// ── harnessSkillRoot ─────────────────────────────────────────────────────────

test('harnessSkillRoot: points to assets/quality-harness with SKILL.md', () => {
  const root = harnessSkillRoot(TOOL_ROOT)
  assert.equal(root, path.join(TOOL_ROOT, 'assets', 'quality-harness'))
  assert.ok(fs.existsSync(path.join(root, 'SKILL.md')))
})

// ── findPython ───────────────────────────────────────────────────────────────

test('findPython: returns python3 when it is 3.12', () => {
  const calls: Array<[string, string[]]> = []
  const exec: ExecFn = (cmd, args) => {
    calls.push([cmd, args])
    return '3 12\n'
  }
  assert.equal(findPython(exec), 'python3')
  assert.equal(calls[0][0], 'python3')
  assert.deepEqual(calls[0][1], PROBE_ARGS)
})

test('findPython: falls back to python when python3 throws', () => {
  const exec: ExecFn = (cmd) => {
    if (cmd === 'python3') throw new Error('not found')
    return '3 11'
  }
  assert.equal(findPython(exec), 'python')
})

test('findPython: returns null when both are 3.10', () => {
  assert.equal(findPython(() => '3 10'), null)
})

test('findPython: returns null when exec always throws', () => {
  assert.equal(findPython(() => { throw new Error('nope') }), null)
})

// ── mapSelectionsToModules ───────────────────────────────────────────────────

test('mapSelectionsToModules: maps selections to sorted modules', () => {
  assert.deepEqual(
    mapSelectionsToModules({ languages: ['flutter'], frameworks: ['nextjs', 'fastapi'], devops: ['aws', 'supabase'] }),
    ['aws', 'database', 'fastapi', 'flutter', 'nextjs'],
  )
})

test('mapSelectionsToModules: empty selections yield empty list', () => {
  assert.deepEqual(mapSelectionsToModules({ languages: [], frameworks: [], devops: [] }), [])
})

test('mapSelectionsToModules: does not repeat duplicate keys', () => {
  assert.deepEqual(
    mapSelectionsToModules({ languages: ['flutter', 'flutter'], frameworks: ['nextjs', 'nextjs'], devops: [] }),
    ['flutter', 'nextjs'],
  )
})

// ── validateModules ──────────────────────────────────────────────────────────

test('validateModules: returns sorted valid modules', () => {
  assert.deepEqual(validateModules(['nextjs', 'github'], TOOL_ROOT), ['github', 'nextjs'])
})

test('validateModules: throws for unknown module naming it', () => {
  assert.throws(() => validateModules(['nope'], TOOL_ROOT), /nope/)
})

test('validateModules: rejects _baseLayers and base layer names', () => {
  assert.throws(() => validateModules(['_baseLayers'], TOOL_ROOT), Error)
  assert.throws(() => validateModules(['node'], TOOL_ROOT), Error)
})

// ── detectModules ────────────────────────────────────────────────────────────

test('detectModules: uses python --json output when valid', () => {
  withTmp((dir) => {
    const payload = { suggested: ['github', 'nextjs'], recommended: ['qa-e2e'], default: ['github'], catalog: ['github', 'nextjs', 'qa-e2e'] }
    const calls: Array<[string, string[]]> = []
    const exec: ExecFn = (cmd, args) => {
      calls.push([cmd, args])
      return JSON.stringify(payload)
    }
    const det = detectModules(dir, TOOL_ROOT, 'python3', exec)
    assert.equal(det.source, 'python')
    assert.deepEqual(det.suggested, payload.suggested)
    assert.deepEqual(det.recommended, payload.recommended)
    assert.deepEqual(det.default, payload.default)
    assert.deepEqual(det.catalog, payload.catalog)
    assert.equal(det.warning, undefined)
    assert.deepEqual(calls[0][1], [path.join(SKILL_ROOT, 'scripts', 'detect_stacks.py'), dir, '--json'])
  })
})

test('detectModules: falls back to ts with warning on python failure or bad output', () => {
  withTmp((dir) => {
    const execs: ExecFn[] = [
      () => { throw new Error('boom') },
      () => 'not json',
      () => '{"suggested": 1}',
    ]
    for (const exec of execs) {
      const det = detectModules(dir, TOOL_ROOT, 'python3', exec)
      assert.equal(det.source, 'ts')
      assert.ok(det.warning)
    }
  })
})

test('detectModules: ts fallback detects nextjs and lists full catalog', () => {
  withTmp((dir) => {
    write(dir, 'package.json', '{"dependencies":{"next":"15"}}')
    write(dir, 'next.config.ts', 'export default {}')
    const det = detectModules(dir, TOOL_ROOT, null)
    assert.equal(det.source, 'ts')
    assert.ok(det.suggested.includes('nextjs'))
    // paridade com detect_stacks.py --json: recomendados também entram em suggested
    assert.ok(det.recommended.includes('qa-e2e'))
    assert.ok(det.suggested.includes('qa-e2e'))
    assert.equal(det.warning, undefined)
    const modules = Object.keys(JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, 'modules.json'), 'utf8')))
      .filter((k) => k !== '_baseLayers')
    for (const m of modules) assert.ok(det.catalog.includes(m), `catalog missing ${m}`)
    assert.ok(!det.catalog.includes('_baseLayers'))
  })
})

test('detectModules: real python --json', { skip: findPython() === null }, () => {
  withTmp((dir) => {
    write(dir, '.github/workflows/ci.yml', 'name: ci\n')
    const det = detectModules(dir, TOOL_ROOT, findPython())
    assert.equal(det.source, 'python')
    assert.ok(det.suggested.includes('github'))
  })
})

// ── preselectModules ─────────────────────────────────────────────────────────

test('preselectModules: unions sources, filters by catalog and sorts', () => {
  const det: HarnessDetection = {
    suggested: ['github'], recommended: ['qa-e2e'], default: ['github'],
    catalog: ['database', 'github', 'qa-e2e'], source: 'python',
  }
  assert.deepEqual(
    preselectModules(det, { languages: [], frameworks: [], devops: ['aws', 'supabase'] }),
    ['database', 'github', 'qa-e2e'],
  )
})

// ── installHarnessSkill ──────────────────────────────────────────────────────

test('installHarnessSkill: copies skill and is re-runnable', () => {
  withTmp((dir) => {
    installHarnessSkill(dir, TOOL_ROOT)
    const target = path.join(dir, '.claude', 'skills', 'quality-harness')
    assert.ok(fs.existsSync(path.join(target, 'SKILL.md')))
    assert.ok(fs.existsSync(path.join(target, 'modules.json')))
    assert.doesNotThrow(() => installHarnessSkill(dir, TOOL_ROOT))
  })
})

// ── writeStandardsModules ────────────────────────────────────────────────────

test('writeStandardsModules: creates standards.json when absent', () => {
  withTmp((dir) => {
    const result = writeStandardsModules(dir, ['b', 'a'])
    assert.deepEqual(result, ['a', 'b'])
    const data = JSON.parse(fs.readFileSync(path.join(dir, '.github', 'standards.json'), 'utf8'))
    assert.deepEqual(data, { modules: ['a', 'b'] })
  })
})

test('writeStandardsModules: preserves other keys and merges modules', () => {
  withTmp((dir) => {
    write(dir, '.github/standards.json', '{"docs":{"languages":["pt-BR"]},"modules":["x"]}')
    const result = writeStandardsModules(dir, ['b', 'x'])
    assert.deepEqual(result, ['b', 'x'])
    const data = JSON.parse(fs.readFileSync(path.join(dir, '.github', 'standards.json'), 'utf8'))
    assert.deepEqual(data.docs, { languages: ['pt-BR'] })
    assert.deepEqual(data.modules, ['b', 'x'])
  })
})

test('writeStandardsModules: throws on invalid JSON without overwriting', () => {
  withTmp((dir) => {
    write(dir, '.github/standards.json', '{ invalid')
    assert.throws(() => writeStandardsModules(dir, ['a']))
    assert.equal(fs.readFileSync(path.join(dir, '.github', 'standards.json'), 'utf8'), '{ invalid')
  })
})

test('writeStandardsModules: throws when file is not an object', () => {
  withTmp((dir) => {
    write(dir, '.github/standards.json', '[]')
    assert.throws(() => writeStandardsModules(dir, ['a']))
  })
})

// ── applyModules ─────────────────────────────────────────────────────────────

test('applyModules: python mode returns report and calls apply_modules.py', () => {
  withTmp((dir) => {
    const calls: Array<[string, string[]]> = []
    const exec: ExecFn = (cmd, args) => {
      calls.push([cmd, args])
      return '## report'
    }
    const res = applyModules(dir, TOOL_ROOT, ['nextjs', 'github'], 'python3', exec)
    assert.equal(res.mode, 'python')
    assert.equal(res.report, '## report')
    assert.deepEqual(res.modules, ['github', 'nextjs'])
    assert.deepEqual(calls[0][1], [path.join(SKILL_ROOT, 'scripts', 'apply_modules.py'), dir, '--modules', 'github,nextjs'])
  })
})

test('applyModules: python failure surfaces stderr in the error', () => {
  withTmp((dir) => {
    assert.throws(
      () => applyModules(dir, TOOL_ROOT, ['github'], 'python3', () => fail('boom')),
      (err: Error) => err.message.includes('boom'),
    )
  })
})

test('applyModules: fallback mode writes standards.json', () => {
  withTmp((dir) => {
    const res = applyModules(dir, TOOL_ROOT, ['nextjs'], null)
    assert.equal(res.mode, 'fallback')
    const data = JSON.parse(fs.readFileSync(path.join(dir, '.github', 'standards.json'), 'utf8'))
    assert.ok(data.modules.includes('nextjs'))
  })
})

test('applyModules: unknown module throws before calling exec', () => {
  withTmp((dir) => {
    let called = false
    const exec: ExecFn = () => { called = true; return '' }
    assert.throws(() => applyModules(dir, TOOL_ROOT, ['nope'], 'python3', exec), /nope/)
    assert.equal(called, false)
  })
})

// ── addHarnessNote ───────────────────────────────────────────────────────────

test('addHarnessNote: creates CLAUDE.md with marker', () => {
  withTmp((dir) => {
    addHarnessNote(dir)
    assert.ok(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8').includes('<!-- quality-harness -->'))
  })
})

test('addHarnessNote: is idempotent', () => {
  withTmp((dir) => {
    addHarnessNote(dir)
    addHarnessNote(dir)
    const content = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8')
    assert.equal(content.split('<!-- quality-harness -->').length - 1, 1)
  })
})

test('addHarnessNote: preserves existing CLAUDE.md content', () => {
  withTmp((dir) => {
    write(dir, 'CLAUDE.md', '# Existing\n\nkeep me\n')
    addHarnessNote(dir)
    const content = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8')
    assert.ok(content.startsWith('# Existing\n\nkeep me\n'))
    assert.ok(content.includes('<!-- quality-harness -->'))
  })
})
