import {
  outro,
  multiselect,
  select,
  confirm,
  note,
  spinner,
  cancel,
  isCancel,
  log,
} from '@clack/prompts'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { printHeader } from './header.js'
import { LANGUAGES, FRAMEWORKS, UIUX, DEVOPS, EXTRAS } from './catalog.js'
import { installPlugin, installMcp, installSkill, installLocalPlugin, installGuardrails, installBaserules, installHooks, installLocalSkills, installWorkflows, listBaserules, updateClaudeMd } from './installer.js'
import { detectStack } from './detect.js'
import type { CatalogItem, Category, InstallResult } from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TOOL_ROOT = path.resolve(__dirname, '..')

function resolveGuardrails(langKeys: string[], fwKeys: string[], devopsKeys: string[]): string[] {
  const files = new Set<string>()
  if (langKeys.includes('typescript')) files.add('frontend.md')
  if (langKeys.includes('python')) files.add('backend.md')
  if (langKeys.includes('flutter')) files.add('frontend.md')
  if (langKeys.includes('swift')) files.add('frontend.md')
  if (fwKeys.includes('nextjs')) {
    files.add('nextjs-fullstack.md')
    files.add('frontend.md')
    files.add('backend.md')
  }
  if (fwKeys.includes('fastapi')) {
    files.add('backend.md')
    files.add('rest-api.md')
  }
  if (devopsKeys.includes('aws')) {
    files.add('aws-cost.md')
    files.add('aws-security.md')
    files.add('github-actions.md')
  }
  if (devopsKeys.includes('supabase')) files.add('supabase.md')
  return [...files]
}

function bail(value: unknown): void {
  if (isCancel(value)) {
    cancel('Cancelado.')
    process.exit(0)
  }
}

async function pickCategories(cats: Category[], message: string, required: boolean, initial: string[] = []): Promise<Category[]> {
  const selected = await multiselect({
    message,
    options: cats.map((c) => ({ value: c.key, label: c.label })),
    initialValues: initial.filter((k) => cats.some((c) => c.key === k)),
    required,
  })
  bail(selected)
  const keys = selected as string[]
  return cats.filter((c) => keys.includes(c.key))
}

async function main(): Promise<void> {
  printHeader()

  const toInstall: CatalogItem[] = []

  // 0. Stack auto-detection — pre-selects options, user still confirms
  const detected = detectStack(process.cwd())
  const detectedAll = [...detected.languages, ...detected.frameworks, ...detected.devops]
  if (detectedAll.length > 0) {
    note(detectedAll.join(', '), 'Stack detectada')
  }

  // 1. Languages — required
  const langs = await pickCategories(LANGUAGES, 'Linguagens (escolha pelo menos 1):', true, detected.languages)
  for (const lang of langs) {
    toInstall.push(...lang.items)
    if (lang.qa && lang.qa.length > 0) {
      const wantTests = await confirm({ message: `Adicionar testes para ${lang.label}?` })
      bail(wantTests)
      if (wantTests) toInstall.push(...lang.qa)
    }
  }

  // 2. Frameworks — optional
  const fws = await pickCategories(FRAMEWORKS, 'Frameworks (opcional):', false, detected.frameworks)
  for (const fw of fws) toInstall.push(...fw.items)

  // 3. UI/UX — confirm
  const wantUiux = await confirm({ message: 'Adicionar skills de UI/UX?' })
  bail(wantUiux)
  if (wantUiux) toInstall.push(...UIUX.items)

  // 4. DevOps — optional
  const devops = await pickCategories(DEVOPS, 'DevOps (opcional):', false, detected.devops)
  for (const d of devops) toInstall.push(...d.items)

  // 5. Extras — optional
  const extraItems = [...EXTRAS.mcps, ...EXTRAS.skills]
  const extraSel = await multiselect({
    message: 'Extras (opcional):',
    options: extraItems.map((it, i) => ({ value: i, label: it.label })),
    required: false,
  })
  bail(extraSel)
  for (const i of extraSel as number[]) toInstall.push(extraItems[i])

  // 6. Hooks — quality dubious edition
  const hooksChoice = await select({
    message: 'Instalar hooks de qualidade duvidosa?',
    options: [
      { value: 'yes-sound',    label: 'Sim 🔊  (com som)' },
      { value: 'yes-no-sound', label: 'Sim 🔇  (sem som)' },
      { value: 'no',           label: 'Não' },
    ],
  })
  bail(hooksChoice)

  // 7. Base rules — universal, always all files in assets/baserules
  const baseruleFiles = listBaserules(TOOL_ROOT)
  const wantBaserules = await confirm({ message: 'Adicionar Base Rules?' })
  bail(wantBaserules)

  // 7b. Local skills bundled with this tool (audit-rules, emojicommit, parallel-plan, ...)
  const wantLocalSkills = await confirm({ message: 'Adicionar skills locais (audit-rules, emojicommit, parallel-plan)?' })
  bail(wantLocalSkills)

  // 7c. Workflows bundled with this tool
  const wantWorkflows = await confirm({ message: 'Adicionar workflows (security-scan, perf-validate, uiux-audit, ...)?' })
  bail(wantWorkflows)

  // 7. Guardrails — derived from selections, no per-file choice
  const wantGuardrails = await confirm({ message: 'Adicionar Guardrails?' })
  bail(wantGuardrails)
  const guardrailFiles = wantGuardrails
    ? resolveGuardrails(langs.map((l) => l.key), fws.map((f) => f.key), devops.map((d) => d.key))
    : []

  if (toInstall.length === 0 && hooksChoice === 'no' && !wantBaserules && !wantLocalSkills && !wantWorkflows && guardrailFiles.length === 0) {
    outro('Nada selecionado.')
    process.exit(0)
  }

  // 8. Summary
  const counts = { plugin: 0, skill: 0, mcp: 0, local: 0 }
  for (const it of toInstall) counts[it.method]++
  const baseruleLine = wantBaserules ? `\n  base rules: ${baseruleFiles.join(', ')}` : ''
  const guardrailLine = guardrailFiles.length > 0 ? `\n  guardrails: ${guardrailFiles.join(', ')}` : ''
  const localLine = (wantLocalSkills ? '\n  skills locais: audit-rules, emojicommit, parallel-plan' : '') +
    (wantWorkflows ? '\n  workflows: .claude/workflows/' : '')
  const extras = (wantBaserules ? 1 : 0) + (guardrailFiles.length > 0 ? 1 : 0) + (wantLocalSkills ? 1 : 0) + (wantWorkflows ? 1 : 0)
  note(
    `${counts.plugin} plugins, ${counts.skill} skills, ${counts.mcp} MCPs, ${counts.local} locais${baseruleLine}${guardrailLine}${localLine}\n` +
      toInstall.map((it) => `  - ${it.label}`).join('\n'),
    `${toInstall.length + extras} itens`
  )

  const projectDir = process.cwd()
  const go = await confirm({ message: `Instalar em: ${projectDir}?` })
  bail(go)
  if (!go) {
    cancel('Cancelado.')
    process.exit(0)
  }

  // Execution
  const results: InstallResult[] = []
  const total = toInstall.length
  for (let i = 0; i < total; i++) {
    const item = toInstall[i]
    const s = spinner()
    s.start(`[${i + 1}/${total}] Instalando ${item.label}...`)
    try {
      if (item.method === 'plugin') installPlugin(item.plugin!, projectDir)
      else if (item.method === 'mcp') installMcp(item.mcp!, projectDir)
      else if (item.method === 'local') installLocalPlugin(item.local!, projectDir, TOOL_ROOT)
      else await installSkill(item.skill!, projectDir)
      results.push({ label: item.label, success: true })
      s.stop(`[${i + 1}/${total}] OK ${item.label}`)
    } catch (err: any) {
      results.push({ label: item.label, success: false, error: err?.message ?? String(err) })
      s.stop(`[${i + 1}/${total}] FALHOU ${item.label}`, 2)
    }
  }

  // Hooks install
  if (hooksChoice !== 'no') {
    const s = spinner()
    s.start('Instalando hooks...')
    try {
      installHooks(projectDir, hooksChoice === 'yes-sound', TOOL_ROOT)
      results.push({ label: 'hooks', success: true })
      s.stop('OK hooks → .claude/hooks/ + .claude/settings.json')
    } catch (err: any) {
      results.push({ label: 'hooks', success: false, error: err?.message ?? String(err) })
      s.stop('FALHOU hooks', 2)
    }
  }

  // Baserules install
  const claudeMdImports: string[] = []
  if (wantBaserules) {
    const s = spinner()
    s.start('Instalando base rules...')
    try {
      const installed = installBaserules(projectDir, TOOL_ROOT)
      claudeMdImports.push(...installed.map((f) => `.claude/baserules/${f}`))
      results.push({ label: 'base rules', success: true })
      s.stop('OK base rules → .claude/baserules/')
    } catch (err: any) {
      results.push({ label: 'base rules', success: false, error: err?.message ?? String(err) })
      s.stop('FALHOU base rules', 2)
    }
  }

  // Local skills install
  if (wantLocalSkills) {
    const s = spinner()
    s.start('Instalando skills locais...')
    try {
      const installed = installLocalSkills(projectDir, TOOL_ROOT)
      results.push({ label: 'skills locais', success: true })
      s.stop(`OK skills locais (${installed.join(', ')}) → .claude/skills/`)
    } catch (err: any) {
      results.push({ label: 'skills locais', success: false, error: err?.message ?? String(err) })
      s.stop('FALHOU skills locais', 2)
    }
  }

  // Workflows install
  if (wantWorkflows) {
    const s = spinner()
    s.start('Instalando workflows...')
    try {
      const installed = installWorkflows(projectDir, TOOL_ROOT)
      results.push({ label: 'workflows', success: true })
      s.stop(`OK workflows (${installed.length}) → .claude/workflows/`)
    } catch (err: any) {
      results.push({ label: 'workflows', success: false, error: err?.message ?? String(err) })
      s.stop('FALHOU workflows', 2)
    }
  }

  // Guardrails install
  if (guardrailFiles.length > 0) {
    const s = spinner()
    s.start(`Instalando guardrails (${guardrailFiles.length} arquivos)...`)
    try {
      installGuardrails(guardrailFiles, projectDir, TOOL_ROOT)
      claudeMdImports.push(...guardrailFiles.map((f) => `.claude/guardrails/${f}`))
      results.push({ label: 'guardrails', success: true })
      s.stop(`OK guardrails → .claude/guardrails/`)
    } catch (err: any) {
      results.push({ label: 'guardrails', success: false, error: err?.message ?? String(err) })
      s.stop(`FALHOU guardrails`, 2)
    }
  }

  // CLAUDE.md update
  if (claudeMdImports.length > 0) {
    const s = spinner()
    s.start('Atualizando CLAUDE.md...')
    try {
      updateClaudeMd(projectDir, claudeMdImports)
      results.push({ label: 'CLAUDE.md', success: true })
      s.stop('OK CLAUDE.md atualizado')
    } catch (err: any) {
      results.push({ label: 'CLAUDE.md', success: false, error: err?.message ?? String(err) })
      s.stop('FALHOU CLAUDE.md', 2)
    }
  }

  const failures = results.filter((r) => !r.success)
  const ok = results.length - failures.length
  if (failures.length > 0) {
    log.error(
      'Falhas:\n' + failures.map((f) => `  - ${f.label}: ${f.error}`).join('\n')
    )
  }
  outro(`${ok} instalados, ${failures.length} falharam`)
  process.exit(failures.length > 0 ? 1 : 0)
}

main().catch((err) => {
  log.error(String(err?.stack ?? err))
  process.exit(1)
})
