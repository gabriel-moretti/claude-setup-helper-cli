# Guardrails — Flutter Desktop (macOS / Windows / Linux)

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human.
Load with `flutter.md`. Desktop apps run with the user's privileges and are easily reverse-engineered — treat the binary as public.

## Secrets & storage

- MUST store credentials in the OS secret store (`flutter_secure_storage` → Keychain / Windows Credential Manager / libsecret). NEVER in plaintext files under the app support dir.
- NEVER ship secrets in the binary or bundled assets.
- MUST write app data only under the platform app-support/documents dirs (`path_provider`). NEVER write next to the executable or in system dirs.

## Sandboxing & entitlements (macOS)

- MUST keep the App Sandbox enabled and request only the entitlements in use (`com.apple.security.network.client`, file access scopes) in both `DebugProfile.entitlements` and `Release.entitlements`.
- STOP before adding broad entitlements (disable sandbox, `files.all`, JIT/unsigned-memory exceptions) — show why and what it exposes.

## Files, processes & input

- MUST validate and normalize every path that comes from the user, drag-and-drop, or a file picker; NEVER build paths by string concatenation with untrusted input.
- NEVER run `Process.run`/`Process.start` with a shell string built from user input — pass an argument list and allow-list the executable.
- MUST treat custom URL schemes / file associations as hostile input.

## Signing, distribution & updates

- MUST code-sign release builds: Developer ID + notarization on macOS, Authenticode on Windows (MSIX or signed installer). NEVER distribute unsigned binaries to users.
- NEVER commit signing certificates, `.p12`, notarization credentials, or Windows `.pfx` files — CI secrets only.
- MUST deliver auto-updates only over HTTPS with signature verification of the update package (e.g. Sparkle EdDSA, MSIX). NEVER download-and-execute an unsigned update.

## Platform behavior

- SHOULD support window resizing down to a sensible minimum, keyboard shortcuts, menus (macOS menu bar via `PlatformMenuBar`), and mouse hover states.
- MUST guard platform-specific code (`Platform.isMacOS` / conditional imports) and verify each plugin supports every desktop target you ship.

## STOP-and-ask triggers

Halt before: widening macOS entitlements or disabling the sandbox, adding process execution, changing signing/notarization setup, or shipping an auto-update channel.
