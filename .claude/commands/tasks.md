---
description: Turn an approved plan into an ordered task checklist
argument-hint: <issue number>
---

Write `specs/$ARGUMENTS-*/tasks.md` from the spec and plan in the same folder.

Work on the implementation branch `/plan` created; if `plan.md` is missing, stop and say
to run `/plan` first. Copy `specs/templates/tasks.md` into the folder and follow it. Phases
in order: debt, contracts and types, implementation, verification, documentation,
self-review.

Rules:

- Each task is small enough to review on its own, and cites the `FR-` id it serves. A task
  with no id is either Phase 1 debt or does not belong.
- Order strictly by dependency. Debt lands before behaviour (C-11).
- Mark `[P]` only where tasks share no file.
- Phase 4 has one task per acceptance scenario in the spec, naming the scenario it proves.
- Phase 5 names the exact documents to update (C-12) and sets the spec status.
- Phase 6 is the fixed self-review list from the template. Copy it unchanged; it is not
  tailored per feature and it gates the pull request.
- Fill the Coverage table last and check it: every requirement in the spec appears in at
  least one task. A gap there is a gap in the plan — report it instead of papering over it.

Report the task count and any requirement left uncovered.
