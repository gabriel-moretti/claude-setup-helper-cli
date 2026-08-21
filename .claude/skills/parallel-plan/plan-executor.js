export const meta = {
  name: 'plan-executor',
  description: 'Execute a parallel-plan task graph: dependency waves, tiered agents in worktrees, Opus merge per wave, final Opus validation with one repair round',
  whenToUse: 'Launched by the parallel-plan skill. args: { planPath, graph, integrationBranch, integrationWorktree }',
  phases: [
    { title: 'Execute', detail: 'Waves in dependency order, tiered agents, worktree isolation, one retry per task' },
    { title: 'Merge', detail: 'Opus merges each wave into the integration branch, runs the suite', model: 'opus' },
    { title: 'Validate', detail: 'Opus audits the result against the plan; one Opus repair round if red', model: 'opus' },
  ],
}

const PLAN = args.planPath
const GRAPH = args.graph
const BRANCH = args.integrationBranch
const WT = args.integrationWorktree

if (!PLAN || !GRAPH || !GRAPH.tasks || !GRAPH.tasks.length || !BRANCH || !WT) {
  return { error: 'args required: planPath, graph.tasks[], integrationBranch, integrationWorktree' }
}

// tier -> model/effort (fixed table from the parallel-plan skill)
const TIER = {
  'opus':          { model: 'opus' },
  'sonnet-xhigh':  { model: 'sonnet', effort: 'xhigh' },
  'sonnet-high':   { model: 'sonnet', effort: 'high' },
  'sonnet-medium': { model: 'sonnet', effort: 'medium' },
  'sonnet-low':    { model: 'sonnet', effort: 'low' },
  'haiku':         { model: 'haiku' },
}

const TASK_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'failed'] },
    branch: { type: 'string' },
    summary: { type: 'string' },
    tests_pass: { type: 'boolean' },
    blockers: { type: 'string' },
  },
  required: ['status', 'branch', 'summary', 'tests_pass'],
}

const MERGE_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['merged', 'failed'] },
    merged_branches: { type: 'array', items: { type: 'string' } },
    suite_pass: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['status', 'merged_branches', 'suite_pass'],
}

const VALIDATE_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['green', 'red'] },
    tests_pass: { type: 'boolean' },
    plan_coverage: { type: 'string', description: 'Tasks in plan vs delivered; name any gap' },
    issues: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'tests_pass', 'plan_coverage', 'issues'],
}

const REPAIR_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['fixed', 'failed'] },
    notes: { type: 'string' },
  },
  required: ['status', 'notes'],
}

// --- topological waves ---
const done = new Set()
const waves = []
while (done.size < GRAPH.tasks.length) {
  const wave = GRAPH.tasks.filter(t => !done.has(t.id) && (t.deps || []).every(d => done.has(d)))
  if (wave.length === 0) {
    return { error: 'Dependency cycle in task graph: ' + GRAPH.tasks.filter(t => !done.has(t.id)).map(t => t.id).join(', ') }
  }
  wave.forEach(t => done.add(t.id))
  waves.push(wave)
}
log(`${GRAPH.tasks.length} tasks in ${waves.length} wave(s)`)

const taskPrompt = t => `You implement exactly ONE task from an implementation plan. You are in an isolated git worktree.

Plan: ${PLAN} — read it fully first; your task is "${t.id}: ${t.title}". Implement ONLY that task.

Rules:
1. Create your branch first: git checkout -b task/${t.id} ${BRANCH}
2. Follow the task's steps in the plan exactly — files, code, interfaces (Consumes/Produces are contracts with other agents; do not rename anything in them).
3. Run the task's tests/commands as written in the plan.
4. Commit with emojicommit format: <emoji> <type>: <subject> (e.g. "✨ feat: ..."). Stage only files your task touches — never git add .
5. Never read or edit .env files — guardrail hooks block them and abort your run. If the task needs a new env var, add it to .env.example and flag it in your summary.
6. If genuinely blocked (plan contradiction, missing dependency), commit nothing, return status=failed with the blocker.

Return: status, branch (task/${t.id}), one-paragraph summary, tests_pass.`

// one automatic retry per task before aborting the run
const runTask = async t => {
  const opts = { phase: 'Execute', schema: TASK_SCHEMA, isolation: 'worktree', ...(TIER[t.tier] || TIER['sonnet-medium']) }
  let r = await agent(taskPrompt(t), { ...opts, label: `task:${t.id}` })
  if (!r || r.status === 'failed') {
    const why = (r && (r.blockers || r.summary)) || 'agent died'
    log(`task ${t.id} failed (${why}) — retrying once`)
    r = await agent(taskPrompt(t) + `

RETRY — previous attempt failed with: ${why}
If branch task/${t.id} already exists, delete it first (git branch -D task/${t.id}) and start clean. Diagnose the failure before repeating the same steps.`, { ...opts, label: `task:${t.id}:retry` })
  }
  return { task: t.id, ...(r || { status: 'failed', branch: '', summary: 'agent died twice', tests_pass: false }) }
}

const mergePrompt = (branches, waveNum, pending) => `You are the merge integrator for wave ${waveNum}. Work ONLY inside the integration worktree at ${WT} (branch ${BRANCH} is checked out there). NEVER touch the user's main checkout.

Merge these task branches into ${BRANCH}, one at a time: ${branches.join(', ')}

1. cd ${WT}
2. For each branch: git merge --no-ff <branch>. On conflict: resolve using the plan (${PLAN}) — its Interfaces blocks define which signatures are canonical. Never resolve by deleting one side's work.
3. Run the project's test suite and lint.${pending.length
    ? ` IMPORTANT: this plan writes tests before implementations. Tests covering these NOT-yet-implemented tasks are EXPECTED to fail — ignore them: ${pending.map(t => `${t.id} (${t.title})`).join('; ')}. suite_pass=true means no failures beyond those.`
    : ' All tasks are implemented — suite_pass=true only if fully green.'} If unexpectedly red, fix the integration issue (never by weakening tests) and commit the fix with emojicommit.
4. Clean up each merged branch: if git worktree list shows a worktree holding it, run git worktree remove --force <path> first, then git branch -D <branch>.
5. Never read or edit .env files.

Return: status, merged_branches, suite_pass, notes. NEVER push anything.`

phase('Execute')
const results = []
const executed = new Set()
let aborted = null

for (let w = 0; w < waves.length && !aborted; w++) {
  const wave = waves[w]
  log(`Wave ${w + 1}/${waves.length}: ${wave.map(t => t.id).join(', ')}`)

  // one parallel() per wave — the Workflow pool caps concurrency, no need to chunk
  const rs = await parallel(wave.map(t => () => runTask(t)))
  results.push(...rs.filter(Boolean))
  wave.forEach(t => executed.add(t.id))

  const failed = results.filter(r => wave.some(t => t.id === r.task) && r.status === 'failed')
  if (failed.length) {
    aborted = `Wave ${w + 1} failures (after retry): ${failed.map(f => `${f.task} (${f.blockers || f.summary})`).join('; ')}`
    break
  }

  const pending = GRAPH.tasks.filter(t => !executed.has(t.id))
  const merge = await agent(mergePrompt(wave.map(t => `task/${t.id}`), w + 1, pending), {
    label: `merge:wave${w + 1}`, phase: 'Merge', schema: MERGE_SCHEMA, model: 'opus',
  })
  if (!merge || merge.status !== 'merged' || !merge.suite_pass) {
    aborted = `Wave ${w + 1} merge failed: ${(merge && merge.notes) || 'merge agent died'}`
    break
  }
}

if (aborted) {
  return { status: 'aborted', reason: aborted, results, branch: BRANCH, worktree: WT }
}

phase('Validate')
const validatePrompt = `Final validation of an autonomously executed plan. Work read-only in the integration worktree at ${WT} (branch ${BRANCH} is checked out there) — never switch branches in the user's main checkout. Never read or edit .env files.

Plan: ${PLAN}

1. Run the full test suite and lint; report honestly.
2. Audit delivery vs plan: every task in the plan's Task Graph delivered? Interfaces consistent? Any placeholder/TODO left in new code?
3. Check no commits landed on main/master/prod and nothing was pushed (git log main..${BRANCH} exists, git status clean).

verdict=green only if tests pass AND coverage complete AND no policy violation.`
const validateOpts = { phase: 'Validate', schema: VALIDATE_SCHEMA, model: 'opus' }

let validation = await agent(validatePrompt, { ...validateOpts, label: 'validate' })

// one repair round before giving up
if (validation && validation.verdict === 'red') {
  log(`validation red (${validation.issues.join('; ') || validation.plan_coverage}) — dispatching repair agent`)
  await agent(`You are the repair agent: final validation of an executed plan came back red. Work in the integration worktree at ${WT} (branch ${BRANCH}).

Plan: ${PLAN}
Issues: ${validation.issues.join('; ') || validation.plan_coverage}

Fix the issues properly — never by weakening or deleting tests. Commit fixes with emojicommit format. Never read or edit .env files. NEVER push.

Return: status (fixed|failed), notes.`, { label: 'repair', phase: 'Validate', schema: REPAIR_SCHEMA, model: 'opus' })
  validation = await agent(validatePrompt, { ...validateOpts, label: 'validate:2' })
}

return {
  status: validation && validation.verdict === 'green' ? 'green' : 'red',
  validation,
  results,
  branch: BRANCH,
  worktree: WT,
}
