export type InstallMethod = 'plugin' | 'skill' | 'mcp'

export interface SkillSource {
  org: string
  repo: string
  ref?: string        // branch/tag, default 'main'
  subdir?: string     // if monorepo, path to skill folder within repo
}

export interface PluginSource {
  name: string        // plugin name
  marketplace: string // e.g. 'claude-plugins-official'
}

export interface McpSource {
  name: string
  command: string     // e.g. 'npx'
  args: string[]      // e.g. ['-y', '@package/name']
}

export interface CatalogItem {
  label: string
  method: InstallMethod
  skill?: SkillSource
  plugin?: PluginSource
  mcp?: McpSource
}

export interface Category {
  key: string
  label: string
  items: CatalogItem[]
  qa?: CatalogItem[]  // optional QA items asked per-language
}

export type InstallResult = {
  label: string
  success: boolean
  error?: string
}
