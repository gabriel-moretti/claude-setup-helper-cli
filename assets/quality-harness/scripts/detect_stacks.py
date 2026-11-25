#!/usr/bin/env python3
"""Detect a repository's stacks and report which quality-harness pieces are present or missing.

Usage: python3 detect_stacks.py [repo-root] [--history] [--in-production] [--modules a,b]
  --history        also run audit_history.js (commits, branches, CHANGELOG, VERSION, tags, standards).
  --in-production  service is live (IN_PRODUCTION=true): recommends the observability module.
  --modules a,b    audit these modules (default: standards.json "modules", else the suggested set).
  --json           print module detection as JSON ({suggested, recommended, default, catalog}) and exit.
Stack ids match .github/scripts/projects.cjs: node | python | flutter (+ docker).
Read-only. Standard library only. Output: Markdown on stdout.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

import harness_modules as hm

IGNORED_DIRS = {
    ".git", "node_modules", ".venv", "venv", "__pycache__", ".dart_tool", "build", "dist", ".next",
    "coverage", ".mypy_cache", ".ruff_cache", ".pytest_cache", "ios", ".gradle", ".idea", ".vscode",
}
REQUIRED_CHECKS = ["ci-ok", "conventions", "standards", "release-check", "pr-template"]
OK, MISS, WARN = "✅", "❌", "⚠️"


@dataclass
class Check:
    status: str
    label: str
    hint: str = ""


@dataclass
class Stack:
    name: str
    root: Path
    checks: list[Check] = field(default_factory=list)


def walk(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS and not d.startswith(".")]
        yield Path(dirpath), set(filenames)


def read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return ""


def check(cond: bool, label: str, hint: str = "", warn: bool = False) -> Check:
    if cond:
        return Check(OK, label)
    return Check(WARN if warn else MISS, label, hint)


def strip_comments(text: str) -> str:
    return "\n".join(re.sub(r"\s+#.*$|^\s*#.*$", "", line) for line in text.splitlines())


def python_checks(d: Path) -> list[Check]:
    py = strip_comments(read(d / "pyproject.toml"))
    legacy = py + strip_comments(read(d / "setup.cfg") + read(d / "tox.ini"))
    out = [
        check((d / "uv.lock").exists(), "uv.lock committed", "run `uv lock`"),
        check("[tool.ruff" in py or (d / "ruff.toml").exists(), "Ruff configured", "merge assets/python/pyproject.quality.toml"),
        check("[tool.mypy" in py or (d / "mypy.ini").exists(), "mypy configured", "CI skips the type step without it", warn=True),
        check("lcov" in py or "pytest-cov" in py, "pytest-cov available (CI writes coverage/lcov.info)", warn=True),
        check(not re.search(r"^\s*fail_under\s*=", py, re.M), "no fail_under (coverage.cjs is the single gate)", "remove fail_under", warn=True),
    ]
    conflicts = [t for t in ("black", "isort", "flake8") if re.search(rf"\b{t}\b", legacy)]
    if (d / ".flake8").exists():
        conflicts.append(".flake8")
    if conflicts:
        out.append(Check(WARN, f"tools replaced by Ruff still present: {', '.join(sorted(set(conflicts)))}", "remove after migrating config"))
    if re.search(r"\bdjango\b", py, re.I):
        out.append(check("django-stubs" in py, "django-stubs (Django detected)", warn=True))
    if re.search(r"\bfastapi\b", py, re.I):
        out.append(check('"FAST"' in py, "Ruff FAST rules (FastAPI detected)", warn=True))
    return out


def node_checks(d: Path) -> list[Check]:
    raw = read(d / "package.json")
    try:
        scripts = json.loads(raw).get("scripts", {}) if raw else {}
    except json.JSONDecodeError:
        scripts = {}
    tsconfig = read(d / "tsconfig.json")
    missing = [s for s in ("format:check", "lint", "test:coverage") if s not in scripts]
    out = [
        check((d / "pnpm-lock.yaml").exists() or (d.parent / "pnpm-workspace.yaml").exists(), "pnpm lockfile"),
        check(not missing, "CI script contract (format:check, lint, test:coverage)",
              f"missing: {', '.join(missing)} — see assets/node/package.scripts.json"),
        check("typecheck" in scripts, "typecheck script", "CI runs it when present", warn=True),
        check((d / "biome.json").exists() or (d / "biome.jsonc").exists(), "Biome configured"),
        check(any((d / f"eslint.config.{e}").exists() for e in ("js", "mjs", "cjs", "ts")), "ESLint flat config", warn=True),
        check(bool(re.search(r'"strict"\s*:\s*true', tsconfig)), "tsconfig strict: true", "" if tsconfig else "no tsconfig.json"),
    ]
    if any((d / f).exists() for f in (".prettierrc", ".prettierrc.json", "prettier.config.js", ".prettierrc.js")) or '"prettier"' in raw:
        out.append(Check(WARN, "Prettier alongside Biome", "remove — Biome formats"))
    if any(n in raw for n in ('"@commitlint', '"commitizen"', '"cz-conventional')):
        out.append(Check(WARN, "Conventional Commits tooling (commitlint/commitizen)", "remove — commits are gitmoji"))
    if '"next"' in raw:
        out.append(Check(WARN, "Next.js detected", "combine with harness-nextjs skill"))
    return out


def flutter_checks(d: Path) -> list[Check]:
    ao = read(d / "analysis_options.yaml")
    pub = read(d / "pubspec.yaml")
    return [
        check(bool(ao), "analysis_options.yaml"),
        check(any(k in ao for k in ("very_good_analysis", "flutter_lints", "lints/")), "lint package included"),
        check(".g.dart" in ao or "build_runner" not in pub, "generated code excluded from analyzer", warn=True),
        check((d / "test").is_dir(), "test/ folder", warn=True),
    ]


def docker_checks(d: Path, repo: Path) -> list[Check]:
    df = read(d / "Dockerfile")
    return [
        check((d / ".dockerignore").exists(), ".dockerignore"),
        check((d / ".hadolint.yaml").exists() or (repo / ".hadolint.yaml").exists(), ".hadolint.yaml", warn=True),
        check(not df or not re.search(r"^FROM\s+\S+:latest\b|^FROM\s+[^:\s@]+\s*$", df, re.M), "base image pinned (no latest)"),
        check(not df or bool(re.search(r"^USER\s+(?!root\b)", df, re.M)), "non-root USER in final stage"),
    ]


def core_checks(repo: Path) -> list[Check]:
    gh = repo / ".github"
    wf = {p.name: read(p) for p in (gh / "workflows").glob("*.y*ml")} if (gh / "workflows").is_dir() else {}
    all_wf = " ".join(wf.values())
    lefthook = read(repo / "lefthook.yml") + read(repo / "lefthook.yaml")
    settings = read(repo / ".claude/settings.json")
    names = set()
    for text in wf.values():
        names.update(re.findall(r"^\s{4}name:\s*[\"']?([\w-]+)[\"']?\s*$", text, re.M))
    missing_checks = [c for c in REQUIRED_CHECKS if c not in names]
    out = [
        # repo hygiene
        check((repo / ".editorconfig").exists(), ".editorconfig"),
        check((repo / ".gitattributes").exists(), ".gitattributes"),
        # hooks
        check(bool(lefthook), "lefthook.yml"),
        check("commit.cjs" in lefthook, "commit-msg → gitmoji (commit.cjs)"),
        check("branch.cjs" in lefthook, "pre-push → Conventional Branch (branch.cjs)"),
        check("gitleaks" in lefthook and "scan_pan" in lefthook, "pre-commit → gitleaks + PAN scan"),
        # validators + config
        check((gh / "scripts/lib/gitmoji.cjs").exists(), ".github/scripts validators (Node ≥ 20)"),
        check((gh / "standards.json").exists(), ".github/standards.json"),
        check((gh / "gitmoji/gitmojis.json").exists(), "pinned gitmojis.json"),
        check((repo / "scripts/quality/scan_pan.py").exists(), "scripts/quality/scan_pan.py"),
        # CI
        check(not missing_checks, "required check contexts", f"missing: {', '.join(missing_checks)}"),
        check("gitleaks" in all_wf and "scan_pan" in all_wf, "CI security job (gitleaks + PAN)"),
        check("timeout-minutes" in all_wf and "cancel-in-progress" in all_wf, "Actions minute saving (timeouts, concurrency)", warn=True),
        # release
        check((repo / "VERSION").exists(), "VERSION"),
        check((repo / "CHANGELOG.md").exists(), "CHANGELOG.md"),
        check((repo / "cliff.toml").exists(), "cliff.toml (git-cliff draft)", warn=True),
        # templates + governance files
        check((gh / "PULL_REQUEST_TEMPLATE").is_dir(), "PR templates per branch type"),
        check((gh / "ISSUE_TEMPLATE").is_dir(), "issue forms", warn=True),
        check(any((repo / p).exists() for p in (".github/CODEOWNERS", "CODEOWNERS", "docs/CODEOWNERS")), "CODEOWNERS"),
        check((gh / "dependabot.yml").exists(), "dependabot.yml", warn=True),
        # AI
        check((repo / "AGENTS.md").exists(), "AGENTS.md (English)"),
        check(bool(re.search(r'"commit"\s*:\s*""', settings)), ".claude/settings.json with attribution off"),
    ]
    legacy = []
    if (repo / ".husky").is_dir():
        legacy.append(".husky → migrate to lefthook")
    if (repo / ".pre-commit-config.yaml").exists():
        legacy.append(".pre-commit-config.yaml → migrate to lefthook")
    if any((repo / f).exists() for f in ("commitlint.config.js", ".commitlintrc", ".commitlintrc.json", ".lefthook/commit-msg.sh")):
        legacy.append("Conventional Commits hook/config → replace with commit.cjs")
    if (gh / "workflows/quality.yml").exists():
        legacy.append("old quality.yml → merged into ci.yml")
    out += [Check(WARN, f"legacy: {item}") for item in legacy]
    if (repo / "VERSION").exists():
        version = read(repo / "VERSION").strip()
        for manifest, pattern in (("package.json", r'"version"\s*:\s*"([^"]+)"'),
                                  ("pyproject.toml", r'^version\s*=\s*"([^"]+)"'),
                                  ("pubspec.yaml", r"^version:\s*['\"]?([^\s'\"+#]+)")):
            m = re.search(pattern, read(repo / manifest), re.M)
            if m and m.group(1) != version:
                out.append(Check(MISS, f"{manifest} version {m.group(1)} ≠ VERSION {version}"))
    return out


def detect(repo: Path) -> list[Stack]:
    stacks: list[Stack] = []
    for d, files in walk(repo):
        rel = d.relative_to(repo)
        if "pyproject.toml" in files or "requirements.txt" in files:
            stacks.append(Stack("python", rel, python_checks(d)))
        if "package.json" in files:
            stacks.append(Stack("node", rel, node_checks(d)))
        if "pubspec.yaml" in files:
            stacks.append(Stack("flutter", rel, flutter_checks(d)))
        if any(f == "Dockerfile" or f.startswith("Dockerfile.") or f.endswith(".Dockerfile") for f in files):
            stacks.append(Stack("docker", rel, docker_checks(d, repo)))
        if "composer.json" in files and "vendor" not in rel.parts:
            stacks.append(Stack("php", rel, [check((d / "composer.lock").exists(), "composer.lock committed"),
                                             Check(WARN, "rules live in the php module", "references/stacks/php.md")]))
    return stacks


def render(title: str, checks: list[Check]) -> str:
    lines = [f"### {title}"]
    lines += [f"- {c.status} {c.label}" + (f" — {c.hint}" if c.hint and c.status != OK else "") for c in checks]
    return "\n".join(lines)


def render_modules(repo: Path, in_production: bool, audit_list: list[str] | None) -> str:
    det = hm.detect(repo, in_production=in_production)
    lines = ["### Modules", f"Base layers: {', '.join(sorted(det.base)) or 'none'}"]
    sel = set(det.selected)
    for m in det.suggested:
        mark = OK if m in sel else "☐"
        if m in det.detected:
            why = "; ".join(det.detected[m][:2])
            kind = "detected"
        elif m in det.recommended:
            why, kind = det.recommended[m], "recommended"
        else:
            why, kind = f"required by {det.added_by_depends[m]}", "dependency"
        lines.append(f"- {mark} `{m}` — {kind}: {why}")
    for m in sorted(sel - set(det.suggested) - set(det.unknown)):
        lines.append(f"- {OK} `{m}` — selected (no signal found)")
    for m in det.unknown:
        lines.append(f"- {MISS} `{m}` — unknown module in standards.json")
    for q in det.needs_answer:
        lines.append(f"- ❓ {q}")
    missing = [m for m in det.suggested if m not in sel]
    if sel and missing:
        lines.append(f"- {WARN} suggested but not selected: {', '.join(missing)} (confirm with the user)")
    if not sel:
        lines.append(f"- {WARN} no `\"modules\"` in .github/standards.json — confirm the selection, then run apply_modules.py")
    targets = audit_list if audit_list is not None else (sorted(sel - set(det.unknown)) or det.suggested)
    for m, (items, manual) in hm.audit(repo, targets).items():
        lines += ["", f"### Module `{m}`" + ("" if m in sel else " (not selected — preview)")]
        lines += [f"- {i.status} {i.label}" + (f" — {i.hint}" if i.hint and i.status != OK else "") for i in items]
        lines += [f"- {hm.MANUAL} {x}" for x in manual]
    return "\n".join(lines)


def main() -> int:
    args = [a for i, a in enumerate(sys.argv[1:]) if not a.startswith("--") and sys.argv[i] != "--modules"]
    repo = Path(args[0] if args else ".").resolve()
    if not repo.is_dir():
        print(f"Directory not found: {repo}", file=sys.stderr)
        return 2
    if "--json" in sys.argv:
        det = hm.detect(repo, in_production="--in-production" in sys.argv)
        catalog, _ = hm.load_catalog()
        print(json.dumps({
            "suggested": det.suggested,
            "recommended": sorted(det.recommended),
            "default": sorted(name for name, spec in catalog.items() if spec.get("default")),
            "catalog": sorted(catalog),
        }))
        return 0
    stacks = detect(repo)
    core = core_checks(repo)
    missing = sum(c.status == MISS for c in core) + sum(c.status == MISS for s in stacks for c in s.checks)
    has_code = bool(stacks) or any(
        f for _, files in walk(repo) for f in files if not f.endswith((".md", ".txt")) and f not in {".gitignore", "LICENSE"}
    )

    print(f"# Quality harness — {repo.name}\n")
    print("**Stacks:** " + (", ".join(f"{s.name} (`{s.root or '.'}`)" for s in stacks) or "none"))
    track = "CRIAR" if not has_code else ("AUDITAR (complete)" if missing == 0 else "RETROFIT")
    print(f"**Suggested track:** {track} · **Missing items:** {missing}\n")
    print(render("Core", core))
    for s in stacks:
        print()
        print(render(f"{s.name} — `{s.root or '.'}`", s.checks))
    print()
    mods_arg = sys.argv[sys.argv.index("--modules") + 1].split(",") if "--modules" in sys.argv else None
    print(render_modules(repo, "--in-production" in sys.argv, mods_arg))
    if "--history" in sys.argv and (repo / ".git").exists():
        print()
        script = Path(__file__).with_name("audit_history.js")
        result = subprocess.run(["node", str(script), str(repo)], capture_output=True, text=True, check=False)
        print(result.stdout.rstrip() or f"{WARN} audit_history.js failed: {result.stderr.strip()[:300]}")
    print(f"\nLegend: {OK} ok · {MISS} missing · {WARN} attention · {hm.MANUAL} manual review · ☐ not selected")
    return 0


if __name__ == "__main__":
    sys.exit(main())
