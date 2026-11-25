# Module: Flutter (Dart, mobile-first)

Applies to: Android/iOS apps (including Android POS terminals). Builds on the `flutter` base layer ([../flutter.md](../flutter.md): dart format, analyzer with very_good_analysis, lcov coverage).

## 1. Architecture
```
lib/
  main_<flavor>.dart        entrypoints per environment (prod, test, sandbox)
  app/                      app widget, router, theme, DI
  core/                     http client, storage, errors, logging, l10n
  features/<feature>/
    data/                   DTOs, API/local data sources, repository implementations
    domain/                 entities, repository interfaces, use cases (pure Dart)
    presentation/           screens, widgets, view models / blocs
test/  integration_test/
```
- **MUST** feature-first folders with data/domain/presentation layers; `domain` has no Flutter imports.
- **MUST** one state-management approach per app (Riverpod **or** Bloc). Widgets don't call APIs or repositories directly.
- **MUST** navigation with `go_router` (typed routes); deep links tested.
- **SHOULD** immutable models with `freezed` + `json_serializable`; generated files excluded from coverage and the English-identifier check.

## 2. Environments and config
- **MUST** flavors / `--dart-define-from-file=env/<flavor>.json`; never hardcode URLs or keys. No secrets in the app bundle — anything shipped is public.
- **MUST** separate bundle IDs per flavor so test/sandbox builds install alongside prod.

## 3. Networking and data
- **MUST** single configured client (`dio` or `http`) with timeouts, auth interceptor, retry with backoff for idempotent calls, and typed error mapping.
- **MUST** handle offline and slow networks explicitly (loading, empty, error, retry states on every screen).
- **SHOULD** local persistence via `drift` (ORM) for structured data; `shared_preferences` only for trivial flags.

## 4. Security (payments apps)
- **MUST** tokens in `flutter_secure_storage` (Keychain/Keystore); never PAN, CVV or full track data stored or logged.
- **MUST** TLS only; certificate/public-key pinning for payment and auth hosts, with a rotation plan.
- **MUST** release builds with `--obfuscate --split-debug-info=<dir>` (symbols uploaded to crash reporting, not shipped).
- **SHOULD** root/jailbreak and debugger detection for payment flows; screenshot blocking on sensitive screens (Android `FLAG_SECURE`).
- POS terminals: device SDKs (card reader, printer) behind a platform-channel interface with a fake implementation for tests; Kotlin code in `android/` follows Kotlin lint (ktlint/detekt).

## 5. UI, i18n, accessibility
- **MUST** user-facing strings in ARB files via `gen-l10n` (native language, multi-language when declared); code identifiers English.
- **MUST** semantics labels, minimum tap targets (48dp), text scaling up to 200% without overflow, contrast checked.
- **SHOULD** design tokens in `ThemeData`/extensions; no hardcoded colors/sizes in widgets.
- **SHOULD** `const` constructors, small widgets, avoid rebuilding large trees; profile with DevTools before optimizing.

## 6. Tests
- Unit (domain, view models), widget tests per screen state, golden tests for key components (`alchemist`), `integration_test` for critical journeys (login, sale, receipt).
- Mocks with `mocktail`; fake repositories over mocks where possible.
- `flutter test --coverage` → `coverage/lcov.info`; exclude `*.g.dart`, `*.freezed.dart`, `l10n/`, `main_*.dart`.

## 7. Release and versioning
- **MUST** `pubspec.yaml` `version: X.Y.Z+N` — `X.Y.Z` = repo SemVer (`VERSION`), `N` = CI build number (monotonic).
- **MUST** signing keys/keystores only in CI secrets or a secrets manager; never in the repo (push ruleset blocks `.jks`/`.keystore`).
- **SHOULD** Fastlane (or equivalent) from GitHub Actions: rc tags → internal testing / TestFlight; `vX.Y.Z` → store release with staged rollout.
- **MUST** crash reporting and non-PII analytics (Sentry or Crashlytics) wired per flavor.
- CI: macOS runners only for iOS jobs (10× minute cost) — run them on release branches and `main`, not every PR.

## Review checklist
- [ ] All screen states (loading/empty/error/offline) handled
- [ ] No secret or sensitive data in bundle, logs or local storage
- [ ] Strings localized; a11y semantics present
- [ ] Version/build number correct for release
