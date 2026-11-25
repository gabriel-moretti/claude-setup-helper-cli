# Guardrails — Flutter Web

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human.
Load with `flutter.md` and `frontend.md`. A Flutter Web build is a public JS/Wasm bundle — everything in it is readable.

## Trust boundary

- NEVER embed secrets in the web build (compiled `main.dart.js` / Wasm is trivially inspectable). Anything privileged goes through your backend.
- NEVER store auth tokens in `localStorage`/`shared_preferences` on web (backed by `localStorage`) for sessions that matter. Prefer httpOnly, `Secure`, `SameSite` cookies set by the backend.
- MUST enforce CORS on the API side with an explicit origin allow-list. NEVER `Access-Control-Allow-Origin: *` with credentials.

## Hosting & headers

- MUST serve over HTTPS with a Content-Security-Policy compatible with the chosen renderer (CanvasKit/Wasm needs `wasm-unsafe-eval` and the CanvasKit CDN or a self-hosted copy). NEVER fall back to `unsafe-eval` broadly to "make it load".
- SHOULD self-host CanvasKit (`--no-web-resources-cdn`) when CSP or offline requirements demand it.
- MUST configure the host for path-URL routing (rewrite unknown paths to `index.html`) if using `usePathUrlStrategy()`.
- MUST set a cache strategy: hashed assets long-cache, `index.html` and `flutter_bootstrap.js` no-cache — otherwise users get stuck on stale builds.

## Platform differences

- NEVER import `dart:io` in code compiled for web; use conditional imports or `kIsWeb` guards. Check every plugin's web support before adding it.
- SHOULD use the Wasm build (`flutter build web --wasm`) when all dependencies are compatible; verify JS-interop packages first.
- MUST check that text selection, browser back button, and keyboard navigation work — web users expect them.

## SEO & performance

- SHOULD NOT use Flutter Web for public, SEO-dependent marketing pages; keep those in HTML/Next.js and use Flutter Web for the app behind login.
- SHOULD use deferred imports (`deferred as`) for heavy routes and keep the initial bundle within a measured budget.

## STOP-and-ask triggers

Halt before: storing any auth/PII client-side, loosening CSP or CORS, or switching renderer (HTML/CanvasKit/Wasm) in production.
