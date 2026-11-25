#!/usr/bin/env python3
"""Detecta números de cartão (PAN) em arquivos de texto.

Critério: sequência de 13 a 19 dígitos (espaço/hífen permitidos entre eles),
prefixo de bandeira conhecida e dígito verificador Luhn válido.
Cartões de teste públicos são ignorados. A saída sempre mascara o número.

Uso:
    python3 scan_pan.py arquivo1 arquivo2 ...    # ex.: {staged_files} no lefthook
    python3 scan_pan.py --all                     # todos os arquivos versionados
Supressão pontual: inclua `pan:allow` na mesma linha, com o motivo.
Sem dependências externas (stdlib apenas).
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

CANDIDATE = re.compile(r"(?<![\w.])\d(?:[ -]?\d){12,18}(?!\w)")
MAX_BYTES = 5 * 1024 * 1024
MIN_PAN_LEN, MAX_PAN_LEN = 13, 19
LUHN_MAX_DIGIT = 9
SKIP_SUFFIXES = {
    ".lock",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
    ".jar",
    ".keystore",
    ".jks",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".so",
    ".dylib",
}
SKIP_NAMES = {"pnpm-lock.yaml", "package-lock.json", "yarn.lock", "uv.lock", "pubspec.lock"}

# Cartões de teste publicados por bandeiras/adquirentes/gateways
TEST_PANS = {
    "4111111111111111",
    "4012888888881881",
    "4222222222222",
    "4242424242424242",
    "4000056655665556",
    "4000000000000002",
    "4000000000000010",
    "4000000000000077",
    "5555555555554444",
    "5105105105105100",
    "5200828282828210",
    "2223003122003222",
    "378282246310005",
    "371449635398431",
    "378734493671000",
    "6011111111111117",
    "6011000990139424",
    "30569309025904",
    "38520000023237",
    "3530111333300000",
    "3566002020360505",
}

# (início, fim) inclusivos sobre os primeiros 6 dígitos
BRAND_RANGES: list[tuple[str, int, int]] = [
    ("visa", 400000, 499999),
    ("mastercard", 510000, 559999),
    ("mastercard", 222100, 272099),
    ("amex", 340000, 349999),
    ("amex", 370000, 379999),
    ("diners", 300000, 305999),
    ("diners", 360000, 369999),
    ("diners", 380000, 389999),  # inclui Hipercard 3841xx
    ("jcb", 352800, 358999),
    ("discover", 601100, 601199),
    ("discover", 644000, 659999),  # inclui Elo 65xxxx
    ("elo", 506699, 506778),
    ("elo", 509000, 509999),
    ("elo", 627780, 627780),
    ("elo", 636297, 636297),
    ("elo", 636368, 636368),
    ("hipercard", 606282, 606282),
]


def luhn_ok(number: str) -> bool:
    total = 0
    for i, ch in enumerate(reversed(number)):
        d = ord(ch) - 48
        if i % 2 == 1:
            d *= 2
            if d > LUHN_MAX_DIGIT:
                d -= 9
        total += d
    return total % 10 == 0


def brand(number: str) -> str | None:
    prefix = int(number[:6])
    for name, lo, hi in BRAND_RANGES:
        if lo <= prefix <= hi:
            return name
    return None


def mask(number: str) -> str:
    return f"{number[:6]}{'*' * (len(number) - 10)}{number[-4:]}"


def should_skip(path: Path) -> bool:
    if path.name in SKIP_NAMES or path.suffix.lower() in SKIP_SUFFIXES:
        return True
    try:
        return not path.is_file() or path.stat().st_size > MAX_BYTES
    except OSError:
        return True


def scan_file(path: Path) -> list[tuple[int, str, str]]:
    try:
        raw = path.read_bytes()
    except OSError:
        return []
    if b"\x00" in raw[:8192]:  # binário
        return []
    text = raw.decode("utf-8", errors="ignore")
    hits: list[tuple[int, str, str]] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        if "pan:allow" in line:
            continue
        for match in CANDIDATE.finditer(line):
            digits = re.sub(r"[ -]", "", match.group())
            if not MIN_PAN_LEN <= len(digits) <= MAX_PAN_LEN or digits in TEST_PANS:
                continue
            if len(set(digits)) == 1:  # 0000000000000000 etc.
                continue
            name = brand(digits)
            if name and luhn_ok(digits):
                hits.append((lineno, name, mask(digits)))
    return hits


def tracked_files() -> list[str]:
    out = subprocess.run(["git", "ls-files", "-z"], capture_output=True, check=True)  # noqa: S607
    return [p for p in out.stdout.decode().split("\0") if p]


def main(argv: list[str]) -> int:
    files = tracked_files() if argv == ["--all"] else argv
    findings = 0
    for name in files:
        path = Path(name)
        if should_skip(path):
            continue
        for lineno, card_brand, masked in scan_file(path):
            findings += 1
            sys.stderr.write(f"{path}:{lineno}: possível PAN {card_brand} {masked}\n")
    if findings:
        sys.stderr.write(
            f"\n✖ {findings} possível(is) número(s) de cartão encontrado(s).\n"
            "  Use um cartão de teste público em fixtures. Se for falso positivo,\n"
            "  adicione `pan:allow <motivo>` na linha. PAN real no histórico remoto\n"
            "  é incidente PCI — acione o procedimento de resposta.\n",
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
