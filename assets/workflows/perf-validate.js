export const meta = {
  name: 'perf-validate',
  description: 'Audit application performance: bundle size, slow queries, N+1s, missing indexes, Core Web Vitals candidates',
  phases: [
    { title: 'Scan', detail: 'Find perf hotspots across frontend, API, and DB layers' },
    { title: 'Verify', detail: 'Adversarially confirm each finding is a real bottleneck' },
    { title: 'Report', detail: 'Ranked list with estimated impact and fix path' },
  ],
}

const SCAN_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          layer: { type: 'string', enum: ['frontend', 'api', 'database', 'network'] },
          file: { type: 'string' },
          line: { type: 'number' },
          issue: { type: 'string' },
          estimated_impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          fix_hint: { type: 'string' },
        },
        required: ['layer', 'file', 'issue', 'estimated_impact', 'fix_hint'],
      },
    },
  },
  required: ['findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    confirmed: { type: 'boolean' },
    reason: { type: 'string' },
    revised_impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'dismiss'] },
  },
  required: ['confirmed', 'reason', 'revised_impact'],
}

const SCANNERS = [
  {
    key: 'frontend',
    prompt: `Scan the frontend code (JS/TS/JSX/TSX) for performance issues. Look for:
- Large synchronous operations blocking the main thread
- Missing React.memo / useMemo / useCallback where expensive
- Unoptimized images or missing lazy loading
- Unnecessary re-renders from unstable references
- Large bundle candidates (barrel imports from heavy libs)
- Missing virtualization for long lists
Return ALL findings, even speculative ones — verification comes next.`,
  },
  {
    key: 'database',
    prompt: `Scan all database query code for performance issues. Look for:
- N+1 query patterns (loop with query inside, missing eager loading)
- Missing indexes on frequently filtered/sorted columns
- SELECT * with large tables
- Missing pagination on list endpoints
- Unbounded queries that could return millions of rows
- Missing query timeouts
Return ALL findings, even speculative ones — verification comes next.`,
  },
  {
    key: 'api',
    prompt: `Scan API/server code for performance issues. Look for:
- Synchronous I/O blocking the event loop
- Missing caching on expensive computations or external calls
- Sequential awaits that could be parallelized
- Missing response compression
- Unbounded payloads (no size limits on request bodies)
- Slow middleware running on every request
Return ALL findings, even speculative ones — verification comes next.`,
  },
  {
    key: 'network',
    prompt: `Scan for network-layer performance issues. Look for:
- Missing HTTP caching headers on static assets
- Over-fetching (fetching full objects when only fields needed)
- Missing CDN hints or asset optimization config
- Multiple waterfalled requests that could be merged
- Missing connection pooling config
Return ALL findings, even speculative ones — verification comes next.`,
  },
]

phase('Scan')
const scanResults = await pipeline(
  SCANNERS,
  s => agent(s.prompt, { label: `scan:${s.key}`, phase: 'Scan', schema: SCAN_SCHEMA }),
)

const allFindings = scanResults
  .filter(Boolean)
  .flatMap(r => r.findings)

log(`Found ${allFindings.length} candidates across ${SCANNERS.length} layers`)

if (allFindings.length === 0) {
  log('No findings — codebase looks clean or has no scannable perf surface')
  return { confirmed: [], skipped: 'no findings' }
}

phase('Verify')
const verified = await pipeline(
  allFindings,
  (f, _, i) => agent(
    `Adversarially verify this performance finding — try to REFUTE it. Default to confirmed=false if uncertain.

Finding: ${f.issue}
File: ${f.file}${f.line ? `:${f.line}` : ''}
Layer: ${f.layer}
Estimated impact: ${f.estimated_impact}
Fix hint: ${f.fix_hint}

Is this a REAL bottleneck in THIS codebase, not a theoretical one? Could it be a false positive?
If the code pattern exists but won't actually run in hot paths, say so.`,
    { label: `verify:${i}`, phase: 'Verify', schema: VERDICT_SCHEMA },
  ).then(v => v ? { ...f, verdict: v } : null),
)

const confirmed = verified
  .filter(Boolean)
  .filter(f => f.verdict.confirmed && f.verdict.revised_impact !== 'dismiss')
  .map(f => ({ ...f, impact: f.verdict.revised_impact }))
  .sort((a, b) => ['critical','high','medium','low'].indexOf(a.impact) - ['critical','high','medium','low'].indexOf(b.impact))

phase('Report')
const report = await agent(
  `Write a concise performance audit report for a senior developer.

Confirmed findings (${confirmed.length}):
${JSON.stringify(confirmed, null, 2)}

Format: grouped by impact level (critical → low). For each finding: file:line, what the issue is, why it matters, one-line fix. No fluff.`,
  { label: 'report', phase: 'Report' },
)

log(`Confirmed: ${confirmed.length} real issues (${confirmed.filter(f => f.impact === 'critical').length} critical, ${confirmed.filter(f => f.impact === 'high').length} high)`)

return { report, confirmed }
