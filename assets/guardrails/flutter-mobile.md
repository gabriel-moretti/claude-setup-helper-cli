# Guardrails — Flutter Mobile (iOS / Android)

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human.
Load with `flutter.md`. Assumes the OWASP Mobile Top 10 as the security baseline.

## Storage & secrets on device

- MUST store tokens/credentials only in `flutter_secure_storage` (Keychain / Android Keystore). NEVER in `SharedPreferences`, plain files, or SQLite without encryption.
- MUST clear secure storage and in-memory session on logout. SHOULD exclude sensitive data from iCloud/Android auto-backup.
- NEVER cache PII or financial data in screenshots: SHOULD blur/secure sensitive screens in the app switcher (`FLAG_SECURE` on Android, overlay on iOS) for payment/balance screens.

## Network

- MUST use HTTPS only. NEVER add `NSAllowsArbitraryLoads` (iOS ATS) or `android:usesCleartextTraffic="true"` / permissive `network_security_config.xml` in release.
- NEVER override `HttpClient.badCertificateCallback` to return `true` in code reachable by release builds.
- SHOULD apply certificate/public-key pinning for money-moving APIs, with a documented rotation plan. STOP before shipping pinning without a backup pin.

## Permissions & platform config

- MUST request the minimum permissions, at the moment of use, with a PT-BR rationale (`NS*UsageDescription` in `Info.plist`, runtime rationale on Android). NEVER declare a permission the app doesn't use.
- MUST keep `android:exported` explicit on every component and `android:debuggable` off in release. NEVER ship `allowBackup="true"` for apps holding financial data without review.
- MUST validate deep links / universal links / app links input before acting on it — they are attacker-controlled input.

## Release & signing

- NEVER commit keystores (`*.jks`, `*.keystore`), `key.properties`, provisioning profiles, `.p12`, or App Store Connect API keys. They live in CI secrets / a secret store.
- MUST build release with `--obfuscate --split-debug-info=<dir>` and keep the symbols (git-ignored) for crash symbolication.
- MUST bump `version: x.y.z+build` in `pubspec.yaml` for every store upload; the build number never goes backwards.
- SHOULD enable R8/ProGuard for Android release and keep rules for reflection-based plugins.

## Testing

- SHOULD cover critical flows with integration tests (`integration_test` or Patrol) on both a real-size iOS simulator and an Android emulator.
- SHOULD test on the minimum supported OS versions declared in `Podfile`/`minSdkVersion`.

## STOP-and-ask triggers

Halt before: adding a new runtime permission, weakening ATS/cleartext/cert validation, touching signing config or keystores, adding native platform-channel code that handles credentials, or submitting to App Store / Play Store.
