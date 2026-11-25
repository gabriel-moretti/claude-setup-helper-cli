import type { Category, CatalogItem } from './types.js'

const OFFICIAL = 'claude-plugins-official'

// Compartilhados entre categorias; labels idênticos permitem o dedupe no install.
const XCODE_BUILD_MCP: CatalogItem = {
  label: 'XcodeBuildMCP',
  method: 'mcp',
  mcp: { name: 'XcodeBuildMCP', command: 'npx', args: ['-y', 'xcodebuildmcp@latest'] },
}

const MOBILE_MCP: CatalogItem = {
  label: 'mobile-mcp (simulador/emulador)',
  method: 'mcp',
  mcp: { name: 'mobile-mcp', command: 'npx', args: ['-y', '@mobilenext/mobile-mcp@latest'] },
}

const OWASP_MOBILE: CatalogItem = {
  label: 'owasp-mobile-security-checker',
  method: 'skill',
  skill: { org: 'Harishwarrior', repo: 'flutter-claude-skills', subdir: 'owasp-mobile-security-checker' },
}

export const LANGUAGES: Category[] = [
  {
    key: 'typescript',
    label: 'TypeScript',
    items: [
      {
        label: 'typescript-best-practices',
        method: 'skill',
        skill: { org: 'jwynia', repo: 'agent-skills', subdir: 'skills/tech/development/tooling/typescript-best-practices' },
      },
      {
        label: 'code-simplifier (plugin)',
        method: 'plugin',
        plugin: { name: 'code-simplifier', marketplace: OFFICIAL },
      },
    ],
    // TODO: add vitest-testing when correct repo is found
    qa: [],
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
        // plugin oficial: skills Flutter/Dart + Dart MCP server (exige Dart SDK >= 3.9 no PATH)
        label: 'dart-flutter (plugin oficial + Dart MCP)',
        method: 'plugin',
        plugin: { name: 'dart-flutter', marketplace: 'dart-flutter', repo: 'flutter/agent-plugins' },
      },
      {
        label: 'flutter-best-practices',
        method: 'skill',
        // single-skill repo, SKILL.md at root
        skill: { org: 'kaelen2026', repo: 'flutter-best-practices' },
      },
      {
        label: 'dart-flutter-patterns',
        method: 'skill',
        skill: { org: 'affaan-m', repo: 'ECC', subdir: 'skills/dart-flutter-patterns' },
      },
    ],
    qa: [
      {
        label: 'flutter-tester',
        method: 'skill',
        skill: { org: 'Harishwarrior', repo: 'flutter-claude-skills', subdir: 'flutter-tester' },
      },
      {
        label: 'patrol-e2e-testing',
        method: 'skill',
        skill: { org: 'evanca', repo: 'flutter-ai-rules', subdir: 'skills/patrol-e2e-testing' },
      },
    ],
    guardrails: ['frontend.md', 'flutter.md'],
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
      XCODE_BUILD_MCP,
    ],
  },
]

// Perguntado só quando Flutter é selecionado: um item por plataforma alvo.
export const FLUTTER_TARGETS: Category[] = [
  {
    key: 'ios',
    label: 'iOS',
    items: [XCODE_BUILD_MCP, MOBILE_MCP, OWASP_MOBILE],
    guardrails: ['flutter-mobile.md'],
  },
  {
    key: 'android',
    label: 'Android',
    items: [MOBILE_MCP, OWASP_MOBILE],
    guardrails: ['flutter-mobile.md'],
  },
  {
    key: 'web',
    label: 'Web',
    items: [{ label: 'playwright (plugin)', method: 'plugin', plugin: { name: 'playwright', marketplace: OFFICIAL } }],
    guardrails: ['flutter-web.md'],
  },
  {
    key: 'desktop',
    label: 'Desktop (macOS / Windows / Linux)',
    items: [],
    guardrails: ['flutter-desktop.md'],
  },
]

// Perguntado só quando Flutter é selecionado: escolha única, 'none' não instala nada.
export const FLUTTER_STATE: Category[] = [
  {
    key: 'riverpod',
    label: 'Riverpod',
    items: [{ label: 'riverpod', method: 'skill', skill: { org: 'evanca', repo: 'flutter-ai-rules', subdir: 'skills/riverpod' } }],
  },
  {
    key: 'bloc',
    label: 'Bloc',
    items: [{ label: 'bloc', method: 'skill', skill: { org: 'evanca', repo: 'flutter-ai-rules', subdir: 'skills/bloc' } }],
  },
  {
    // VGV também sobe um Dart MCP próprio (duplica o do plugin oficial) e o MCP do very_good CLI
    key: 'bloc-vgv',
    label: 'Bloc + plugin Very Good Ventures',
    items: [
      { label: 'bloc', method: 'skill', skill: { org: 'evanca', repo: 'flutter-ai-rules', subdir: 'skills/bloc' } },
      {
        label: 'vgv-ai-flutter-plugin (plugin)',
        method: 'plugin',
        plugin: {
          name: 'vgv-ai-flutter-plugin',
          marketplace: 'very-good-claude-code-marketplace',
          repo: 'VeryGoodOpenSource/very_good_claude_code_marketplace',
        },
      },
    ],
  },
  {
    key: 'provider',
    label: 'Provider',
    items: [{ label: 'provider', method: 'skill', skill: { org: 'evanca', repo: 'flutter-ai-rules', subdir: 'skills/provider' } }],
  },
  { key: 'none', label: 'Nenhum / outro', items: [] },
]

export const FRAMEWORKS: Category[] = [
  {
    key: 'nextjs',
    label: 'Next.js',
    languages: ['typescript'],
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
    languages: ['python'],
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
      skill: { org: 'pbakaus', repo: 'impeccable', subdir: '.agents/skills/impeccable' },
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
      label: 'python-error-handling',
      method: 'skill',
      skill: { org: 'wshobson', repo: 'agents', subdir: 'plugins/python-development/skills/python-error-handling' },
    },
    {
      label: 'webgpu',
      method: 'skill',
      skill: { org: 'dgreenheck', repo: 'webgpu-claude-skill', subdir: 'skills/webgpu-threejs-tsl' },
    },
    {
      label: 'ui-ux-pro-max (plugin)',
      method: 'plugin',
      plugin: { name: 'ui-ux-pro-max', marketplace: 'ui-ux-pro-max-skill', repo: 'nextlevelbuilder/ui-ux-pro-max-skill' },
    },
    {
      label: 'awesome-design',
      method: 'skill',
      skill: { org: 'VoltAgent', repo: 'awesome-design-md' },
    },
    {
      label: 'Jira Helper',
      method: 'local',
      local: { dir: 'plugins/jira-cards' },
    },
  ],
}
