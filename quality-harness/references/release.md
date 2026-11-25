# Release — SemVer, CHANGELOG, README, tags

## SemVer 2.0.0
- `VERSION` is the source of truth. Root `package.json` / `pyproject.toml` / `pubspec.yaml` (if present) must match (`pubspec` `+build` ignored). `lib/manifests.js`.
- `main` receives only stable versions, always greater than the last `vX.Y.Z` tag.
- Bump must cover the highest gitmoji `semver` impact since the last stable tag: 💥 major, ✨ minor, patch list in `gitmojis.json`. In `0.y.z`, breaking may go in minor. `release.js check` enforces it on release/hotfix PRs.

## CHANGELOG — Common Changelog
```md
# Changelog

## [1.2.0] - 2026-12-01

### Changed

- **Breaking:** require Node.js 20 ([`a1b2c3d`](https://github.com/OWNER/REPO/commit/a1b2c3d))

### Added

- Add login page ([#12](https://github.com/OWNER/REPO/pull/12)) (Author)

[1.2.0]: https://github.com/OWNER/REPO/releases/tag/v1.2.0
```
- Groups only Changed, Added, Removed, Fixed, in that order; breaking items first with `**Breaking:**`; every item linked (commit, PR or ticket); no `Unreleased`; newest first; reference links at the end. `lib/changelog.js` validates.
- Draft with git-cliff, then curate (merge, rewrite, drop noise): `git cliff --unreleased --tag vX.Y.Z --prepend CHANGELOG.md` (`cliff.toml` maps gitmojis to groups; set `GITHUB_REPOSITORY` for links).
- Item text follows `docs.languages[0]`.

## README per release
Every release PR must change `README.md` and mention the new version. Multi-language (`docs.languages` > 1): `README.<lang>.md` per extra language, all updated, all citing the version. `release-check` enforces.

## Tags
| Tag | When | Created by | Becomes |
|---|---|---|---|
| `vX.Y.Z` | release/hotfix merged into `main` | `release.yml` only | annotated (message = CHANGELOG section), immutable; GitHub Release *latest*; production deploy |
| `vX.Y.Z-rc.N` | each push to `release/vX.Y.Z` | `release.yml` | pre-release; deploy to `test` (or `sandbox`) |
| `vX`, `vX.Y` | with each stable, if `vars.MOVING_TAGS=true` | `release.yml` | moving pointers (libs/actions) |

People never create, move or delete tags (tag rulesets block them where the plan allows).

## Workflows
- `release-check` (PR → `main`): SemVer, bump vs commits, CHANGELOG, README(s), gitmoji title.
- `release`: tags + GitHub Release + `deploy.yml`; on `main` opens `🔀 Merge main into <trunk> (vX.Y.Z)` back-merge PRs (merge commit). With `vars.RELEASE_APP_ID` + `secrets.RELEASE_APP_KEY` the back-merge PR triggers checks (GITHUB_TOKEN PRs don't).
- `deploy.yml` + `scripts/deploy.sh`: stub per environment (`production` only from `v*` tags).

## Checklist (human)
1. Branch `release/vX.Y.Z` from `test` (or `main` in lean flow).
2. Bump `VERSION` + root manifests.
3. git-cliff draft → curate.
4. Update every README.
5. Commit `🔖 Release vX.Y.Z`, push → rc tag → validate in test.
6. PR to `main` with 🔖 template → green → squash.
7. Merge the back-merge PR with a merge commit.

Local: `node .github/scripts/release.js check --head release/vX.Y.Z --base main`.
