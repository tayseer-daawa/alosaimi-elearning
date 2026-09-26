---
description: Write the technical plan for a clarified spec
argument-hint: <issue number>
---

Write `specs/$ARGUMENTS-*/plan.md` from the spec in the same folder.

Steps:

1. Read the spec. **If any `[NEEDS CLARIFICATION]` marker remains, stop** and tell the user
   to run `/clarify` first (C-10).
2. Read `docs/constitution.md`, the relevant ADRs, and the slices the spec names. Read the
   real code — do not plan against the documentation alone.
3. Follow `specs/templates/plan.md`.

Rules:

- Every choice traces back to a requirement id. A section serving no `FR-` is scope creep.
- Prefer what exists. Check `docs/api-map.md` before assuming an endpoint is missing, and
  the generated types in `src/client/types.gen.ts` before writing a new one.
- New dependency: justify why nothing already present will do, or drop it.
- Verification strategy must cover **every** requirement. A requirement with no executable
  check violates C-09 — send it back to the spec rather than inventing a check.
- List the slice debt to clear first, ordered, behaviour-preserving (C-11). Breaking
  changes are fine — there are no live users — but keep them out of the feature commits.
- A hard-to-reverse choice needs an ADR. Say so; do not bury it in the plan.

Finish with the Constitution Check and any deviation it exposes.
