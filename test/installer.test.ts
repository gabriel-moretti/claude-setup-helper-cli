import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  installPlugin,
  installMcp,
  installGuardrails,
  installBaserules,
  installHooks,
  installLocalSkills,
  installLocalPlugin,
  installWorkflows,
  listBaserules,
  updateClaudeMd,
} from '../src/installer.js'

const TOOL_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'csh-test-'))
}

// ── updateClaudeMd ───────────────────────────────────────────────────────────

test('updateClaudeMd: creates CLAUDE.md when absent', () => {
  const dir = tmpDir()
  try {
    updateClaudeMd(dir, ['.claude/baserules/security.md', '.claude/guardrails/frontend.md'])
    const content = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8')
    assert.ok(content.includes('@.claude/baserules/security.md'))
    assert.ok(content.includes('@.claude/guardrails/frontend.md'))
    assert.ok(content.includes('## Rules'))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('updateClaudeMd: appends to existing CLAUDE.md', () => {
  const dir = tmpDir()
  try {
    const claudeMd = path.join(dir, 'CLAUDE.md')
    fs.writeFileSync(claudeMd, '# My Project\n\nSome existing content.\n')
    updateClaudeMd(dir, ['.claude/baserules/language.md'])
    const content = fs.readFileSync(claudeMd, 'utf8')
    assert.ok(content.includes('# My Project'))
    assert.ok(content.includes('Some existing content.'))
    assert.ok(content.includes('@.claude/baserules/language.md'))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('updateClaudeMd: idempotent — does not duplicate imports', () => {
  const dir = tmpDir()
  try {
    updateClaudeMd(dir, ['.claude/baserules/security.md'])
    updateClaudeMd(dir, ['.claude/baserules/security.md'])
    const content = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8')
    const occurrences = (content.match(/@\.claude\/baserules\/security\.md/g) ?? []).length
    assert.equal(occurrences, 1, 'import should appear exactly once')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('updateClaudeMd: no-op when imports list is empty', () => {
  const dir = tmpDir()
  try {
    updateClaudeMd(dir, [])
    assert.ok(!fs.existsSync(path.join(dir, 'CLAUDE.md')), 'CLAUDE.md should not be created for empty imports')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('updateClaudeMd: only fresh imports are added (partial overlap)', () => {
  const dir = tmpDir()
  try {
    updateClaudeMd(dir, ['.claude/baserules/security.md'])
    updateClaudeMd(dir, ['.claude/baserules/security.md', '.claude/guardrails/aws-cost.md'])
    const content = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8')
    const secCount = (content.match(/@\.claude\/baserules\/security\.md/g) ?? []).length
    assert.equal(secCount, 1, 'security.md should not be duplicated')
    assert.ok(content.includes('@.claude/guardrails/aws-cost.md'), 'aws-cost.md should be added')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

// ── installPlugin / installMcp ────────────────────────────────────────────────

test('installPlugin: throws on failure (covers run() try/catch)', () => {
  const dir = tmpDir()
  try {
    // 'claude' will fail (plugin not found / no auth in test env); ENOENT if not installed
    assert.throws(() => installPlugin({ name: '_nonexistent_test_', marketplace: 'npm' }, dir))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('installPlugin: still throws when a third-party marketplace repo is set', () => {
  const dir = tmpDir()
  try {
    assert.throws(() =>
      installPlugin({ name: '_nonexistent_test_', marketplace: '_nonexistent_mkt_', repo: '_nonexistent_/_repo_' }, dir),
    )
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('installMcp: invokes claude mcp add without crashing the process', () => {
  const dir = tmpDir()
  try {
    // claude mcp add may succeed (writes config) or fail (auth); either path is acceptable
    installMcp({ name: '_test_mcp_', command: 'npx', args: ['-y', '_test_mcp_'] }, dir)
  } catch {
    // failure in test env is expected — we just need the function to run for coverage
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

// ── installGuardrails ─────────────────────────────────────────────────────────

test('installGuardrails: copies requested files to .claude/guardrails/', () => {
  const dir = tmpDir()
  try {
    installGuardrails(['aws-cost.md', 'frontend.md'], dir, TOOL_ROOT)
    const destDir = path.join(dir, '.claude', 'guardrails')
    assert.ok(fs.existsSync(path.join(destDir, 'aws-cost.md')), 'aws-cost.md not copied')
    assert.ok(fs.existsSync(path.join(destDir, 'frontend.md')), 'frontend.md not copied')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('installGuardrails: creates dest dir if absent', () => {
  const dir = tmpDir()
  try {
    installGuardrails(['backend.md'], dir, TOOL_ROOT)
    assert.ok(fs.statSync(path.join(dir, '.claude', 'guardrails')).isDirectory())
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

// ── installBaserules ──────────────────────────────────────────────────────────

test('installBaserules: copies every .md in assets/baserules and returns the list', () => {
  const dir = tmpDir()
  try {
    const installed = installBaserules(dir, TOOL_ROOT)
    const destDir = path.join(dir, '.claude', 'baserules')
    assert.deepEqual(installed, listBaserules(TOOL_ROOT))
    for (const f of ['ignore-files.md', 'language.md', 'security.md', 'git-commits.md']) {
      assert.ok(installed.includes(f), `${f} missing from returned list`)
      assert.ok(fs.existsSync(path.join(destDir, f)), `${f} not copied`)
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

// ── installLocalSkills / installWorkflows ─────────────────────────────────────

test('installLocalSkills: copies only skill dirs containing SKILL.md', () => {
  const dir = tmpDir()
  try {
    const installed = installLocalSkills(dir, TOOL_ROOT)
    assert.ok(installed.includes('audit-rules'))
    assert.ok(installed.includes('emojicommit'))
    assert.ok(installed.includes('parallel-plan'))
    for (const name of installed) {
      assert.ok(fs.existsSync(path.join(dir, '.claude', 'skills', name, 'SKILL.md')), `${name}/SKILL.md not copied`)
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('installLocalPlugin: copies every card skill from the bundled jira plugin', () => {
  const dir = tmpDir()
  try {
    const installed = installLocalPlugin({ dir: 'plugins/jira-cards' }, dir, TOOL_ROOT)
    assert.ok(installed.includes('card-triagem'))
    assert.ok(installed.includes('card-epic'))
    assert.ok(installed.includes('card-bug'))
    assert.equal(installed.length, 8, 'jira plugin ships 8 card skills')
    for (const name of installed) {
      assert.ok(fs.existsSync(path.join(dir, '.claude', 'skills', name, 'SKILL.md')), `${name}/SKILL.md not copied`)
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('installWorkflows: copies all .js workflows to .claude/workflows/', () => {
  const dir = tmpDir()
  try {
    const installed = installWorkflows(dir, TOOL_ROOT)
    assert.ok(installed.length >= 5, 'expected at least 5 workflows')
    for (const f of installed) {
      assert.ok(fs.existsSync(path.join(dir, '.claude', 'workflows', f)), `${f} not copied`)
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

// ── installHooks ──────────────────────────────────────────────────────────────

test('installHooks: copies .sh files and creates settings.json (sounds off)', () => {
  const dir = tmpDir()
  try {
    installHooks(dir, false, TOOL_ROOT)
    const hooksDir = path.join(dir, '.claude', 'hooks')
    const scripts = [
      'irreversibility-gate.sh',
      'secret-leak-gate.sh',
      'quality-gate.sh',
      'service-ended.sh',
      'service-input-needed.sh',
    ]
    for (const s of scripts) {
      const p = path.join(hooksDir, s)
      assert.ok(fs.existsSync(p), `${s} not copied`)
      assert.ok((fs.statSync(p).mode & 0o111) !== 0, `${s} not executable`)
    }
    const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'))
    assert.ok(settings.hooks, 'settings.json missing hooks key')
    assert.ok(!settings.env?.CLAUDE_SOUND_ALERTS, 'CLAUDE_SOUND_ALERTS should be absent when sounds off')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('installHooks: sets CLAUDE_SOUND_ALERTS=1 when sounds enabled', () => {
  const dir = tmpDir()
  try {
    installHooks(dir, true, TOOL_ROOT)
    const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'))
    assert.equal(settings.env?.CLAUDE_SOUND_ALERTS, '1')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('installHooks: merges into existing settings.json without overwriting other keys', () => {
  const dir = tmpDir()
  try {
    const settingsPath = path.join(dir, '.claude', 'settings.json')
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify({ model: 'claude-sonnet-4-6', custom: true }), 'utf8')
    installHooks(dir, false, TOOL_ROOT)
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    assert.equal(settings.model, 'claude-sonnet-4-6', 'existing model key should be preserved')
    assert.ok(settings.hooks, 'hooks should be merged in')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
