# 🧠 Skills Catalog

Skills are fetched directly from GitHub and installed into `.claude/skills/<name>/` in your project. No global install.

> **QA Only** skills are opt-in — the tool asks per-language if you want testing patterns included.

---

| Skill | Category | QA Only | Source | Description |
|---|---|:---:|---|---|
| `typescript-best-practices` | TypeScript | — | [jwynia/agent-skills](https://github.com/jwynia/agent-skills) | TypeScript idioms, patterns, and best practices for Claude Code |
| `python-best-practices` | Python | — | [alleneubank/claude-code](https://github.com/alleneubank/claude-code) | Python conventions, typing, and project structure patterns |
| `python-testing-patterns` | Python | ✅ | [wshobson/agents](https://github.com/wshobson/agents) | pytest patterns, fixtures, mocking, and test organization |
| `flutter-best-practices` | Flutter | — | [kaelen2026/flutter-best-practices](https://github.com/kaelen2026/flutter-best-practices) | Flutter widget patterns, state management, and performance tips |
| `dart-flutter-patterns` | Flutter | — | [affaan-m/ECC](https://github.com/affaan-m/ECC) | Dart language patterns and Flutter architecture idioms |
| `flutter-tester` | Flutter | ✅ | [Harishwarrior/flutter-claude-skills](https://github.com/Harishwarrior/flutter-claude-skills) | Flutter widget testing and integration test patterns |
| `patrol-e2e-testing` | Flutter | ✅ | [evanca/flutter-ai-rules](https://github.com/evanca/flutter-ai-rules) | Patrol end-to-end tests (native dialogs, permissions) |
| `owasp-mobile-security-checker` | Flutter → iOS/Android | — | [Harishwarrior/flutter-claude-skills](https://github.com/Harishwarrior/flutter-claude-skills) | OWASP Mobile Top 10 audit: storage, network, secrets, dependencies |
| `riverpod` / `bloc` / `provider` | Flutter → state (pick one) | — | [evanca/flutter-ai-rules](https://github.com/evanca/flutter-ai-rules) | State-management rules for the chosen approach |
| `ios-swift-skills` (swift-concurrency-expert) | Swift | — | [patrickserrano/skills](https://github.com/patrickserrano/skills) | Swift concurrency (async/await, actors, structured concurrency) |
| `nextjs-app-router-patterns` | Next.js | — | [wshobson/agents](https://github.com/wshobson/agents) | Next.js 14+ App Router, RSC, and server action patterns |
| `claude-code-nextjs-skills` | Next.js | — | [laguagu/claude-code-nextjs-skills](https://github.com/laguagu/claude-code-nextjs-skills) | Comprehensive Next.js skill bundle for Claude Code |
| `shadcn` | Next.js | — | [laguagu/claude-code-nextjs-skills](https://github.com/laguagu/claude-code-nextjs-skills) | shadcn/ui component patterns and Radix UI integration |
| `fastapi-clean-architecture` | FastAPI | — | [rafaelkamimura/claude-tools](https://github.com/rafaelkamimura/claude-tools) | FastAPI project structure, dependency injection, and async patterns |
| `impeccable` | UI/UX | — | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Design quality and UI polish skill |
| `error-handling-patterns` | Extras | — | [wshobson/agents](https://github.com/wshobson/agents) | Robust error handling patterns across languages and frameworks |
| `audit` (impeccable) | Extras | — | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Code audit skill — finds issues and improvement opportunities |
| `optimize` (impeccable) | Extras | — | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Code optimization skill — performance and efficiency improvements |
| `webgpu` | Extras | — | [dgreenheck/webgpu-claude-skill](https://github.com/dgreenheck/webgpu-claude-skill) | WebGPU and Three.js TSL shader development patterns |
| `awesome-design` | Extras | — | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | Curated design principles, patterns, and references |

---

## How skills are installed

```
GitHub: https://github.com/<org>/<repo>/archive/refs/heads/main.tar.gz
         ↓ download + extract
         ↓ (if monorepo) copy subdir only
         → .claude/skills/<skill-name>/
```

For monorepos (e.g. `wshobson/agents` hosts multiple skills), only the relevant subfolder is extracted. For single-skill repos, the whole repo content is copied.
