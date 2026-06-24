import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { updateClaudeMd } from '../src/installer.js'

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'csh-test-'))
}

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
