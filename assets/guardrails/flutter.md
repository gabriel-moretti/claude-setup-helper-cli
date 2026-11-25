# Guardrails — Flutter / Dart

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human.
Applies to every Flutter target. Load together with `frontend.md` (trust boundary, a11y, money display) and the per-target file (`flutter-mobile.md`, `flutter-web.md`, `flutter-desktop.md`).

## Secrets & config

- MUST treat the compiled app as public. NEVER put API secrets, service-role keys, or signing material in Dart code, assets, `--dart-define`, or `--dart-define-from-file` — all of them are recoverable from the binary/bundle.
- MUST keep `--dart-define-from-file` JSON files with real values git-ignored; commit a `*.example.json` with placeholders.
- NEVER commit `google-services.json` / `GoogleService-Info.plist` / `firebase_options.dart` for production projects without confirming they contain only public client config.

## Code quality gate

- MUST keep `flutter analyze` clean with a strict `analysis_options.yaml` (`flutter_lints` or `very_good_analysis`). NEVER add blanket `// ignore_for_file:` to silence lints; suppress a specific rule with a PT-BR justification.
- MUST run `dart format --set-exit-if-changed .`, `flutter analyze`, and `flutter test` before committing.
- MUST keep sound null safety; NEVER use `!` on values from network/storage without a prior check — parse into typed models at the boundary.
- SHOULD generate JSON models (`json_serializable`/`freezed`) instead of hand-indexing `Map<String, dynamic>` across the app.

## State & architecture

- MUST stick to the project's single state-management approach (Riverpod / Bloc / Provider). NEVER introduce a second one for a new feature.
- MUST keep business logic out of widgets: widgets render state, notifiers/blocs/repositories own logic and I/O. NEVER call HTTP or storage from `build()`.
- MUST dispose controllers, streams, timers, and subscriptions. NEVER leak a `StreamSubscription`.
- MUST handle loading / error / empty for every async state (`AsyncValue`, bloc states) — NEVER a spinner forever or a blank screen on failure.

## Money & data

- MUST represent money as `int` minor units (cents) or a decimal package. NEVER use `double` for amounts. Format with `intl` `NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$')`.
- NEVER log PII, tokens, or card data via `print`/`debugPrint`/`log`. Strip debug logging from release builds.

## UI

- MUST route user-facing strings through `flutter_localizations` / ARB files (keys English, PT-BR values). NEVER hardcode Portuguese copy inside widgets.
- MUST provide `Semantics`/labels for icon-only buttons and respect text scaling (no fixed-height text containers that clip at 200%).
- SHOULD use `const` constructors and `ListView.builder`/slivers for long lists; measure with DevTools before optimizing further.

## Dependencies

- MUST commit `pubspec.lock` for apps. SHOULD prefer verified-publisher, well-maintained packages on pub.dev.
- STOP before adding a package that handles auth, crypto, payments, or native platform channels — show publisher, popularity, and last release first.

## STOP-and-ask triggers

Halt before: adding a secret anywhere in the client, adding a sensitive-path dependency, switching state-management approach, or bumping the Flutter/Dart SDK constraint.
