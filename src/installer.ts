import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fetchSkill } from './skill-fetcher.js'
import type { PluginSource, McpSource, SkillSource } from './types.js'

function run(cmd: string, args: string[], cwd: string): void {
  try {
    execFileSync(cmd, args, { cwd, stdio: 'pipe' })
  } catch (err: any) {
    const stderr = err?.stderr?.toString().trim()
    throw new Error(stderr || err?.message || `Command failed: ${cmd}`)
  }
}

export function installPlugin(source: PluginSource, projectDir: string): void {
  run('claude', ['plugin', 'install', `${source.name}@${source.marketplace}`, '--scope', 'project'], projectDir)
}

export function installMcp(source: McpSource, projectDir: string): void {
  run('claude', ['mcp', 'add', '--scope', 'project', source.name, source.command, ...source.args], projectDir)
}

function copyLocalRules(srcDir: string, files: string[], destDir: string): void {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of files) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file))
  }
}

export function installGuardrails(files: string[], projectDir: string, toolRoot: string): void {
  copyLocalRules(
    path.join(toolRoot, 'assets', 'guardrails'),
    files,
    path.join(projectDir, '.claude', 'guardrails'),
  )
}

export function installBaserules(projectDir: string, toolRoot: string): void {
  const files = ['ignore-files.md', 'language.md', 'security.md']
  copyLocalRules(
    path.join(toolRoot, 'assets', 'baserules'),
    files,
    path.join(projectDir, '.claude', 'baserules'),
  )
}

export function installHooks(projectDir: string, soundsEnabled: boolean, toolRoot: string): void {
  const srcDir = path.join(toolRoot, 'assets', 'hooks')
  const destDir = path.join(projectDir, '.claude', 'hooks')
  fs.mkdirSync(destDir, { recursive: true })

  const scripts = [
    'irreversibility-gate.sh',
    'secret-leak-gate.sh',
    'quality-gate.sh',
    'service-ended.sh',
    'service-input-needed.sh',
  ]
  for (const s of scripts) {
    fs.copyFileSync(path.join(srcDir, s), path.join(destDir, s))
    fs.chmodSync(path.join(destDir, s), 0o755)
  }

  // merge hooks into .claude/settings.json
  const settingsPath = path.join(projectDir, '.claude', 'settings.json')
  const existing = fs.existsSync(settingsPath)
    ? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    : {}
  const hookTemplate = JSON.parse(
    fs.readFileSync(path.join(srcDir, 'hooks-settings.json'), 'utf8'),
  )
  existing.hooks = hookTemplate.hooks
  if (soundsEnabled) {
    existing.env = { ...(existing.env ?? {}), CLAUDE_SOUND_ALERTS: '1' }
  }
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
  fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n', 'utf8')

  // ensure ~/.claude/sounds/ exists for user to drop MP3s
  fs.mkdirSync(path.join(process.env['HOME'] ?? '~', '.claude', 'sounds'), { recursive: true })
}

export function updateClaudeMd(projectDir: string, imports: string[]): void {
  if (imports.length === 0) return

  const claudeMdPath = path.join(projectDir, 'CLAUDE.md')
  const existing = fs.existsSync(claudeMdPath) ? fs.readFileSync(claudeMdPath, 'utf8') : null

  // filter out already-present imports
  const fresh = imports.filter((imp) => !existing?.includes(imp))
  if (fresh.length === 0) return

  const section = '\n## Rules\n\n' + fresh.map((imp) => `@${imp}`).join('\n') + '\n'

  if (existing === null) {
    fs.writeFileSync(claudeMdPath, `# Project Rules${section}`, 'utf8')
  } else {
    fs.appendFileSync(claudeMdPath, section, 'utf8')
  }
}

export async function installSkill(source: SkillSource, projectDir: string): Promise<void> {
  // ponytail: use subdir basename when present so monorepo skills from the same
  // repo don't collide under .claude/skills; fall back to repo name otherwise.
  const name = (source.subdir ? source.subdir.split('/').pop() : undefined) ?? source.repo.split('/').pop()!
  const target = path.join(projectDir, '.claude', 'skills', name)
  await fetchSkill(source, target)
}
