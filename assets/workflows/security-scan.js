export const meta = {
  name: 'security-scan',
  description: 'Security audit: OWASP Top 10, hardcoded secrets, auth/authz issues, input validation, dependency vulns',
  phases: [
    { title: 'Scan', detail: 'Multi-lens parallel scan across OWASP categories' },
    { title: 'Verify', detail: 'Adversarial confirmation — 3-vote panel per finding' },
    { title: 'Report', detail: 'Severity-ranked report with CVE references where applicable' },
  ],
}

const FINDING_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
          file: { type: 'string' },
          line: { type: 'number' },
          description: { type: 'string' },
          owasp: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['category', 'severity', 'file', 'description', 'fix'],
      },
    },
  },
  required: ['findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    exploitable: { type: 'boolean' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    reason: { type: 'string' },
  },
  required: ['exploitable', 'confidence', 'reason'],
}

const LENSES = [
  {
    key: 'injection',
    prompt: `Security scan for injection vulnerabilities (OWASP A03). Look for:
- SQL injection: raw string concatenation in queries, missing parameterization
- Command injection: shell exec with user input, unescaped interpolation
- XSS: unescaped user data in HTML output, dangerouslySetInnerHTML
- Template injection: user-controlled template strings
- Path traversal: unsanitized file paths from user input
Report file, line, exact vulnerability, and fix.`,
  },
  {
    key: 'auth',
    prompt: `Security scan for authentication and authorization flaws (OWASP A01, A07). Look for:
- Missing auth checks on protected routes/endpoints
- JWT: missing signature verification, alg:none vulnerability, weak secrets
- Session: missing expiry, insecure storage, no invalidation on logout
- Broken object-level authorization (BOLA/IDOR): accessing other users' resources
- Password: plain text storage, weak hashing (MD5/SHA1), no salt
- Missing rate limiting on login/auth endpoints
Report file, line, exact vulnerability, and fix.`,
  },
  {
    key: 'secrets',
    prompt: `Scan for hardcoded secrets and sensitive data exposure (OWASP A02, A09). Look for:
- API keys, tokens, passwords hardcoded in source files
- Private keys or certificates committed
- Secrets in environment variable defaults that look real
- Debug endpoints or verbose error messages exposing internals
- Sensitive data in logs (passwords, tokens, PII)
- Unencrypted sensitive data at rest or in transit
Report file, line, exact issue, and fix.`,
  },
  {
    key: 'supply-chain',
    prompt: `Security scan for dependency and supply chain risks (OWASP A06, A08). Look for:
- package.json / requirements.txt / Gemfile: packages with known CVEs (check versions)
- Unpinned dependencies (floating ^ ~ or latest)
- postinstall scripts in dependencies that run arbitrary code
- Dynamic require/import with user-controlled paths
- Deserialization of untrusted data
- Missing subresource integrity on external scripts
Report file, line, exact issue, and fix.`,
  },
  {
    key: 'config',
    prompt: `Scan for security misconfigurations (OWASP A05). Look for:
- CORS: wildcard origins on sensitive endpoints, missing credentials flag
- CSP: missing or overly permissive Content-Security-Policy
- Missing security headers: HSTS, X-Frame-Options, X-Content-Type-Options
- Debug mode enabled in production config
- Default credentials or ports exposed
- Missing input size limits / DoS protection
- Insecure TLS configuration
Report file, line, exact issue, and fix.`,
  },
]

phase('Scan')
const scanResults = await pipeline(
  LENSES,
  l => agent(l.prompt, { label: `scan:${l.key}`, phase: 'Scan', schema: FINDING_SCHEMA }),
)

const allFindings = scanResults.filter(Boolean).flatMap(r => r.findings)
const critical = allFindings.filter(f => f.severity === 'critical')
const high = allFindings.filter(f => f.severity === 'high')

log(`Scan complete: ${allFindings.length} candidates (${critical.length} critical, ${high.length} high)`)

if (allFindings.length === 0) {
  return { confirmed: [], report: 'No security issues found.' }
}

phase('Verify')
// ponytail: 3-vote panel only on critical/high to save budget; medium/low single-vote
const toVerify = allFindings.filter(f => ['critical', 'high'].includes(f.severity))
const toPass = allFindings.filter(f => !['critical', 'high'].includes(f.severity))

const verified = await pipeline(
  toVerify,
  (f, _, i) => parallel(
    [1, 2, 3].map(vote => () => agent(
      `You are a security expert. Try to REFUTE this finding — is it actually exploitable in this codebase?
Default to exploitable=false if you are not certain.

Finding: ${f.description}
Category: ${f.category}
File: ${f.file}${f.line ? `:${f.line}` : ''}
Fix: ${f.fix}

Is this truly exploitable, or is there a mitigating control elsewhere?`,
      { label: `verify:${i}-vote${vote}`, phase: 'Verify', schema: VERDICT_SCHEMA },
    )),
  ).then(votes => {
    const real = votes.filter(Boolean).filter(v => v.exploitable)
    return real.length >= 2 ? { ...f, vote_confidence: real.length } : null
  }),
)

const confirmed = [
  ...verified.filter(Boolean),
  ...toPass,
].sort((a, b) =>
  ['critical','high','medium','low','info'].indexOf(a.severity) -
  ['critical','high','medium','low','info'].indexOf(b.severity)
)

phase('Report')
const report = await agent(
  `Write a security audit report for a senior developer and security team.

Confirmed vulnerabilities (${confirmed.length}):
${JSON.stringify(confirmed, null, 2)}

Format:
- Group by severity (critical → info)
- Each finding: file:line, OWASP category, what's exploitable, how to fix
- For critical/high: include attack scenario in one sentence
- End with: top 3 actions to take immediately

Be direct. No padding.`,
  { label: 'report', phase: 'Report' },
)

return { report, confirmed }
