---
name: parallel-plan
description: Plan a multi-step task as a dependency graph and execute it with concurrent tiered subagents (Opus plans/validates/merges, Sonnet implements, Haiku/Sonnet write tests, Haiku writes docs). Use when the user runs /parallel-plan or asks to plan + build something with multiple agents in parallel.
---

# Parallel Plan

Improved `writing-plans`: same plan rigor (exact paths, interfaces, no placeholders), but the plan is a **dependency graph executed by concurrent tiered agents**, not a linear checklist. Invoking this skill is the user's opt-in for multi-agent orchestration (Workflow tool).

**Announce at start:** "Using parallel-plan to design and execute this with concurrent agents."

Inherit from `superpowers:writing-plans` (read it if not in context): file-structure-first decomposition, task right-sizing, the No Placeholders rules, self-review checklist. Everything below overrides or extends it.

## Phase 1 — Analysis (Opus, mandatory)

Dispatch an **Opus** agent (or run inline only if the session model is already Opus) to:
1. Understand the task and the code it touches (trace real flows, not guesses).
2. Break into tasks; for each: what it depends on, difficulty, kind (implementation | tests | docs/openapi).
3. Group into **waves**: tasks in the same wave have all deps satisfied AND disjoint file sets (same-wave agents run in parallel worktrees — overlapping files = merge hell; planner must prevent it, the merge agent only handles residue).

## Phase 2 — Detailed plan (Opus, mandatory)

Opus agent writes the full plan to `docs/plans/YYYY-MM-DD-<slug>.md`, following writing-plans task structure (Files / Interfaces / steps with real code / expected outputs) plus per task:

- **Tier** (see table), **Depends on** (task ids), **Wave**, **Kind**
- Commit steps use **emojicommit** format (git-commits.md) — never bare `feat:`
- The plan must **never touch `.env` files** (guardrail hooks block agents that read or edit them). Env var needed? The plan adds it to `.env.example` and tells the user to set the real value.

End of plan: a machine-readable block the executor consumes:

````markdown
## Task Graph
```json
{ "tasks": [
  { "id": "t1", "title": "...", "deps": [], "tier": "sonnet-medium", "kind": "implementation" }
] }
```
````

**Tier table (fixed):**

| Tier | Model | Use |
|---|---|---|
| `opus` | Opus 4.8 | complex tasks, validation, merges, decisions |
| `sonnet-xhigh` / `sonnet-high` | Sonnet 4.6 effort xhigh/high | medium-high difficulty |
| `sonnet-medium` / `sonnet-low` | Sonnet 4.6 effort medium/low | medium-low difficulty; contract-defining tests |
| `haiku` | Haiku 4.5 | docs, OpenAPI, mechanical tests |

**Test generation is part of the graph:** after the plan is written, tests are generated FIRST — `kind: tests` tasks sit in the earliest possible wave, writing failing tests from the plan's Interfaces blocks. Implementation tasks depend on them and make them pass. Test tier by difficulty: `haiku` for mechanical tests (CRUD, serialization, fixtures), `sonnet-medium` for contract-defining tests (interfaces other tasks depend on — they ARE the executable spec). Docs/OpenAPI tasks (`haiku`) go in the final wave.

Run the writing-plans self-review (spec coverage, placeholder scan, type consistency) on the finished plan, plus: every task in the graph JSON exists in the doc and vice versa; no same-wave file overlaps; no `.env` reads/edits anywhere in the plan.

## Phase 3 — Present & approve

Show the user: plan path, wave diagram (wave → tasks → tier), what runs in parallel, expected bottlenecks (longest dependency chain). Then ask approval (AskUserQuestion): **Executar** / **Ajustar o plano** (take the feedback, revise, present again) / **Cancelar**. No concurrency question — the Workflow pool caps parallelism at min(16, cores−2) already.

## Phase 4 — Autonomous execution

1. Create the integration branch and its dedicated worktree **upfront** (never work on main — commit-gate blocks it anyway; the worktree keeps the user's checkout free during the whole run):

```bash
git branch feat/<slug>
git worktree add ../<repo>-integration feat/<slug>
```

2. Launch the executor — `plan-executor.js` lives **next to this SKILL.md** (resolve its absolute path from this skill's directory):

```
Workflow({
  scriptPath: "<this skill dir>/plan-executor.js",
  args: {
    planPath: "<abs plan path>",
    graph: <the Task Graph JSON>,
    integrationBranch: "feat/<slug>",
    integrationWorktree: "<abs path to ../<repo>-integration>"
  }
})
```

The executor runs waves in dependency order (one `parallel()` per wave; the pool queues excess), each task agent in its own worktree on branch `task/<id>` with **one automatic retry** on failure, then an **Opus merge agent** merges each wave into the integration branch inside the integration worktree and runs the suite (tests for not-yet-implemented tasks are expected-fail until their wave lands). Final **Opus validation** audits result vs plan, with **one Opus repair round** if red.

3. Monitor. If the workflow aborts or ends red after the repair round: keep the `runId` from the tool result, fix the root cause (repair agent, plan edit, whatever it takes), then relaunch with `Workflow({scriptPath, args, resumeFromRunId})` — completed agents return cached, only the fixed-and-after part re-runs. Never report done with red tests.

## Phase 5 — Finish (user decides, NO push)

When validation is green, tell the user — with this warning first: **"No push will be made by agents — everything is local."** Then ask (AskUserQuestion):

1. **Merge into main locally** — human-gated exception to the primary-branch policy: do the merge ONLY after this explicit user choice; leave the merge commit unpushed for the user to review and push.
2. **Create PR** — requires pushing the feature branch; state that explicitly and get confirmation before any `git push`. Then `gh pr create` (body in PT-BR).
3. **Stay on `feat/<slug>`** — checkout the result branch and stop; user takes it from there. (`feat/<slug>` is held by the integration worktree — remove it first, see below.)

After the user's choice, clean up: `git worktree remove ../<repo>-integration` (and `git worktree prune`). Task worktrees and branches are cleaned by the merge agents.

## Never

- Skip the approval question or the Opus phases.
- Put two tasks touching the same file in the same wave.
- Read or edit `.env` files — plan and agents use `.env.example`.
- Push, merge to main, or open a PR without the explicit Phase 5 answer.
- Report completion with failing tests or unvalidated merges.
