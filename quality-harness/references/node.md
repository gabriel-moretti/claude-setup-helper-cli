# Stack: node (pnpm + Biome + ESLint + tsc + Vitest)

## Biome × ESLint — no overlap
| Tool | Does | Doesn't |
|---|---|---|
| **Biome** | format, import sorting, general lint | framework rules |
| **ESLint** | framework plugins (`next`, `react-hooks`), type-aware `typescript-eslint` | formatting, rules Biome has |

`eslint-config-biome` last in `eslint.config.mjs` disables duplicated rules. Never Prettier with Biome. Plain lib/backend: Biome only unless type-aware rules are wanted.

## CI script contract (`ci.yml` calls these)
From `assets/node/package.scripts.json`: `format:check` (`biome format .`), `lint` (`biome lint . && eslint . --max-warnings=0`), `typecheck` (`tsc --noEmit`, run if present), `test:coverage` (Vitest, `lcov` reporter → `coverage/lcov.info`). No Vitest coverage thresholds — `coverage.js` is the only gate.

## Setup
1. `pnpm add -D @biomejs/biome eslint typescript-eslint eslint-config-biome typescript vitest @vitest/coverage-v8`; `packageManager` set in `package.json`.
2. `pnpm biome init`, merge `assets/node/biome.json` (validated on Biome 2.6: `"preset": "recommended"`; on schema/deprecation errors run `pnpm biome migrate --write`; `vcs.useIgnoreFile` needs `.gitignore`).
3. Copy `assets/node/eslint.config.mjs`; add framework plugins.
4. `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.
5. `.lefthook/node.yml` ← `assets/node/lefthook.node.yml`; append `assets/node/dependabot.node.yml`.

Frameworks are modules: Next.js → [stacks/nextjs.md](stacks/nextjs.md) (rules source; the `harness-nextjs` skill is scaffolding only), NestJS → [stacks/nestjs.md](stacks/nestjs.md). Tooling stays here: for Next.js add `@next/eslint-plugin-next` + `eslint-plugin-react-hooks` to ESLint.

pnpm workspace: `projects.js` runs node from the root only — root scripts must cover all packages.

## Hooks
pre-commit: `biome check --write` + `eslint --fix` on staged. pre-push: `tsc --noEmit`, `vitest run --changed --passWithNoTests`.

## CI
`pnpm install --frozen-lockfile` · `format:check` · `lint` · `typecheck` · `test:coverage` · `coverage.js` · `pnpm audit --prod --audit-level=high` (warning only).
