import { execFileSync } from 'node:child_process'
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

export async function installSkill(source: SkillSource, projectDir: string): Promise<void> {
  // ponytail: use subdir basename when present so monorepo skills from the same
  // repo don't collide under .claude/skills; fall back to repo name otherwise.
  const name = (source.subdir ? source.subdir.split('/').pop() : undefined) ?? source.repo.split('/').pop()!
  const target = path.join(projectDir, '.claude', 'skills', name)
  await fetchSkill(source, target)
}
