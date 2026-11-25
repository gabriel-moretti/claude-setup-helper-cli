"""Optional harness modules: detection (modules.json signals), dependency resolution and audit checks.

Used by detect_stacks.py (report) and apply_modules.py (install). Standard library only.
Base layers (node, python, flutter, docker) are detected by projects.cjs and never listed in
standards.json "modules"; module "flutter" always means the Flutter module.
"""

from __future__ import annotations

import json
import os
import re
import tomllib
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {".git", "node_modules", "vendor", ".venv", "venv", "__pycache__", ".dart_tool", "build", "dist",
             ".next", "coverage", ".mypy_cache", ".ruff_cache", ".pytest_cache", ".terraform", ".gradle", ".claude"}  # skill instalado em .claude/skills/ traz arquivos que disparariam a detecção
MAX_FILES = 20000
OK, MISS, WARN, MANUAL = "✅", "❌", "⚠️", "📝"


# ── repo snapshot ────────────────────────────────────────────────────────────
@dataclass
class Repo:
    root: Path
    files: list[str] = field(default_factory=list)  # POSIX paths relative to root
    dirs: list[str] = field(default_factory=list)
    _cache: dict[str, str] = field(default_factory=dict)

    @classmethod
    def scan(cls, root: Path) -> Repo:
        repo = cls(root.resolve())
        for dirpath, dirnames, filenames in os.walk(repo.root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            rel = Path(dirpath).relative_to(repo.root).as_posix()
            if rel != ".":
                repo.dirs.append(rel)
            for f in filenames:
                repo.files.append(f if rel == "." else f"{rel}/{f}")
                if len(repo.files) >= MAX_FILES:
                    return repo
        return repo

    def read(self, rel: str) -> str:
        if rel not in self._cache:
            try:
                self._cache[rel] = (self.root / rel).read_text(encoding="utf-8", errors="ignore")
            except OSError:
                self._cache[rel] = ""
        return self._cache[rel]

    def named(self, name: str) -> list[str]:
        return [f for f in self.files if f.rsplit("/", 1)[-1] == name]

    def glob(self, pattern: str) -> list[str]:
        rx = glob_to_regex(pattern)
        return [f for f in self.files if rx.match(f)]

    def grep(self, pattern: str, regex: str, flags: int = re.M) -> list[str]:
        rx = re.compile(regex, flags)
        return [f for f in self.glob(pattern) if rx.search(self.read(f))]

    def standards(self) -> dict | None:
        p = self.root / ".github/standards.json"
        if not p.exists():
            return None
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return None

    def workflows(self) -> dict[str, str]:
        return {f: self.read(f) for f in self.files if re.match(r"^\.github/workflows/[^/]+\.ya?ml$", f)}


def expand_braces(pattern: str) -> list[str]:
    m = re.search(r"\{([^{}]+)\}", pattern)
    if not m:
        return [pattern]
    return [p for alt in m.group(1).split(",") for p in expand_braces(pattern[: m.start()] + alt + pattern[m.end() :])]


def glob_to_regex(pattern: str) -> re.Pattern[str]:
    parts = []
    for alt in expand_braces(pattern):
        rx = re.escape(alt).replace(r"\*\*/", "\x00").replace(r"\*\*", ".*").replace(r"\*", "[^/]*").replace("\x00", "(?:.*/)?")
        parts.append(rx)
    return re.compile("^(?:" + "|".join(parts) + ")$")


# ── manifests ────────────────────────────────────────────────────────────────
def package_deps(repo: Repo) -> set[str]:
    out: set[str] = set()
    for f in repo.named("package.json"):
        try:
            j = json.loads(repo.read(f) or "{}")
        except json.JSONDecodeError:
            continue
        for k in ("dependencies", "devDependencies", "peerDependencies"):
            out.update((j.get(k) or {}).keys())
    return out


def _req_name(req: str) -> str:
    return re.split(r"[\s\[<>=!~;@]", req.strip(), maxsplit=1)[0].lower().replace("_", "-")


def pyproject_deps(repo: Repo) -> set[str]:
    out: set[str] = set()
    for f in repo.named("pyproject.toml"):
        try:
            t = tomllib.loads(repo.read(f))
        except tomllib.TOMLDecodeError:
            continue
        proj = t.get("project", {})
        reqs = list(proj.get("dependencies", []))
        for group in proj.get("optional-dependencies", {}).values():
            reqs += group
        for group in t.get("dependency-groups", {}).values():
            reqs += [r for r in group if isinstance(r, str)]
        out.update(_req_name(r) for r in reqs)
        poetry = t.get("tool", {}).get("poetry", {})
        out.update(k.lower() for k in poetry.get("dependencies", {}))
    for f in repo.named("requirements.txt"):
        out.update(_req_name(line) for line in repo.read(f).splitlines() if line.strip() and not line.startswith(("#", "-")))
    return out


def pubspec_deps(repo: Repo) -> set[str]:
    out: set[str] = set()
    for f in repo.named("pubspec.yaml"):
        section = None
        for line in repo.read(f).splitlines():
            top = re.match(r"^([A-Za-z_]+):", line)
            if top:
                section = top.group(1)
                continue
            dep = re.match(r"^  ([A-Za-z0-9_]+):", line)
            if dep and section in ("dependencies", "dev_dependencies"):
                out.add(dep.group(1))
    return out


def tf_providers(repo: Repo) -> set[str]:
    out: set[str] = set()
    for f in repo.glob("**/*.tf"):
        out.update(m.lower() for m in re.findall(r'source\s*=\s*"([\w.-]+/[\w.-]+(?:/[\w.-]+)?)"', repo.read(f)))
    return {re.sub(r"^registry\.terraform\.io/", "", p) for p in out}


def dotted(obj: dict | None, path: str):
    cur = obj
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


# ── catalog + detection ──────────────────────────────────────────────────────
def load_catalog(skill_root: Path = SKILL_ROOT) -> tuple[dict, list[str]]:
    raw = json.loads((skill_root / "modules.json").read_text(encoding="utf-8"))
    base = raw.get("_baseLayers", ["node", "python", "flutter", "docker"])
    return {k: v for k, v in raw.items() if not k.startswith("_")}, base


def base_layers(repo: Repo) -> set[str]:
    out = set()
    if repo.named("package.json"):
        out.add("node")
    if repo.named("pyproject.toml") or repo.named("requirements.txt"):
        out.add("python")
    if repo.named("pubspec.yaml"):
        out.add("flutter")
    if any(re.search(r"(^|/)(Dockerfile(\.[^/]+)?|[^/]+\.Dockerfile)$", f) for f in repo.files):
        out.add("docker")
    if repo.named("composer.json"):
        out.add("php")
    return out


def signals(repo: Repo, spec: dict, ctx: dict) -> list[str]:
    det, hits = spec.get("detect", {}), []
    for name in det.get("files", []):
        found = repo.named(name)
        if found:
            hits.append(f"file {found[0]}")
    for name in det.get("dirs", []):
        found = [d for d in repo.dirs if d.rsplit("/", 1)[-1] == name]
        if found:
            hits.append(f"dir {found[0]}/")
    for g in det.get("globs", []):
        found = repo.glob(g)
        if found:
            hits.append(f"glob {g} → {found[0]}")
    for key, getter in (("packageDeps", package_deps), ("pyprojectDeps", pyproject_deps),
                        ("pubspecDeps", pubspec_deps), ("tfProviders", tf_providers)):
        wanted = det.get(key, [])
        if wanted:
            have = ctx.setdefault(f"_{key}", getter(repo))
            hits += [f"{key} {w}" for w in wanted if w.lower() in have]
    std = repo.standards()
    for path, want in det.get("standards", {}).items():
        if path == "in_production":  # not a standards.json field: repo variable / Enterprise property
            if ctx.get("in_production"):
                hits.append("IN_PRODUCTION=true")
            continue
        val = dotted(std, path)
        if val is not None and (want == "*" or val == want):
            hits.append(f"standards {path}={val}")
    return hits


@dataclass
class Detection:
    base: set[str]
    detected: dict[str, list[str]]           # module -> signals
    recommended: dict[str, str]               # module -> reason
    added_by_depends: dict[str, str]          # module -> required by
    needs_answer: list[str]
    selected: list[str]                       # from standards.json
    unknown: list[str]

    @property
    def suggested(self) -> list[str]:
        mods = set(self.detected) | set(self.recommended) | set(self.added_by_depends)
        return sorted(mods)


def resolve(mods: set[str], catalog: dict, base: list[str], std: dict | None) -> tuple[set[str], dict[str, str], set[str], list[str]]:
    """Return (modules, added_by_depends, base_layers_needed, questions). Never removes."""
    out, added, need_base, questions = set(mods), {}, set(), []
    changed = True
    while changed:
        changed = False
        for m in sorted(out):
            deps = list(catalog.get(m, {}).get("depends", []))
            if m == "aws":  # MODULES.md: "terraform or cdk" — resolve from infra.iac
                iac = dotted(std, "infra.iac")
                if iac == "terraform":
                    deps.append("terraform")
                elif iac is None:
                    questions.append("aws: IaC is Terraform or CDK? (Terraform adds the terraform module)")
            for d in deps:
                if d in base:
                    need_base.add(d)
                elif d in catalog and d not in out:
                    out.add(d)
                    added[d] = m
                    changed = True
    return out, added, need_base, sorted(set(questions))


def detect(root: Path, in_production: bool = False, skill_root: Path = SKILL_ROOT) -> Detection:
    catalog, base = load_catalog(skill_root)
    repo = Repo.scan(root)
    ctx = {"in_production": in_production}
    layers = base_layers(repo)
    detected: dict[str, list[str]] = {}
    for name, spec in catalog.items():
        hits = signals(repo, spec, ctx)
        # stack modules need their base layer (android/ for a non-Flutter app is not the Flutter module)
        base_deps = [d for d in spec.get("depends", []) if d in base]
        if hits and base_deps and not all(d in layers for d in base_deps):
            continue
        if hits or spec.get("default"):
            detected[name] = hits or ["default"]
    recommended: dict[str, str] = {}
    if "qa-e2e" not in detected and ({"nextjs", "flutter"} & set(detected)):
        recommended["qa-e2e"] = "user journeys (" + ", ".join(sorted({"nextjs", "flutter"} & set(detected))) + ")"
    if "observability" not in detected and in_production:
        recommended["observability"] = "deployable service in production"
    std = repo.standards()
    mods, added, need_base, questions = resolve(set(detected) | set(recommended), catalog, base, std)
    selected = list(std.get("modules", [])) if isinstance(std, dict) and isinstance(std.get("modules"), list) else []
    return Detection(layers | need_base, detected, recommended, added, questions, selected,
                     [m for m in selected if m not in catalog])


# ── audit ────────────────────────────────────────────────────────────────────
@dataclass
class Item:
    status: str
    label: str
    hint: str = ""


def _wf_any(repo: Repo, rx: str) -> bool:
    return any(re.search(rx, t, re.M) for t in repo.workflows().values())


def _mcp(repo: Repo) -> dict:
    try:
        return json.loads(repo.read(".mcp.json") or "{}").get("mcpServers", {})
    except json.JSONDecodeError:
        return {}


def _mcp_pinned(repo: Repo, names: list[str]) -> Item:
    servers = _mcp(repo)
    present = [n for n in names if n in servers]
    if not present:
        return Item(WARN, f".mcp.json servers ({', '.join(names)})", "merge the module fragment (apply_modules.py)")
    blob = json.dumps({n: servers[n] for n in present})
    pinned = "PIN-REVIEWED-VERSION" not in blob and "@latest" not in blob and not re.search(r'"[\w./-]+:latest"', blob)
    return Item(OK if pinned else MISS, "MCP servers pinned to an exact version (no @latest)",
                "" if pinned else "pin an exact, reviewed version")


Check = Callable[[Repo, dict], Item]


def c(cond: Callable[[Repo, dict], bool], label: str, hint: str = "", severity: str = MISS) -> Check:
    def run(repo: Repo, ctx: dict) -> Item:
        try:
            ok = cond(repo, ctx)
        except Exception as exc:  # noqa: BLE001 - audit must never crash
            return Item(WARN, label, f"check failed: {exc}")
        return Item(OK, label) if ok else Item(severity, label, hint)
    return run


def _ruff_has(repo: Repo, codes: list[str]) -> bool:
    for f in repo.named("pyproject.toml"):
        lint = tomllib.loads(repo.read(f)).get("tool", {}).get("ruff", {}).get("lint", {})
        sel = set(lint.get("select", [])) | set(lint.get("extend-select", []))
        if all(code in sel for code in codes):
            return True
    return False


def _node_web(repo: Repo) -> bool:
    return "next" in package_deps(repo) or any(repo.named(n) for n in ("vite.config.ts", "vite.config.js"))


CHECKS: dict[str, list[Check]] = {
    "nextjs": [
        c(lambda r, _: _wf_any(r, r"(pnpm( run)? build|next build)"), "CI runs `pnpm build`", "add a build step (catches RSC/client boundary errors)"),
        c(lambda r, _: bool(r.grep("**/*.{ts,tsx}", r"""^import\s+["']server-only["']""")), "`server-only` marks server modules"),
        c(lambda r, _: bool(r.glob("**/env.{ts,mjs,js}")), "validated env module (`env.ts`, zod)"),
        c(lambda r, _: "zod" in package_deps(r), "zod for action/handler input validation"),
        c(lambda r, _: bool(r.grep("**/next.config.{js,mjs,ts}", r"Content-Security-Policy|headers\s*\(")) or bool(r.grep("**/{middleware,proxy}.{ts,js}", r"Content-Security-Policy")),
          "security headers (CSP, HSTS…) configured"),
        c(lambda r, _: not r.grep("**/*.{ts,tsx,js,mjs}", r"NEXT_PUBLIC_[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|PRIVATE)"), "no secret-looking `NEXT_PUBLIC_*`"),
        c(lambda r, _: bool({"next-auth", "better-auth", "@auth/core", "aws-amplify", "@azure/msal-node", "@azure/msal-browser"} & package_deps(r)),
          "established auth library", severity=WARN),
    ],
    "nestjs": [
        c(lambda r, _: bool(r.grep("**/main.ts", r"ValidationPipe\(\{[^}]*whitelist:\s*true")) or "nestjs-zod" in package_deps(r), "global ValidationPipe (whitelist) or nestjs-zod"),
        c(lambda r, _: "@nestjs/swagger" in package_deps(r), "OpenAPI via @nestjs/swagger"),
        c(lambda r, _: bool(r.grep("**/main.ts", r"enableShutdownHooks\(")), "`app.enableShutdownHooks()`"),
        c(lambda r, _: {"helmet", "@nestjs/throttler"} <= package_deps(r), "helmet + @nestjs/throttler"),
        c(lambda r, _: "@nestjs/config" in package_deps(r), "@nestjs/config with schema validation"),
        c(lambda r, _: "nestjs-pino" in package_deps(r), "structured logs (nestjs-pino)", severity=WARN),
        c(lambda r, _: _wf_any(r, r"(pnpm( run)? build|nest build)"), "CI runs `pnpm build`"),
    ],
    "fastapi": [
        c(lambda r, _: _ruff_has(r, ["ANN", "ASYNC", "S", "B", "UP"]), "Ruff ANN, ASYNC, S, B, UP enabled", "apply_modules.py adds extend-select"),
        c(lambda r, _: any(tomllib.loads(r.read(f)).get("tool", {}).get("mypy", {}).get("strict") for f in r.named("pyproject.toml")), "mypy strict"),
        c(lambda r, _: "pydantic-settings" in pyproject_deps(r), "settings via pydantic-settings"),
        c(lambda r, _: not r.grep("**/*.py", r"@app\.on_event\("), "lifespan instead of `@app.on_event`"),
        c(lambda r, _: not r.grep("**/*.py", r"^\s*(import requests|from requests import)"), "no `requests` (blocking) in app code", severity=WARN),
    ],
    "flutter": [
        c(lambda r, _: "go_router" in pubspec_deps(r), "go_router navigation"),
        c(lambda r, _: bool({"flutter_riverpod", "riverpod", "hooks_riverpod", "flutter_bloc", "bloc"} & pubspec_deps(r)), "one state-management approach (Riverpod or Bloc)"),
        c(lambda r, _: "flutter_secure_storage" in pubspec_deps(r), "tokens in flutter_secure_storage", severity=WARN),
        c(lambda r, _: bool(r.glob("**/l10n.yaml")) or bool(r.grep("**/pubspec.yaml", r"^\s+generate:\s*true")), "gen-l10n (ARB) configured"),
        c(lambda r, _: bool(r.glob("**/lib/main_*.dart")) or bool(r.glob("**/env/*.json")), "flavors / dart-define-from-file"),
        c(lambda r, _: not [f for f in r.files if f.endswith((".jks", ".keystore"))], "no keystore in the repo"),
        c(lambda r, _: _wf_any(r, r"--obfuscate"), "release builds obfuscated", severity=WARN),
    ],
    "php": [
        c(lambda r, _: bool(r.named("composer.lock")), "composer.lock committed"),
        c(lambda r, _: bool(r.grep("**/composer.json", r'"php"\s*:\s*"[^"]+"')), "PHP version pinned in composer.json"),
        c(lambda r, _: bool(r.glob("**/phpstan.{neon,neon.dist,dist.neon}")), "PHPStan configured"),
        c(lambda r, _: bool(r.glob("**/{.php-cs-fixer.dist.php,.php-cs-fixer.php,pint.json}")), "formatter (PHP-CS-Fixer or Pint)"),
        c(lambda r, _: bool(r.glob("**/phpunit.xml{,.dist}")) or bool(r.glob("**/tests/Pest.php")), "PHPUnit/Pest configured"),
        c(lambda r, _: _wf_any(r, r"composer audit") and _wf_any(r, r"composer validate --strict"), "CI: composer validate --strict + audit"),
        c(lambda r, _: not [f for f in r.glob("**/*.php") if not f.startswith(("vendor/", "tests/")) and "strict_types=1" not in r.read(f)][:1],
          "`declare(strict_types=1)` in PHP files", "legacy: ratchet — new files must have it", severity=WARN),
    ],
    "terraform": [
        c(lambda r, _: bool(r.glob("infra/.tflint.hcl")), "infra/.tflint.hcl"),
        c(lambda r, _: bool(r.grep("**/*.tf", r"required_version\s*=")), "required_version pinned"),
        c(lambda r, _: bool(r.glob("**/.terraform.lock.hcl")), ".terraform.lock.hcl committed"),
        c(lambda r, _: bool(r.grep("**/*.tf", r'backend\s+"(s3|azurerm)"')), "remote backend (s3/azurerm)"),
        c(lambda r, _: not r.grep("**/*.tf", r'backend\s+"s3"') or bool(r.grep("**/*.tf", r"use_lockfile\s*=\s*true")), "S3 backend with use_lockfile"),
        c(lambda r, _: bool(r.glob(".github/workflows/drift.yml")), "weekly drift workflow"),
        c(lambda r, _: _wf_any(r, r"tflint"), "tflint in CI"),
        c(lambda r, _: not r.glob("**/*.tfstate"), "no state committed"),
    ],
    "aws": [
        c(lambda r, _: bool(r.glob(".github/workflows/cost-review.yml")), "monthly cost-review workflow"),
        c(lambda r, _: not r.glob("**/*.tf") or bool(r.grep("**/*.tf", r"default_tags")), "provider default_tags (cost allocation)"),
        c(lambda r, _: not _wf_any(r, r"aws-access-key-id"), "OIDC only (no aws-access-key-id in workflows)"),
        lambda r, _: _mcp_pinned(r, ["aws-docs", "aws-pricing", "aws-billing-cost", "aws-iac"]),
    ],
    "azure": [
        c(lambda r, _: not _wf_any(r, r"client-secret|AZURE_CREDENTIALS"), "OIDC only (no client secret in workflows)"),
        c(lambda r, _: not r.glob("**/*.tf") or bool(r.grep("**/*.tf", r'"?brazilsouth"?')), "default location brazilsouth", severity=WARN),
        lambda r, _: _mcp_pinned(r, ["azure", "microsoft-learn"]),
    ],
    "github": [
        c(lambda r, _: all(re.search(r"^permissions:", t, re.M) for t in r.workflows().values()), "every workflow declares `permissions:`"),
        c(lambda r, _: all(len(re.findall(r"^\s{4}runs-on:", t, re.M)) <= len(re.findall(r"timeout-minutes:", t)) for t in r.workflows().values()),
          "every job has `timeout-minutes`"),
        c(lambda r, _: not any("pull_request_target" in t and "github.event.pull_request.head" in t for t in r.workflows().values()),
          "no PR-head checkout under pull_request_target"),
        c(lambda r, _: not any(re.search(r"run:[^\n]*\$\{\{\s*github\.event\.(pull_request|issue|comment|head_commit)\.", t) for t in r.workflows().values()),
          "untrusted event text not interpolated in `run:`", "pass via env:"),
        c(lambda r, _: all(re.search(r"@[0-9a-f]{40}\b", line) for t in r.workflows().values() for line in re.findall(r"uses:\s*([^\s#]+)", t) if not line.startswith("./")),
          "actions pinned by full SHA", "use org/action@<40-char sha> # vX.Y.Z"),
        c(lambda r, _: bool(r.glob("{SECURITY.md,.github/SECURITY.md,docs/SECURITY.md}")), "SECURITY.md (private reporting)"),
        c(lambda r, _: bool(r.grep(".github/dependabot.yml", r"package-ecosystem:\s*github-actions")), "Dependabot for github-actions"),
        lambda r, _: _mcp_pinned(r, ["github"]) if "github" in _mcp(r) else Item(WARN, ".mcp.json github (read-only)", "merge the module fragment"),
    ],
    "api-contracts": [
        c(lambda r, _: bool(r.glob("contracts/*/openapi.{yaml,yml,json}")), "spec at contracts/<api>/openapi.yaml"),
        c(lambda r, _: bool(r.glob("contracts/*/openapi.{yaml,yml}")) and all(re.search(r"""^openapi:\s*["']?3\.1""", r.read(f), re.M) for f in r.glob("contracts/*/openapi.{yaml,yml}")), "OpenAPI 3.1"),
        c(lambda r, _: bool(r.glob(".spectral.yaml")), ".spectral.yaml"),
        c(lambda r, _: bool(r.glob(".github/workflows/api-contract.yml")), "api-contract workflow (Spectral + oasdiff)"),
    ],
    "database": [
        c(lambda r, _: bool(dotted(r.standards(), "database.engine")) and bool(dotted(r.standards(), "database.orm")), "standards.json database.engine + orm"),
        c(lambda r, _: bool(r.glob(".github/workflows/database.yml")), "database workflow (migrations from zero, drift, Squawk)"),
        c(lambda r, _: bool(r.glob(".squawk.toml")), ".squawk.toml"),
        c(lambda r, _: bool(r.glob("**/{migrations,alembic/versions,prisma/migrations,drizzle}/**")), "versioned migrations"),
        c(lambda r, _: not r.grep("**/*.{prisma,py,ts,sql}", r"\b(Float|float|real|double precision)\b[^\n]*(amount|price|fee|total|value)"), "no float money (heuristic)", severity=WARN),
    ],
    "observability": [
        c(lambda r, _: bool(r.glob("docs/runbooks/_template.md")), "runbook template"),
        c(lambda r, _: bool(r.glob("docs/postmortems/_template.md")), "postmortem template"),
        c(lambda r, _: bool({"@opentelemetry/sdk-node", "@sentry/nextjs", "@sentry/node"} & package_deps(r)) or bool({"opentelemetry-sdk", "sentry-sdk"} & pyproject_deps(r)) or bool({"sentry_flutter", "firebase_crashlytics"} & pubspec_deps(r)),
          "OpenTelemetry / error reporting SDK"),
        c(lambda r, _: bool(r.grep("**/*.{ts,py,php,js}", r"/health/live")) and bool(r.grep("**/*.{ts,py,php,js}", r"/health/ready")), "health endpoints /health/live + /health/ready"),
    ],
    "qa-e2e": [
        c(lambda r, _: bool(r.glob("e2e/JOURNEYS.md")) or bool(r.glob("**/e2e/JOURNEYS.md")), "e2e/JOURNEYS.md registry"),
        c(lambda r, _: not _node_web(r) or bool(r.glob("**/playwright.config.{ts,js}")), "Playwright config (web)"),
        c(lambda r, _: not _node_web(r) or bool(r.glob(".github/workflows/e2e.yml")), "E2E workflow (web)"),
        c(lambda r, _: not r.grep("**/*.{spec,test}.{ts,js}", r"waitForTimeout\("), "no fixed sleeps (waitForTimeout)"),
        c(lambda r, _: dotted(r.standards(), "infra.criticality") != "high" or bool(r.glob("perf/*.js")), "k6 thresholds for criticality high"),
        c(lambda r, _: not r.named("pubspec.yaml") or bool([d for d in r.dirs if d.endswith("integration_test")]), "integration_test/ (Flutter)", severity=WARN),
    ],
}


MANUAL_EXTRA: dict[str, list[str]] = {
    m: ["MCP server versions reviewed by the team before trusting them (the harness pins published versions ≥ 14 days old; Dependabot does not update `.mcp.json`)"]
    for m in ("aws", "azure", "terraform")
}


def checklist(module: str, skill_root: Path = SKILL_ROOT) -> list[str]:
    for group in ("stacks", "devops", "practices"):
        p = skill_root / "references" / group / f"{module}.md"
        if p.exists():
            text = p.read_text(encoding="utf-8")
            part = text.split("## Review checklist", 1)[-1] if "## Review checklist" in text else ""
            return [m.strip() for m in re.findall(r"^- \[ \] (.+)$", part, re.M)]
    return []


def audit(root: Path, modules: list[str], skill_root: Path = SKILL_ROOT) -> dict[str, tuple[list[Item], list[str]]]:
    repo = Repo.scan(root)
    return {m: ([chk(repo, {}) for chk in CHECKS.get(m, [])], checklist(m, skill_root) + MANUAL_EXTRA.get(m, [])) for m in modules}
