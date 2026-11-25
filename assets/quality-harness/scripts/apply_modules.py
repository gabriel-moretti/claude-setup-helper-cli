#!/usr/bin/env python3
"""Apply optional harness modules to a repo (additive; never removes a module or overwrites a file).

Usage: python3 apply_modules.py <repo> --modules nextjs,database[,...] [--dry-run]
  1. Resolves `depends` (modules.json) and writes the union into .github/standards.json → "modules".
  2. Copies module assets (workflows only for selected modules; existing files are kept).
  3. Merges selected MCP fragments into <repo>/.mcp.json by server name (existing servers kept).
  4. Module wiring: fastapi → Ruff extend-select ANN/ASYNC; flutter → coverage excludes in ci.yml.
Prints a Markdown report, including PIN-REVIEWED-VERSION placeholders still to pin and templates
to translate to docs.languages[0]. Standard library only.
"""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

import harness_modules as hm

ASSETS = hm.SKILL_ROOT / "assets" / "modules"
TRANSLATABLE = {"docs/runbooks/_template.md", "docs/postmortems/_template.md", "e2e/JOURNEYS.md"}


def web_root(repo: hm.Repo) -> str | None:
    """Directory of the Next.js (or other web) node project, for Playwright/E2E assets."""
    for f in sorted(repo.named("package.json"), key=len):
        deps = set()
        try:
            j = json.loads(repo.read(f) or "{}")
            deps = set(j.get("dependencies", {})) | set(j.get("devDependencies", {}))
        except json.JSONDecodeError:
            pass
        if {"next", "vite", "react", "vue", "@angular/core"} & deps:
            return str(Path(f).parent.as_posix())
    return None


def install_plan(module: str, repo: hm.Repo) -> list[tuple[str, str]]:
    """(asset relative to assets/modules/<module>, destination relative to repo)."""
    web = web_root(repo)
    plans: dict[str, list[tuple[str, str]]] = {
        "aws": [("cost-review.yml", ".github/workflows/cost-review.yml"),
                ("ai-readonly-cost-policy.json", "infra/policies/ai-readonly-cost-policy.json")],
        "terraform": [(".tflint.hcl", "infra/.tflint.hcl"), ("drift.yml", ".github/workflows/drift.yml")],
        "github": [("SECURITY.md", "SECURITY.md")],
        "api-contracts": [(".spectral.yaml", ".spectral.yaml"), ("api-contract.yml", ".github/workflows/api-contract.yml")],
        "database": [("database.yml", ".github/workflows/database.yml"), (".squawk.toml", ".squawk.toml")],
        "observability": [("otel-collector.yaml", "observability/otel-collector.yaml"),
                          ("runbook-template.md", "docs/runbooks/_template.md"),
                          ("postmortem.md", "docs/postmortems/_template.md")],
        "qa-e2e": [("JOURNEYS.md", "e2e/JOURNEYS.md"), ("k6-smoke.js", "perf/k6-smoke.js")]
        + ([("playwright.config.ts", f"{'' if web in (None, '.') else web + '/'}playwright.config.ts"),
            ("e2e.yml", ".github/workflows/e2e.yml")] if web is not None else []),
    }
    return plans.get(module, [])


def merge_mcp(root: Path, modules: list[str], dry: bool) -> tuple[list[str], list[str]]:
    target = root / ".mcp.json"
    current = json.loads(target.read_text(encoding="utf-8")) if target.exists() else {}
    servers = current.setdefault("mcpServers", {})
    added, kept = [], []
    for m in modules:
        frag = ASSETS / m / "mcp.json"
        if not frag.exists():
            continue
        for name, cfg in json.loads(frag.read_text(encoding="utf-8")).get("mcpServers", {}).items():
            if name in servers:
                kept.append(name)
            else:
                servers[name] = cfg
                added.append(name)
    if added and not dry:
        target.write_text(json.dumps(current, indent=2) + "\n", encoding="utf-8")
    return added, kept


def ruff_extend_select(root: Path, repo: hm.Repo, dry: bool) -> list[str]:
    changed = []
    for f in repo.named("pyproject.toml"):
        text = repo.read(f)
        sub = hm.Repo(root, files=[f])
        if "fastapi" not in hm.pyproject_deps(sub):
            continue
        if re.search(r"^extend-select\s*=", text, re.M):
            continue
        if "[tool.ruff.lint]" in text:
            new = text.replace("[tool.ruff.lint]\n", '[tool.ruff.lint]\nextend-select = ["ANN", "ASYNC"]  # fastapi module\n', 1)
        else:
            new = text.rstrip() + '\n\n[tool.ruff.lint]\nextend-select = ["ANN", "ASYNC"]  # fastapi module\n'
        if not dry:
            (root / f).write_text(new, encoding="utf-8")
        changed.append(f)
    return changed


def flutter_coverage_excludes(root: Path, dry: bool) -> bool:
    ci = root / ".github/workflows/ci.yml"
    if not ci.exists():
        return False
    text = ci.read_text(encoding="utf-8")
    old = 'check_lcov.py" coverage/lcov.info --min "${{ needs.detect.outputs.min }}" --label "${{ matrix.dir }}"'
    if old not in text or "--exclude '/l10n/'" in text:
        return False
    new = old + " --exclude '/l10n/' --exclude '/main_[^/]*\\.dart$'"
    if not dry:
        ci.write_text(text.replace(old, new), encoding="utf-8")
    return True


def main() -> int:
    argv = sys.argv[1:]
    if not argv or "--modules" not in argv:
        print(__doc__)
        return 2
    root = Path(argv[0]).resolve()
    dry = "--dry-run" in argv
    wanted = [m.strip() for m in argv[argv.index("--modules") + 1].split(",") if m.strip()]
    catalog, base = hm.load_catalog()
    unknown = [m for m in wanted if m not in catalog]
    if unknown:
        print(f"❌ unknown module(s): {', '.join(unknown)} — known: {', '.join(sorted(catalog))}")
        return 1

    std_path = root / ".github/standards.json"
    std = json.loads(std_path.read_text(encoding="utf-8")) if std_path.exists() else {}
    previous = [m for m in std.get("modules", []) if isinstance(m, str)]
    mods, added_dep, need_base, questions = hm.resolve(set(wanted) | set(previous), catalog, base, std)
    final = sorted(mods)
    out = [f"## Modules applied to `{root.name}`" + (" (dry run)" if dry else ""), "",
           f"- `modules`: {', '.join(final)}" + (f" (kept from before: {', '.join(sorted(set(previous) - set(wanted)))})" if set(previous) - set(wanted) else "")]
    out += [f"- ➕ `{m}` added as dependency of `{by}`" for m, by in sorted(added_dep.items())]
    if need_base:
        out.append(f"- base layers required: {', '.join(sorted(need_base))} (references/<layer>.md)")
    out += [f"- ❓ {q}" for q in questions]
    if not dry:
        std["modules"] = final
        std_path.parent.mkdir(parents=True, exist_ok=True)
        std_path.write_text(json.dumps(std, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    repo = hm.Repo.scan(root)
    out += ["", "### Files"]
    to_translate = []
    for m in final:
        for src, dest in install_plan(m, repo):
            target = root / dest
            if target.exists():
                out.append(f"- ⏭️ `{dest}` exists — kept ({m})")
                continue
            if not dry:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ASSETS / m / src, target)
            out.append(f"- ✅ `{dest}` ({m})")
            if dest in TRANSLATABLE:
                to_translate.append(dest)
    if "qa-e2e" in final and web_root(repo) is None:
        out.append("- 📝 qa-e2e: no web project — E2E workflow not installed; wire `integration_test/` (Flutter) or API E2E manually")

    added, kept = merge_mcp(root, final, dry)
    out += ["", "### MCP (`.mcp.json`)"]
    out += [f"- ✅ server `{n}` added" for n in added] + [f"- ⏭️ server `{n}` already present — kept" for n in kept]
    mcp = (root / ".mcp.json").read_text(encoding="utf-8") if (root / ".mcp.json").exists() else ""
    pins = sorted(set(re.findall(r'"([^"]*(?:PIN-REVIEWED-VERSION|@latest)[^"]*)"', mcp)))
    if pins:
        out.append("- ⚠️ unpinned MCP versions — pin an exact, reviewed version before committing:")
        out += [f"  - `{p}`" for p in pins]
    versions = sorted(set(re.findall(r'"([\w./@-]+[@:]\d+\.\d+\.\d+)"', mcp)))
    if versions:
        out.append("- 📝 pinned versions to review before trusting (Dependabot does not update `.mcp.json`):")
        out += [f"  - `{v}`" for v in versions]

    out += ["", "### Wiring"]
    if "fastapi" in final:
        out += [f"- ✅ `{f}`: Ruff extend-select ANN, ASYNC" for f in ruff_extend_select(root, repo, dry)] or ["- ⏭️ Ruff extend-select already set"]
    if "flutter" in final:
        out.append("- ✅ ci.yml: flutter coverage excludes l10n/ and main_*.dart" if flutter_coverage_excludes(root, dry)
                   else "- ⏭️ ci.yml flutter excludes already set (or no ci.yml)")
    if to_translate:
        langs = (std.get("docs") or {}).get("languages") or ["pt-BR"]
        if langs[0] != "en":
            out += ["", f"### Translate to `{langs[0]}` (human templates)"] + [f"- `{d}`" for d in to_translate]
    print("\n".join(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
