# 🔌 Plugins Catalog

Plugins are installed per-project using:

```bash
claude plugin install <name>@<marketplace> --scope project
```

Nothing is added to your global `~/.claude/` config.

---

| Plugin | Category | Marketplace | Description |
|---|---|---|---|
| `code-simplifier` | TypeScript | claude-plugins-official | Simplifies and refines code — reduces complexity, improves readability |
| `swift-lsp` | Swift | claude-plugins-official | Swift Language Server Protocol integration for accurate completions and diagnostics |
| `playwright` | Next.js | claude-plugins-official | Browser automation, end-to-end testing, and MCP integration for Playwright |
| `frontend-design` | UI/UX | claude-plugins-official | Design system patterns, component architecture, and frontend best practices |
| `aws-core` | AWS | claude-plugins-official | Core AWS SDK skills: CDK, IAM, Bedrock, Lambda, S3, Secrets Manager, and more |
| `aws-serverless` | AWS | claude-plugins-official | Serverless patterns: Lambda, API Gateway, Step Functions, event-driven architecture |
| `deploy-on-aws` | AWS | claude-plugins-official | AWS deployment infrastructure, CI/CD pipelines, and release patterns |
| `supabase` | Supabase | claude-plugins-official | Official Supabase bundle — includes MCP server + database + auth skills |
| `chrome-devtools-mcp` | Extras | claude-plugins-official | Chrome DevTools MCP integration for browser debugging from Claude Code |
| `firecrawl` | Extras | claude-plugins-official | Web scraping, crawling, and content extraction via Firecrawl MCP |
| `superpowers` | Extras | claude-plugins-official | General-purpose Claude Code superpowers — enhanced capabilities and shortcuts |
| `ui-ux-pro-max` | Extras | ui-ux-pro-max-skill | Advanced UI/UX design skill set from the nextlevelbuilder marketplace |

---

## Notes

**`aws-core`** is a large bundle. It includes skills for: AWS SDK (JS/Python/Swift), CDK, IAM, Bedrock, CloudFormation, Lambda, containers, observability, Secrets Manager, and billing. You get all of them when you select AWS.

**`supabase`** is the official Anthropic × Supabase bundle. It includes the Supabase MCP server (database queries, storage, auth) plus companion skills. Installing this plugin covers both the MCP and documentation skills in one shot.

**`ui-ux-pro-max`** is installed from the `ui-ux-pro-max-skill` marketplace (GitHub: `nextlevelbuilder/ui-ux-pro-max-skill`), which must be registered in your Claude Code marketplaces. If you haven't added it, run:

```bash
claude plugin marketplace add ui-ux-pro-max-skill --url https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
```
