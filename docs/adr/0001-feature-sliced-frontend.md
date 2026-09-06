# 0001 — Feature-sliced structure for the student app

**Status:** Accepted
**Date:** 2025-12

## Context

The student app was scaffolded from `full-stack-fastapi-template`, whose admin frontend
groups code by technical type: `components/`, `hooks/`, `routes/`. The student app has a
small number of screens but each one carries real domain logic — a five-step signup
wizard, a nested content hierarchy, an audio player — and that logic is not shared between
screens.

Grouping by type would scatter one feature across four directories, and put unrelated
features next to each other in every one of them.

## Decision

Group by feature. Each feature owns a directory under `src/features/`:

```
src/features/<name>/
  components/   *Screen.tsx is the page root, then leaf components
  hooks/        feature state, e.g. useSignupWizard
  api/          repository + React Query hooks
```

Anything genuinely shared is hoisted to `src/shared/`. Route files under `src/routes/`
stay thin — they import a screen and mount it, nothing more.

`src/features/example/` was added as a reference implementation of the layering. **Only its
directory shape holds up** — its contents predate the constitution and contradict it, and it
is mounted at `/example`, so it ships. Take the shape from the tree above, never the code:
[feature-status.md](../../frontend/student/docs/feature-status.md#reference-code-that-is-wrong)
lists what is wrong with it.

## Alternatives considered

- **Keep the template's type-based layout.** Rejected: consistency with `frontend/admin`
  is worth little, since the two apps share no code and have different shapes.
- **Full feature-sliced-design (`entities` / `features` / `widgets` layers).** Rejected as
  too much ceremony for an app this size.

## Consequences

- A feature can be read, reviewed or deleted in one directory.
- The two frontends now have different internal structures. That is accepted; they are
  separate applications that only share a stack.
- The layering rule inside `api/` — repository does REST only, hooks do React Query,
  components render — is a convention, not something the compiler enforces. It has to be
  held up in review.
- The one worked example of the layering is `src/features/example/`, whose code is wrong.
  Until a real slice replaces it, the structure has to be learned from this ADR and from
  [data-fetching.md](../../frontend/student/docs/data-fetching.md).
