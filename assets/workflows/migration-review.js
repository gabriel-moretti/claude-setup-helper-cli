export const meta = {
  name: 'migration-review',
  description: 'Pre-deploy migration review: find pending migrations, flag destructive ops, check RLS on new tables, verify forward-safety',
  whenToUse: 'Before deploying DB migrations (Prisma or Supabase). args: { repo: "<abs path>", base: "main" } — reviews migrations not yet on the base branch, or all pending if no git base.',
  phases: [
    { title: 'Discover', detail: 'Find new/pending migration files' },
    { title: 'Analyze', detail: 'One agent per migration: destructive ops, RLS, forward-safety' },
    { title: 'Report', detail: 'Go / no-go verdict per migration' },
  ],
}

const REPO = (args && args.repo) || '.'
const BASE = (args && args.base) || 'main'

const DISCOVER_SCHEMA = {
  type: 'object',
  properties: {
    migrations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          engine: { type: 'string', enum: ['prisma', 'supabase', 'raw-sql', 'other'] },
        },
        required: ['path', 'engine'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['migrations'],
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['safe', 'needs-review', 'destructive'] },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: {
            type: 'string',
            enum: ['destructive', 'missing-rls', 'not-forward-safe', 'locking', 'money-type', 'other'],
          },
          detail: { type: 'string' },
          line: { type: 'number' },
          fix: { type: 'string' },
        },
        required: ['kind', 'detail', 'fix'],
      },
    },
    summary: { type: 'string', description: 'One sentence: what this migration does' },
  },
  required: ['verdict', 'issues', 'summary'],
}

phase('Discover')
const discovery = await agent(
  `Find migrations pending review in the repository at ${REPO}.

1. Locate migration directories: prisma/migrations/, supabase/migrations/, or other SQL migration folders.
2. If ${REPO} is a git repo and branch '${BASE}' exists: list migration files added/changed vs ${BASE} (git diff --name-only ${BASE}...HEAD -- <migration dirs>). Those are the ones to review.
3. If no git base applies: list migration files not yet applied if determinable (prisma migrate status / newest files); otherwise the most recent migrations.
4. Classify each by engine (prisma | supabase | raw-sql | other).

Return the list of migration file paths. If none found, return an empty list and explain in notes.`,
  { label: 'discover', phase: 'Discover', schema: DISCOVER_SCHEMA },
)

if (!discovery || discovery.migrations.length === 0) {
  return { verdict: 'nothing-to-review', notes: (discovery && discovery.notes) || 'No pending migrations found.' }
}
log(`${discovery.migrations.length} migration(s) to review`)

const analyses = await pipeline(
  discovery.migrations,
  m => agent(
    `Review ONE database migration for deploy safety. Repo: ${REPO}. File: ${m.path} (engine: ${m.engine}).
Rules of record: ${'/Users/moretti/Personal-Projects/claude/.claude'}/guardrails/database-prisma.md and supabase.md — read both first, then the migration SQL fully.

Check for:
1. DESTRUCTIVE ops: DROP TABLE/COLUMN/SCHEMA, TRUNCATE, type narrowing, NOT NULL on a populated column, data-losing type changes, DELETE/UPDATE backfills without WHERE safety. Prisma: renames generated as DROP+ADD.
2. RLS: every CREATE TABLE holding user/tenant/financial data must have ENABLE ROW LEVEL SECURITY + policies in this or an accompanying migration. Flag 'using (true)' policies. Flag SECURITY DEFINER functions without pinned search_path.
3. FORWARD-SAFETY (zero-downtime): column drops/renames the running app may still read; constraint added without backfill; missing expand-then-contract.
4. LOCKING: full-table rewrites or blocking index creation (CREATE INDEX without CONCURRENTLY) on plausibly large/hot tables.
5. MONEY TYPES: float/double columns for money (must be integer minor units or numeric).

Verdict: 'safe' (no issues), 'needs-review' (issues with mitigations to confirm), 'destructive' (data loss possible — requires explicit human approval per guardrails).`,
    { label: `analyze:${m.path.split('/').pop()}`, phase: 'Analyze', schema: ANALYSIS_SCHEMA },
  ).then(a => (a ? { ...a, path: m.path, engine: m.engine } : null)),
)

const reviewed = analyses.filter(Boolean)
const destructive = reviewed.filter(a => a.verdict === 'destructive')
log(`Analyzed ${reviewed.length}: ${destructive.length} destructive, ${reviewed.filter(a => a.verdict === 'needs-review').length} need review`)

phase('Report')
const report = await agent(
  `Write a pre-deploy migration review for a senior developer at a fintech (data loss is unacceptable; destructive migrations require explicit human approval).

Reviewed migrations:
${JSON.stringify(reviewed, null, 2)}

Format:
- Overall verdict first: DEPLOY OK / DEPLOY BLOCKED (blocked if anything is 'destructive', or 'needs-review' issues lack mitigation)
- Per migration: path, one-line summary, verdict, then each issue with line, detail, fix
- For every destructive item: state exactly what data is at risk and the required rollback/backup precondition
Be direct. No padding.`,
  { label: 'report', phase: 'Report' },
)

return { report, reviewed, blocked: destructive.length > 0 }
