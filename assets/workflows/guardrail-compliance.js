export const meta = {
  name: 'guardrail-compliance',
  description: 'Audit a repo against personal baserules/guardrails: one agent per applicable rule file, adversarial verify, severity-ranked report',
  whenToUse: 'Deep compliance audit of a codebase against ~/Personal-Projects/claude rules. args: { repo: "<abs path>" } (defaults to cwd).',
  phases: [
    { title: 'Detect', detail: 'Stack detection → applicable rule files' },
    { title: 'Audit', detail: 'One agent per rule file, evidence required' },
    { title: 'Verify', detail: 'Adversarial refutation of NEVER/MUST findings' },
    { title: 'Report', detail: 'Severity-ranked table + top fixes' },
  ],
}

const RULES_DIR = '/Users/moretti/Personal-Projects/claude/.claude'
const REPO = (args && args.repo) || '.'

const DETECT_SCHEMA = {
  type: 'object',
  properties: {
    stack: { type: 'array', items: { type: 'string' } },
    rule_files: {
      type: 'array',
      items: { type: 'string' },
      description: 'Absolute paths of applicable rule files',
    },
  },
  required: ['stack', 'rule_files'],
}

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['never', 'must', 'should'] },
          rule_file: { type: 'string' },
          rule: { type: 'string', description: 'The specific MUST/NEVER item violated' },
          location: { type: 'string', description: 'path:line' },
          violation: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'rule_file', 'rule', 'location', 'violation', 'fix'],
      },
    },
    checked: { type: 'array', items: { type: 'string' }, description: 'Rule sections actually checked' },
    skipped: { type: 'array', items: { type: 'string' }, description: 'Sections not checkable + why' },
  },
  required: ['findings', 'checked', 'skipped'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    real: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['real', 'reason'],
}

phase('Detect')
const detection = await agent(
  `Detect the stack of the repository at ${REPO} and select applicable rule files.

1. Inspect manifests only (package.json, pyproject.toml, requirements*.txt, pubspec.yaml, supabase/ dir, Dockerfile, docker-compose*, .github/workflows/, cdk.json, CloudFormation templates, LLM SDK deps like anthropic/@anthropic-ai).
2. List the rule files in ${RULES_DIR}/baserules/ and ${RULES_DIR}/guardrails/.
3. Always include every baserules/*.md file. From guardrails/, include ONLY files matching the detected stack (e.g. flutter.md only if pubspec.yaml exists; docker.md only if a Dockerfile exists).

Return the detected stack labels and the absolute paths of applicable rule files.`,
  { label: 'detect-stack', phase: 'Detect', schema: DETECT_SCHEMA },
)

if (!detection || detection.rule_files.length === 0) {
  return { error: 'Stack detection failed or no applicable rules.' }
}
log(`Stack: ${detection.stack.join(', ')} — ${detection.rule_files.length} rule files apply`)

// pipeline: each rule file audits then verifies independently, no barrier
const results = await pipeline(
  detection.rule_files,
  ruleFile => agent(
    `You audit the repository at ${REPO} against ONE rule file: ${ruleFile}

1. Read the rule file fully.
2. For each MUST and NEVER item (and material SHOULD items), check the repo for violations. Read actual code — a finding without path:line evidence is invalid.
3. Ignore paths that are gitignored, vendored (node_modules, .venv, build output), or generated.
4. Report every violation with: severity (never|must|should), the exact rule item, path:line, what is wrong, one-line fix.
5. Also report which rule sections you checked and which you could not check (and why) — no silent coverage gaps.`,
    { label: `audit:${ruleFile.split('/').pop()}`, phase: 'Audit', schema: FINDINGS_SCHEMA },
  ),
  (audit, ruleFile) => {
    if (!audit) return null
    const toVerify = audit.findings.filter(f => f.severity !== 'should')
    const pass = audit.findings.filter(f => f.severity === 'should')
    return parallel(toVerify.map(f => () =>
      agent(
        `Adversarially verify this compliance finding in the repo at ${REPO}. Try to REFUTE it — read the code at the location and check for mitigating controls elsewhere (middleware, RLS, CI checks, wrapper functions). Default to real=false if uncertain.

Rule: ${f.rule} (${f.rule_file})
Location: ${f.location}
Claimed violation: ${f.violation}`,
        { label: `verify:${f.location}`, phase: 'Verify', schema: VERDICT_SCHEMA },
      ).then(v => (v && v.real ? { ...f, verified: true } : null)),
    )).then(verified => ({
      findings: [...verified.filter(Boolean), ...pass],
      checked: audit.checked,
      skipped: audit.skipped,
    }))
  },
)

const all = results.filter(Boolean)
const confirmed = all.flatMap(r => r.findings)
  .sort((a, b) => ['never', 'must', 'should'].indexOf(a.severity) - ['never', 'must', 'should'].indexOf(b.severity))
const skipped = all.flatMap(r => r.skipped)

log(`${confirmed.length} confirmed findings (${confirmed.filter(f => f.severity === 'never').length} NEVER-level)`)

phase('Report')
const report = await agent(
  `Write a guardrail-compliance report for a senior developer.

Confirmed findings (${confirmed.length}):
${JSON.stringify(confirmed, null, 2)}

Coverage gaps (rule sections that could not be checked):
${JSON.stringify(skipped, null, 2)}

Format:
- Markdown table ordered by severity: | Severity | Rule | Location | Violation | Fix |
- Severity markers: 🔴 NEVER, 🟠 MUST, 🟡 SHOULD
- Then: top 3 fixes by risk, one paragraph each
- Then: coverage gaps listed honestly
Be direct. No padding.`,
  { label: 'report', phase: 'Report' },
)

return { report, confirmed, skipped }
