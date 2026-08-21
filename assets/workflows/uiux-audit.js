export const meta = {
  name: 'uiux-audit',
  description: 'UI/UX quality audit: accessibility, responsive design, component consistency, user flow, typography/color/spacing',
  phases: [
    { title: 'Analyze', detail: 'Multi-lens review of UI/UX quality across dimensions' },
    { title: 'Prioritize', detail: 'Impact-ranked issues with effort estimates' },
    { title: 'Report', detail: 'Actionable report with concrete fixes, not opinions' },
  ],
}

const ISSUE_SCHEMA = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dimension: { type: 'string' },
          impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' },
          description: { type: 'string' },
          user_impact: { type: 'string' },
          fix: { type: 'string' },
          effort: { type: 'string', enum: ['xs', 's', 'm', 'l'] },
        },
        required: ['dimension', 'impact', 'file', 'description', 'user_impact', 'fix', 'effort'],
      },
    },
  },
  required: ['issues'],
}

const DIMENSIONS = [
  {
    key: 'accessibility',
    prompt: `Audit UI/UX code for accessibility issues (WCAG 2.1 AA). Look for:
- Missing or wrong ARIA roles/labels on interactive elements
- Images without alt text (or wrong alt text)
- Color contrast issues (text/background < 4.5:1 ratio)
- Keyboard navigation: missing focus styles, focus traps, tab order issues
- Form inputs without associated labels
- Interactive elements that only work with mouse (no keyboard/touch equivalent)
- Missing skip links or landmark regions
- Animations without prefers-reduced-motion support
For each: file, what's broken, why it matters (which users affected), and exact fix.`,
  },
  {
    key: 'responsive',
    prompt: `Audit UI/UX code for responsive design issues. Look for:
- Fixed pixel widths that break on mobile (<768px)
- Missing viewport meta tag or incorrect configuration
- Touch targets smaller than 44x44px
- Overflow issues (horizontal scroll on mobile)
- Text that doesn't scale with system font size
- Images/media without responsive constraints
- Flexbox/Grid layouts that stack poorly on small screens
- Missing breakpoints for tablet/mobile
For each: file, what breaks at which viewport, and fix.`,
  },
  {
    key: 'consistency',
    prompt: `Audit UI/UX code for design inconsistency. Look for:
- Hardcoded colors/spacing/fonts instead of design tokens or CSS variables
- Multiple conflicting button styles for the same action type
- Inconsistent spacing (some places use 8px grid, others don't)
- Mixed icon sets or icon sizing inconsistency
- Loading states missing for some async operations but present for others
- Error/empty states missing in some components
- Inconsistent component naming patterns
For each: file, what's inconsistent, what the standard should be, and fix.`,
  },
  {
    key: 'flow',
    prompt: `Audit UI/UX code for user flow and interaction quality issues. Look for:
- Missing loading states or skeleton screens on async operations
- Missing error feedback (silent failures, generic error messages)
- Missing success feedback after destructive or important actions
- Confirmation dialogs missing on irreversible actions (delete, submit)
- Forms: missing validation feedback, unclear required field indicators
- Navigation dead ends (no back button, no breadcrumbs on deep pages)
- Confusing CTAs (multiple primary actions competing, unclear button labels)
- Missing empty states for lists/tables that could have no data
For each: file, what user friction is caused, and fix.`,
  },
]

phase('Analyze')
const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, { label: `analyze:${d.key}`, phase: 'Analyze', schema: ISSUE_SCHEMA }),
)

const allIssues = results.filter(Boolean).flatMap(r => r.issues)

log(`Found ${allIssues.length} issues across ${DIMENSIONS.length} dimensions`)

if (allIssues.length === 0) {
  return { issues: [], report: 'No UI/UX issues found.' }
}

phase('Prioritize')
// Score: impact weight × effort weight → quick wins first
const impactScore = { critical: 4, high: 3, medium: 2, low: 1 }
const effortScore = { xs: 4, s: 3, m: 2, l: 1 } // high score = low effort = quick win
const scored = allIssues
  .map(i => ({ ...i, score: impactScore[i.impact] * effortScore[i.effort] }))
  .sort((a, b) => b.score - a.score)

const quickWins = scored.filter(i => i.score >= 9) // high impact, low effort
const strategic = scored.filter(i => i.score < 9 && i.score >= 4)
const backlog = scored.filter(i => i.score < 4)

log(`Quick wins: ${quickWins.length} | Strategic: ${strategic.length} | Backlog: ${backlog.length}`)

phase('Report')
const report = await agent(
  `Write a UI/UX audit report for a product/engineering team.

Quick Wins (high impact, low effort) — ${quickWins.length} issues:
${JSON.stringify(quickWins.slice(0, 10), null, 2)}

Strategic (important but more effort) — ${strategic.length} issues:
${JSON.stringify(strategic.slice(0, 8), null, 2)}

Backlog — ${backlog.length} issues (summarize, don't list all)

Format:
- Lead with quick wins — these are the immediate action items
- For each quick win: file, what to fix, exact code change or pattern
- Strategic items: group by dimension, describe the pattern to fix (not every instance)
- End with: one paragraph on the biggest UX risk to address this sprint

Write for a developer who will implement the fixes, not a product manager. Be specific.`,
  { label: 'report', phase: 'Report' },
)

return { report, quickWins, strategic, backlog }
