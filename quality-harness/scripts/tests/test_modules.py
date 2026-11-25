"""Skill self-tests for optional modules. Run: python3 -m unittest discover scripts/tests"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent.parent
SKILL = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS))

import harness_modules as hm  # noqa: E402

FIXTURES: dict[str, dict[str, str]] = {
    "nextjs": {"apps/web/package.json": '{"dependencies": {"next": "15", "react": "19"}}', "apps/web/next.config.ts": "export default {}"},
    "nestjs": {"api/package.json": '{"dependencies": {"@nestjs/core": "11"}}', "api/nest-cli.json": "{}"},
    "fastapi": {"pyproject.toml": '[project]\nname = "svc"\nversion = "0.1.0"\ndependencies = ["fastapi>=0.115", "uvicorn[standard]"]\n'},
    "flutter": {"app/pubspec.yaml": "name: pos\ndependencies:\n  flutter:\n    sdk: flutter\n", "app/android/build.gradle": ""},
    "php": {"legacy/composer.json": '{"require": {"php": "^8.3"}}'},
    "terraform": {"infra/envs/prod/main.tf": 'terraform { required_version = ">= 1.10" }\n'},
    "aws": {"infra/envs/prod/versions.tf": 'terraform {\n  required_providers {\n    aws = { source = "hashicorp/aws", version = "~> 6.0" }\n  }\n}\n'},
    "azure": {"infra/main.tf": 'terraform {\n  required_providers {\n    azurerm = { source = "hashicorp/azurerm" }\n  }\n}\n'},
    "github": {".github/workflows/ci.yml": "name: ci\n"},
    "api-contracts": {"contracts/payments/openapi.yaml": "openapi: 3.1.0\n"},
    "database": {"prisma/schema.prisma": "datasource db { provider = \"postgresql\" }\n"},
    "observability": {"pyproject.toml": '[project]\nname = "svc"\nversion = "0.1.0"\ndependencies = ["opentelemetry-sdk"]\n'},
    "qa-e2e": {"playwright.config.ts": "export default {}\n"},
}


def make_repo(files: dict[str, str]) -> Path:
    root = Path(tempfile.mkdtemp(prefix="qh-"))
    for rel, content in files.items():
        p = root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
    return root


class DetectionTest(unittest.TestCase):
    def test_each_module_detected_by_its_fixture(self) -> None:
        catalog, _ = hm.load_catalog(SKILL)
        self.assertEqual(set(FIXTURES), set(catalog), "one fixture per module")
        for module, files in FIXTURES.items():
            with self.subTest(module=module):
                root = make_repo(files)
                try:
                    det = hm.detect(root, skill_root=SKILL)
                    self.assertIn(module, det.detected, f"{module}: {det.detected}")
                finally:
                    shutil.rmtree(root)

    def test_stack_module_needs_its_base_layer(self) -> None:
        root = make_repo({"android/build.gradle": "", "ios/Runner/Info.plist": ""})  # native app, no pubspec
        try:
            self.assertNotIn("flutter", hm.detect(root, skill_root=SKILL).detected)
        finally:
            shutil.rmtree(root)

    def test_github_default_and_recommendations(self) -> None:
        root = make_repo(FIXTURES["nextjs"])
        try:
            det = hm.detect(root, skill_root=SKILL)
            self.assertEqual(det.detected.get("github"), ["default"])
            self.assertIn("qa-e2e", det.recommended)
            self.assertNotIn("observability", det.suggested)
            self.assertIn("observability", hm.detect(root, in_production=True, skill_root=SKILL).suggested)
        finally:
            shutil.rmtree(root)

    def test_standards_signals(self) -> None:
        root = make_repo({".github/standards.json": json.dumps({"infra": {"hosting": "azure"}, "database": {"engine": "postgresql"}})})
        try:
            det = hm.detect(root, skill_root=SKILL)
            self.assertIn("azure", det.detected)
            self.assertIn("database", det.detected)
            self.assertIn("terraform", det.suggested)  # azure depends on terraform
        finally:
            shutil.rmtree(root)

    def test_glob_braces_and_globstar(self) -> None:
        rx = hm.glob_to_regex("**/openapi.{yaml,yml,json}")
        for ok in ("openapi.yaml", "a/b/openapi.json"):
            self.assertTrue(rx.match(ok), ok)
        self.assertFalse(rx.match("openapi.txt"))
        self.assertTrue(hm.glob_to_regex("**/migrations/**").match("app/migrations/0001.py"))


class ResolveTest(unittest.TestCase):
    def setUp(self) -> None:
        self.catalog, self.base = hm.load_catalog(SKILL)

    def test_depends_added_and_base_layers_reported(self) -> None:
        mods, added, need_base, _ = hm.resolve({"azure", "nextjs"}, self.catalog, self.base, None)
        self.assertTrue({"azure", "nextjs", "terraform", "github"} <= mods)
        self.assertEqual(added["terraform"], "azure")
        self.assertIn("node", need_base)
        self.assertNotIn("node", mods, "base layers are never modules")

    def test_aws_iac_resolution(self) -> None:
        tf, _, _, q = hm.resolve({"aws"}, self.catalog, self.base, {"infra": {"iac": "terraform"}})
        self.assertIn("terraform", tf)
        self.assertEqual(q, [])
        cdk, _, _, _ = hm.resolve({"aws"}, self.catalog, self.base, {"infra": {"iac": "cdk"}})
        self.assertNotIn("terraform", cdk)
        _, _, _, ask = hm.resolve({"aws"}, self.catalog, self.base, None)
        self.assertTrue(ask)

    def test_never_removes(self) -> None:
        mods, _, _, _ = hm.resolve({"php", "observability"}, self.catalog, self.base, None)
        self.assertTrue({"php", "observability"} <= mods)

    def test_known_modules_parity_with_lib_standards(self) -> None:
        js = (SKILL / "assets/core/.github/scripts/lib/standards.js").read_text(encoding="utf-8")
        listed = set(re.findall(r"'([a-z0-9-]+)'", js[js.index("KNOWN_MODULES = ["): js.index("];", js.index("KNOWN_MODULES = ["))]))
        self.assertEqual(listed, set(self.catalog))

    def test_every_module_has_reference_checks_and_checklist(self) -> None:
        for m in self.catalog:
            with self.subTest(module=m):
                self.assertIn(m, hm.CHECKS)
                self.assertTrue(hm.checklist(m, SKILL), f"{m}: review checklist found")


class ApplyTest(unittest.TestCase):
    def run_apply(self, root: Path, modules: str) -> str:
        out = subprocess.run([sys.executable, str(SCRIPTS / "apply_modules.py"), str(root), "--modules", modules],
                             capture_output=True, text=True, check=False)
        self.assertEqual(out.returncode, 0, out.stdout + out.stderr)
        return out.stdout

    def test_apply_is_additive_and_pins_mcp(self) -> None:
        files = dict(FIXTURES["nextjs"])
        files[".github/standards.json"] = json.dumps({"infra": {"iac": "terraform"}, "modules": ["php"]})
        files[".mcp.json"] = json.dumps({"mcpServers": {"github": {"type": "http", "url": "https://example.invalid/custom"}}})
        files["e2e/JOURNEYS.md"] = "existing"
        root = make_repo(files)
        try:
            report = self.run_apply(root, "aws,qa-e2e")
            std = json.loads((root / ".github/standards.json").read_text())
            self.assertTrue({"php", "aws", "terraform", "github", "qa-e2e"} <= set(std["modules"]), std["modules"])
            self.assertEqual((root / "e2e/JOURNEYS.md").read_text(), "existing", "never overwrites")
            self.assertTrue((root / ".github/workflows/cost-review.yml").exists())
            self.assertTrue((root / ".github/workflows/drift.yml").exists())
            self.assertTrue((root / "apps/web/playwright.config.ts").exists())
            self.assertTrue((root / ".github/workflows/e2e.yml").exists())
            self.assertFalse((root / ".github/workflows/database.yml").exists(), "unselected module workflow not installed")
            mcp = json.loads((root / ".mcp.json").read_text())["mcpServers"]
            self.assertEqual(mcp["github"]["url"], "https://example.invalid/custom", "existing server kept")
            self.assertIn("aws-pricing", mcp)
            self.assertNotIn("@latest", json.dumps(mcp))
            self.assertNotIn("PIN-REVIEWED-VERSION", json.dumps(mcp))
            self.assertRegex(json.dumps(mcp["aws-pricing"]), r"aws-pricing-mcp-server@\d+\.\d+\.\d+")
            self.assertIn("pinned versions to review", report)
        finally:
            shutil.rmtree(root)

    def test_unknown_module_rejected(self) -> None:
        root = make_repo({})
        try:
            out = subprocess.run([sys.executable, str(SCRIPTS / "apply_modules.py"), str(root), "--modules", "kubernetes"],
                                 capture_output=True, text=True, check=False)
            self.assertEqual(out.returncode, 1)
        finally:
            shutil.rmtree(root)

    def test_fastapi_wiring(self) -> None:
        root = make_repo({"pyproject.toml": FIXTURES["fastapi"]["pyproject.toml"] + '\n[tool.ruff.lint]\nselect = ["E", "F"]\n'})
        try:
            self.run_apply(root, "fastapi")
            self.assertIn('extend-select = ["ANN", "ASYNC"]', (root / "pyproject.toml").read_text())
        finally:
            shutil.rmtree(root)

    def test_assets_parse(self) -> None:
        for p in (SKILL / "assets/modules").glob("*/mcp.json"):
            servers = json.loads(p.read_text())["mcpServers"]
            self.assertNotIn("@latest", json.dumps(servers), p)
            self.assertNotIn("PIN-REVIEWED-VERSION", json.dumps(servers), p)
        if shutil.which("node"):
            out = subprocess.run(["node", "-e", "const s=require(process.argv[1]);const c=s.load(process.argv[2]);"
                                  "c.modules=['github','nextjs'];if(s.policy(c,process.argv[2]).errors.length)process.exit(1)",
                                  str(SKILL / "assets/core/.github/scripts/lib/standards.js"), "/nonexistent"], check=False)
            self.assertEqual(out.returncode, 0)


if __name__ == "__main__":
    unittest.main()
