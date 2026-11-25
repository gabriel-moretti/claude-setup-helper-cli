#!/usr/bin/env python3
"""Thin wrapper around .github/scripts/coverage.js (the single coverage gate).

Removes generated-code records (.g.dart, .freezed.dart, .mocks.dart, /generated/) from an
lcov file, then delegates the threshold check to coverage.js. Used by the Flutter CI step.

Usage:
    python3 check_lcov.py coverage/lcov.info --min 75 [--label app] [--advisory] \\
        [--exclude REGEX ...]
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

DEFAULT_EXCLUDES = [r"\.g\.dart$", r"\.freezed\.dart$", r"\.mocks\.dart$", r"/generated/"]


def repo_root() -> Path:
    workspace = os.environ.get("GITHUB_WORKSPACE")
    if workspace:
        return Path(workspace)
    out = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],  # noqa: S607
        capture_output=True,
        text=True,
        check=False,
    )
    return Path(out.stdout.strip() or ".")


def filter_lcov(text: str, excludes: list[re.Pattern[str]]) -> str:
    kept: list[str] = []
    record: list[str] = []
    skip = False
    for line in text.splitlines():
        if line.startswith("SF:"):
            record, skip = [line], any(p.search(line[3:]) for p in excludes)
            continue
        record.append(line)
        if line == "end_of_record":
            if not skip:
                kept.extend(record)
            record = []
    return "\n".join(kept) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("lcov", type=Path)
    parser.add_argument("--min", required=True)
    parser.add_argument("--label", default=".")
    parser.add_argument("--advisory", action="store_true")
    parser.add_argument("--exclude", action="append", default=[])
    args = parser.parse_args()

    coverage_js = repo_root() / ".github/scripts/coverage.js"
    if not args.lcov.exists():
        cmd = ["node", str(coverage_js), str(args.lcov), "--min", args.min, "--label", args.label]
        return subprocess.call(cmd + (["--advisory"] if args.advisory else []))  # noqa: S603

    excludes = [re.compile(p) for p in DEFAULT_EXCLUDES + args.exclude]
    filtered = filter_lcov(args.lcov.read_text(encoding="utf-8"), excludes)
    with tempfile.NamedTemporaryFile("w", suffix=".info", delete=False, encoding="utf-8") as tmp:
        tmp.write(filtered)
    try:
        cmd = ["node", str(coverage_js), tmp.name, "--min", args.min, "--label", args.label]
        return subprocess.call(cmd + (["--advisory"] if args.advisory else []))  # noqa: S603
    finally:
        Path(tmp.name).unlink(missing_ok=True)


if __name__ == "__main__":
    sys.exit(main())
