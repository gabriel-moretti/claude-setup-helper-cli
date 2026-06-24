import type { Category, CatalogItem } from './types.js'

const OFFICIAL = 'claude-plugins-official'

export const LANGUAGES: Category[] = [
  {
    key: 'typescript',
    label: 'TypeScript',
    items: [
      {
        label: 'typescript-best-practices',
        method: 'skill',
        // formerly 0xbigboss/claude-code, renamed
        skill: { org: 'alleneubank', repo: 'claude-code', subdir: '.claude/skills/typescript-best-practices' },
      },
      {
        label: 'code-simplifier (plugin)',
        method: 'plugin',
        plugin: { name: 'code-simplifier', marketplace: OFFICIAL },
      },
    ],
    qa: [
      {
        label: 'vitest (testing skill)',
        method: 'skill',
        // TODO: verify repo — no canonical 'vitest-testing'; using personal dotfiles
        skill: { org: 'mcclowes', repo: 'omg', subdir: '.claude/skills/vitest' },
      },
    ],
  },
  {
    key: 'python',
    label: 'Python',
    items: [
      {
        label: 'python-best-practices',
        method: 'skill',
        skill: { org: 'alleneubank', repo: 'claude-code', subdir: '.claude/skills/python-best-practices' },
      },
    ],
    qa: [
      {
        label: 'python-testing-patterns',
        method: 'skill',
        skill: { org: 'wshobson', repo: 'agents', subdir: 'plugins/python-development/skills/python-testing-patterns' },
      },
    ],
  },
  {
    key: 'flutter',
    label: 'Flutter',
    items: [
      {
        label: 'flutter-best-practices',
        method: 'skill',
        // single-skill repo, SKILL.md at root
        skill: { org: 'kaelen2026', repo: 'flutter-best-practices' },
      },
      {
        label: 'dart-flutter-patterns',
        method: 'skill',
        skill: { org: 'affaan-m', repo: 'everything-claude-code', subdir: 'skills/dart-flutter-patterns' },
      },
      {
        label: 'flutter-claude-skills',
        method: 'skill',
        skill: { org: 'Harishwarrior', repo: 'flutter-claude-skills' },
      },
      {
        label: 'flutter-mcp (docs MCP)',
        method: 'mcp',
        mcp: { name: 'flutter-mcp', command: 'npx', args: ['-y', 'flutter-mcp'] },
      },
    ],
    qa: [
      {
        label: 'flutter-tester',
        method: 'skill',
        skill: { org: 'Harishwarrior', repo: 'flutter-claude-skills', subdir: 'flutter-tester' },
      },
    ],
  },
  {
    key: 'swift',
    label: 'Swift',
    items: [
      {
        label: 'ios-swift-skills (swift-concurrency-expert)',
        method: 'skill',
        skill: { org: 'patrickserrano', repo: 'skills', subdir: 'skills/swift-concurrency-expert' },
      },
      {
        label: 'swift-lsp (plugin)',
        method: 'plugin',
        plugin: { name: 'swift-lsp', marketplace: OFFICIAL },
      },
      {
        label: 'XcodeBuildMCP',
        method: 'mcp',
        mcp: { name: 'XcodeBuildMCP', command: 'npx', args: ['-y', 'xcodebuildmcp@latest'] },
      },
    ],
  },
]

export const FRAMEWORKS: Category[] = [
  {
    key: 'nextjs',
    label: 'Next.js',
    items: [
      {
        label: 'nextjs-app-router-patterns',
        method: 'skill',
        skill: { org: 'wshobson', repo: 'agents', subdir: 'plugins/frontend-mobile-development/skills/nextjs-app-router-patterns' },
      },
      {
        label: 'claude-code-nextjs-skills',
        method: 'skill',
        skill: { org: 'laguagu', repo: 'claude-code-nextjs-skills' },
      },
      {
        label: 'shadcn',
        method: 'skill',
        skill: { org: 'laguagu', repo: 'claude-code-nextjs-skills', subdir: 'skills/shadcn' },
      },
      {
        label: 'playwright (plugin)',
        method: 'plugin',
        plugin: { name: 'playwright', marketplace: OFFICIAL },
      },
    ],
  },
  {
    key: 'fastapi',
    label: 'FastAPI',
    items: [
      {
        label: 'fastapi-clean-architecture',
        method: 'skill',
        skill: { org: 'rafaelkamimura', repo: 'claude-tools', subdir: 'skills/fastapi-clean-architecture' },
      },
    ],
  },
]

export const UIUX: Category = {
  key: 'uiux',
  label: 'UI/UX',
  items: [
    {
      label: 'frontend-design (plugin)',
      method: 'plugin',
      plugin: { name: 'frontend-design', marketplace: OFFICIAL },
    },
    {
      label: 'impeccable',
      method: 'skill',
      skill: { org: 'pbakaus', repo: 'impeccable', subdir: '.claude-plugin/.agents/skills/impeccable' },
    },
  ],
}

export const DEVOPS: Category[] = [
  {
    key: 'aws',
    label: 'AWS',
    items: [
      { label: 'aws-core (plugin)', method: 'plugin', plugin: { name: 'aws-core', marketplace: OFFICIAL } },
      { label: 'aws-serverless (plugin)', method: 'plugin', plugin: { name: 'aws-serverless', marketplace: OFFICIAL } },
      { label: 'deploy-on-aws (plugin)', method: 'plugin', plugin: { name: 'deploy-on-aws', marketplace: OFFICIAL } },
    ],
  },
  {
    key: 'supabase',
    label: 'Supabase',
    items: [
      { label: 'supabase (plugin)', method: 'plugin', plugin: { name: 'supabase', marketplace: OFFICIAL } },
    ],
  },
]

export const EXTRAS: { mcps: CatalogItem[]; skills: CatalogItem[] } = {
  mcps: [
    { label: 'chrome-devtools-mcp (plugin)', method: 'plugin', plugin: { name: 'chrome-devtools-mcp', marketplace: OFFICIAL } },
    { label: 'firecrawl (plugin)', method: 'plugin', plugin: { name: 'firecrawl', marketplace: OFFICIAL } },
    { label: 'Jupyter MCP', method: 'mcp', mcp: { name: 'jupyter', command: 'uvx', args: ['jupyter-mcp-server'] } },
  ],
  skills: [
    { label: 'superpowers (plugin)', method: 'plugin', plugin: { name: 'superpowers', marketplace: OFFICIAL } },
    {
      label: 'error-handling-patterns',
      method: 'skill',
      skill: { org: 'wshobson', repo: 'agents', subdir: 'plugins/agents/skills/error-handling-patterns' },
    },
    {
      label: 'audit (impeccable)',
      method: 'skill',
      skill: { org: 'pbakaus', repo: 'impeccable', subdir: 'skills/audit' },
    },
    {
      label: 'optimize (impeccable)',
      method: 'skill',
      skill: { org: 'pbakaus', repo: 'impeccable', subdir: 'skills/optimize' },
    },
    {
      label: 'webgpu',
      method: 'skill',
      skill: { org: 'dgreenheck', repo: 'webgpu-claude-skill', subdir: 'skills/webgpu-threejs-tsl' },
    },
    {
      label: 'ui-ux-pro-max (plugin)',
      method: 'plugin',
      plugin: { name: 'ui-ux-pro-max', marketplace: 'ui-ux-pro-max-skill' },
    },
    {
      label: 'awesome-design',
      method: 'skill',
      // TODO: verify repo
      skill: { org: 'bergside', repo: 'awesome-design-skills' },
    },
  ],
}
