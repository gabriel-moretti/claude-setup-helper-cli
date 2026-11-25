# Stack: python (uv + Ruff + mypy + pytest)

| Concern | Tool |
|---|---|
| Env/deps | **uv** (`uv.lock` committed; CI `uv sync --locked`) |
| Format | **Ruff format** |
| Lint + imports + security | **Ruff check** (replaces Black, isort, Flake8, most of Bandit) |
| Types | **mypy** (pyright acceptable; one per repo) |
| Tests/coverage | **pytest + pytest-cov** → `coverage/lcov.info` |
| Dep audit | **pip-audit** via `uvx` (CI, warning only) |

## Setup
1. Merge `assets/python/pyproject.quality.toml` into `pyproject.toml` (`[tool.*]` + dev group). Set Ruff `target-version` and mypy `python_version` to `requires-python` min.
2. `uv add --dev ruff mypy pytest pytest-cov`.
3. `.lefthook/python.yml` ← `assets/python/lefthook.python.yml`.
4. Append `assets/python/dependabot.python.yml` to `.github/dependabot.yml`.

Defaults: `line-length = 100`; rules `E,W,F,I,UP,B,S,SIM,C4,RET,PTH,N,C90(max 10),PL,T20,DTZ,ERA,RUF`; tests allow `S101`, `PLR2004`. No `fail_under` — `coverage.cjs` is the only gate (75/85).

Django: `django-stubs[compatible-mypy]` + `mypy_django_plugin.main`; Ruff `DJ`; exclude `**/migrations/**`. FastAPI: Ruff `FAST`; `extend-immutable-calls` for `fastapi.Depends/Query/Header/Body/Path` instead of ignoring `B008`; `pydantic.mypy` plugin. FastAPI framework rules: [stacks/fastapi.md](stacks/fastapi.md) — selecting it adds Ruff `extend-select = ["ANN", "ASYNC"]` (base `select` unchanged).

## Hooks
pre-commit: `ruff check --fix` + `ruff format` on staged (`stage_fixed`). pre-push: `mypy .`, `pytest -x -q -m "not slow"` (exit 5 = no tests, tolerated).

## CI (in `ci.yml` matrix)
`ruff format --check` · `ruff check` · `mypy` (skipped with notice if unconfigured) · `pytest --cov --cov-report=lcov:coverage/lcov.info` · `coverage.cjs` · `pip-audit` (continue-on-error).
