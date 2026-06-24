---
domain: Frontend (SPA / React, web)
audience: AI coding agents (Claude Code, Cursor)
context: Deltapag fintech UIs + personal-finance app (Moneo). Moneo targets people who struggle with financial organization, incl. ADHD users — clarity and visual calm are product requirements, not polish.
priority_order: correctness > security > accessibility > clarity/UX > performance > convenience
---

# Guardrails — Frontend

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human.

## Trust boundary

- MUST treat the frontend as untrusted and fully visible to the user. NEVER place a secret, private key, or privileged logic in client code. Anything in the bundle is public.
- MUST enforce every authorization and validation rule on the server too. Client-side validation is UX, never a security control.
- NEVER store tokens or session secrets in `localStorage` for auth that matters — prefer httpOnly cookies. If a token must live in JS memory, keep it out of persistent storage.
- MUST escape/encode all rendered user content. NEVER use `dangerouslySetInnerHTML` (or framework equivalents) with unsanitized input.

## State & data

- MUST treat server data as the source of truth; client state is a cache. Handle the three states of every async read explicitly: loading, error, empty. NEVER render a screen that silently shows nothing on failure.
- MUST handle the error state of every network call with a user-facing, recoverable message — NEVER a swallowed promise or a blank screen.
- MUST represent money as integer minor units or decimal, formatted for display via `Intl.NumberFormat` with the correct locale/currency. NEVER do money math in float.
- SHOULD make mutations optimistic only when safe to roll back; for financial actions, prefer pessimistic UI (confirm → pending → result) so the user never sees a false success.
- MUST debounce/guard double-submit on any button that triggers a mutation, especially payment or money-moving actions.

## Forms & input

- MUST validate on the client for fast feedback, but mirror the rule server-side.
- MUST show validation errors inline, next to the field, in plain language. NEVER rely on color alone to signal an error.
- SHOULD preserve user input on validation failure — never clear a form the user just filled.

## Accessibility & clarity (first-class for Moneo)

- MUST use semantic HTML (`button`, `label`, `nav`, headings in order). NEVER build a clickable `div` where a `button` belongs.
- MUST keep every interactive element keyboard-reachable and focus-visible. Meet WCAG AA contrast.
- MUST associate every input with a `<label>`; provide `aria-*` only when semantics can't.
- SHOULD reduce cognitive load: one primary action per screen, progressive disclosure, calm defaults, no flashing/auto-advancing content. For finance UIs, surface the pending/needs-attention items first and make the "what do I do next" obvious.
- SHOULD respect `prefers-reduced-motion` and `prefers-color-scheme` (ship both light + dark).

## Performance

- SHOULD code-split by route and lazy-load heavy/below-the-fold components.
- MUST set explicit dimensions on media to avoid layout shift; budget bundle size and flag large new dependencies.
- SHOULD memoize only measured hot paths — NEVER scatter `useMemo`/`useCallback` prophylactically.

## Hygiene

- NEVER hardcode API URLs, keys, or environment values — read from typed config/env.
- MUST keep components pure of side effects outside effects/handlers; no fetching during render.
- SHOULD co-locate tests for logic-bearing components; cover the error and empty states, not just the happy path.

## STOP-and-ask triggers

Halt before: introducing a new client-side storage of auth/PII, adding a heavy dependency, or shipping a payment/confirmation flow without a server-confirmed final state.
