# Stack: flutter (dart format + analyzer + flutter test)

| Concern | Tool |
|---|---|
| Format | `dart format` |
| Lint/types | `flutter analyze --fatal-infos` with `very_good_analysis` (default) or `flutter_lints` (RETROFIT of big apps, tighten later) |
| Tests/coverage | `flutter test --coverage` → `coverage/lcov.info` → `scripts/quality/check_lcov.py` (drops `.g.dart`, `.freezed.dart`, `.mocks.dart`, `/generated/`) → `coverage.js` |
| Deps | Dependabot `pub` |

## Setup
1. `flutter pub add --dev very_good_analysis`; copy `assets/flutter/analysis_options.yaml` (excludes generated code, strict casts/inference/raw types, `public_member_api_docs: false` for apps).
2. Line width 80 (Dart ≥ 3.7 can set `formatter: page_width`); `.editorconfig` has `[*.dart]`.
3. `.lefthook/flutter.yml` ← `assets/flutter/lefthook.flutter.yml`; append `assets/flutter/dependabot.flutter.yml`.
4. Root `pubspec.yaml` `version:` must equal `VERSION` (`+build` ignored).

App rules (architecture, flavors, security, POS device SDKs + Kotlin lint, local DB, release): module [stacks/flutter.md](stacks/flutter.md); selecting it adds coverage excludes `l10n/` and `main_*.dart` to the CI step.

## Hooks
pre-commit: `dart format` on staged (generated excluded). pre-push: `flutter analyze --fatal-infos`, `flutter test`.
