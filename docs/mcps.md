# 🔗 MCPs Catalog

Model Context Protocol servers give Claude Code live access to external tools and data sources.

---

## Direct MCP installs

These are installed via `claude mcp add --scope project`, which writes to `.mcp.json` in your project root.

| MCP | Category | Install Command | Description |
|---|---|---|---|
| `flutter-mcp` | Flutter | `npx -y flutter-mcp` | Flutter documentation and widget reference server |
| `XcodeBuildMCP` | Swift | `npx -y xcodebuildmcp@latest` | Xcode build system, simulator control, and device management |
| `jupyter` | Extras | `uvx jupyter-mcp-server` | Jupyter notebook read/write, kernel execution, and cell management |

### What gets written to `.mcp.json`

```json
{
  "mcpServers": {
    "flutter-mcp": {
      "command": "npx",
      "args": ["-y", "flutter-mcp"]
    },
    "XcodeBuildMCP": {
      "command": "npx",
      "args": ["-y", "xcodebuildmcp@latest"]
    },
    "jupyter": {
      "command": "uvx",
      "args": ["jupyter-mcp-server"]
    }
  }
}
```

---

## Plugin-bundled MCPs

Some plugins from `claude-plugins-official` ship their own MCP server as part of the bundle. When you install the plugin with `--scope project`, the MCP is automatically available in that project's Claude Code session.

| Plugin | Bundled MCP | What it provides |
|---|---|---|
| `supabase` | Supabase MCP | Query databases, manage storage, handle auth, run migrations |
| `chrome-devtools-mcp` | Chrome DevTools MCP | Inspect DOM, capture network, run JS in the browser from Claude Code |
| `firecrawl` | Firecrawl MCP | Scrape URLs, crawl sites, extract structured content |
| `playwright` | Playwright MCP | Drive a real browser: click, fill forms, screenshot, assert |

---

## Direct vs Plugin-bundled — what's the difference?

| | Direct (`claude mcp add`) | Plugin-bundled |
|---|---|---|
| **Config location** | `.mcp.json` in project root | Managed by the plugin system |
| **Visibility** | `claude mcp list` | `claude plugin list` |
| **Transport** | stdio (subprocess) | Depends on plugin |
| **Update** | Re-run `claude mcp add` | `claude plugin update <name>` |
| **When to use** | Standalone MCP servers (npm/uvx packages) | When the MCP is tightly coupled to a skill set |

For Flutter and Swift, direct MCPs are used because no official plugin bundle exists yet. For Supabase, Playwright, Firecrawl, and Chrome DevTools, the plugin is the canonical install path — it bundles docs, skills, and the MCP in one.
