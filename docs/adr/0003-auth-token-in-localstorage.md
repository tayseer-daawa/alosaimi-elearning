# 0003 — Store the auth token in localStorage

**Status:** Accepted, with known gaps
**Date:** 2026-01

## Context

The backend issues a JWT from `POST /api/v1/login/access-token`. The student app needed to
persist it across reloads and attach it to every request, and needed a way to decide
whether a route is reachable.

## Decision

- The token is stored in `localStorage` under `access_token`, alongside a minimal
  `student_profile` object.
- A request interceptor registered in `src/main.tsx` reads it and sets
  `Authorization: Bearer …` on every generated-client call.
- Route protection lives in a single place: `beforeLoad` on `src/routes/_layout.tsx`,
  which every page sits under. It checks for the presence of the token and redirects
  either to `/welcome` or to `/`.

## Alternatives considered

- **An httpOnly cookie.** Materially safer against XSS, but requires backend changes
  (cookie issuance, CSRF protection, CORS credentials). Not available when auth was built.
- **In-memory only.** Rejected: the session would not survive a page reload.
- **A React auth context.** Rejected for now; `localStorage` plus the route guard covers
  the current needs without a provider, and there is no reactive auth state in the UI yet.

## Consequences

Accepted risks and gaps, all currently live:

- **The token is readable by any script on the page.** Standard localStorage trade-off.
- **The guard only checks that a string exists.** An expired JWT passes it, and every
  subsequent request returns 401 with no redirect back to login. A global 401 handler is
  the missing piece.
- **There is no refresh flow and no revocation on logout** — logout simply clears the two
  localStorage keys. Backend-side this is tracked as issue #68; the frontend will need to
  follow whatever that lands on.
- Auth state is not reactive: changing `localStorage` in another tab does not update this
  one.

Revisit this ADR when issue #68 is resolved. Any replacement should supersede it rather
than edit it.
