---
description: Write the specification for an issue — what and why, no implementation
argument-hint: <issue number> [short title or paste of the issue]
---

Write `specs/<issue>-<kebab-case-title>/spec.md` for: $ARGUMENTS

Steps:

1. Read `docs/constitution.md` and `specs/README.md`. Read `specs/templates/spec.md` — it
   is the exact structure to follow.
2. Gather context from the repository: `docs/domain.md` for vocabulary, `docs/api-map.md`
   for what the backend already exposes, and the feature slices this touches.
   If the issue text was not pasted, fetch it with `gh issue view <number>`.
3. Create the folder, named with the issue number and a kebab-case title.
4. Fill the template.

Rules:

- **What and why only.** No file names, no library names, no component names. If you cannot
  state a requirement without them, it belongs in the plan.
- Number requirements `FR-001`, `FR-002`, … Each one individually testable (C-09).
- Write scenarios as Given / When / Then, in observable terms.
- **Do not resolve ambiguity by choosing.** Every unknown becomes
  `[NEEDS CLARIFICATION: <question>]` (C-10). A spec with markers is correct, not unfinished.
- Fill the Constitution Check by naming articles and saying how they are satisfied — not by
  ticking boxes.
- Fill Slice debt with the debt in the slices this change touches (C-11), and nothing else.
- Be explicit in Out of scope. It is the section that stops drift later.

Finish by reporting the requirement count and listing every clarification marker.
