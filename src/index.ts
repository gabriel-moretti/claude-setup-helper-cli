import {
  intro,
  outro,
  multiselect,
  confirm,
  note,
  spinner,
  cancel,
  isCancel,
  log,
} from '@clack/prompts'
import { LANGUAGES, FRAMEWORKS, UIUX, DEVOPS, EXTRAS } from './catalog.js'
import { installPlugin, installMcp, installSkill } from './installer.js'
import type { CatalogItem, Category, InstallResult } from './types.js'

function bail(value: unknown): void {
  if (isCancel(value)) {
    cancel('Cancelado.')
    process.exit(0)
  }
}

async function pickCategories(cats: Category[], message: string, required: boolean): Promise<Category[]> {
  const selected = await multiselect({
    message,
    options: cats.map((c) => ({ value: c.key, label: c.label })),
    required,
  })
  bail(selected)
  const keys = selected as string[]
  return cats.filter((c) => keys.includes(c.key))
}

async function main(): Promise<void> {
  intro('claude-setup-helper')

  const toInstall: CatalogItem[] = []

  // 1. Languages — required
  const langs = await pickCategories(LANGUAGES, 'Linguagens (escolha pelo menos 1):', true)
  for (const lang of langs) {
    toInstall.push(...lang.items)
    if (lang.qa && lang.qa.length > 0) {
      const wantTests = await confirm({ message: `Adicionar testes para ${lang.label}?` })
      bail(wantTests)
      if (wantTests) toInstall.push(...lang.qa)
    }
  }

  // 2. Frameworks — optional
  const fws = await pickCategories(FRAMEWORKS, 'Frameworks (opcional):', false)
  for (const fw of fws) toInstall.push(...fw.items)

  // 3. UI/UX — confirm
  const wantUiux = await confirm({ message: 'Adicionar skills de UI/UX?' })
  bail(wantUiux)
  if (wantUiux) toInstall.push(...UIUX.items)

  // 4. DevOps — optional
  const devops = await pickCategories(DEVOPS, 'DevOps (opcional):', false)
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

  if (toInstall.length === 0) {
    outro('Nada selecionado.')
    process.exit(0)
  }

  // 6. Summary
  const counts = { plugin: 0, skill: 0, mcp: 0 }
  for (const it of toInstall) counts[it.method]++
  note(
    `${counts.plugin} plugins, ${counts.skill} skills, ${counts.mcp} MCPs\n` +
      toInstall.map((it) => `  - ${it.label}`).join('\n'),
    `${toInstall.length} itens`
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
      else await installSkill(item.skill!, projectDir)
      results.push({ label: item.label, success: true })
      s.stop(`[${i + 1}/${total}] OK ${item.label}`)
    } catch (err: any) {
      results.push({ label: item.label, success: false, error: err?.message ?? String(err) })
      s.stop(`[${i + 1}/${total}] FALHOU ${item.label}`, 2)
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
