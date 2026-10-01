# 0002 — Generate the API client from OpenAPI

**Status:** Accepted
**Date:** 2025-12

## Context

Every entity in the backend is keyed by UUID, and the public response shapes differ from
the database models (`ProgramPublic` flattens a bitmask into a list of day names, for
example). Hand-written `fetch` calls would carry hand-written types, and those types drift
from the backend silently — the compiler cannot tell you that a field was renamed on the
server last week.

The backend already publishes a complete OpenAPI schema.

## Decision

Generate the client. `scripts/generate-client.sh` dumps the schema from `app.main` and
runs `@hey-api/openapi-ts` for both frontends, producing `src/client/`:

- `sdk.gen.ts` — one `*Service` class per resource, with static methods
- `types.gen.ts` — request and response types for every operation
- `schemas.gen.ts` — the raw JSON schemas

The generated directory is excluded from Biome and is never hand-edited. CI regenerates it
on pull requests to catch drift.

Authentication is layered on top rather than generated: a single request interceptor in
`src/main.tsx` reads the token from localStorage and sets the `Authorization` header for
every call.

## Alternatives considered

- **Hand-written repository functions per feature.** Rejected for the drift reason above.
- **`openapi-fetch` or a lighter generator.** The template already shipped
  `@hey-api/openapi-ts` and the axios transport; no reason to change it.

## Consequences

- Backend changes surface as TypeScript errors instead of runtime failures.
- `sdk.gen.ts` is over 1600 lines. Grep it for the method you need; do not read it whole,
  and do not paste it into an AI context window.
- **A second, older HTTP path still exists**: `src/shared/api/fetcher.tsx`, a raw `fetch`
  wrapper reading a different environment variable (`VITE_API_BASE` rather than
  `VITE_API_URL`) and sending no `Authorization` header. Only `src/features/example/`
  uses it. It should be removed once the example feature is retired — until then, treat
  the generated client as the only real HTTP layer.
