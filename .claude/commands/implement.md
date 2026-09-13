---
description: Work an approved task checklist in order
argument-hint: <issue number> [task id to start from]
---

Implement `specs/$ARGUMENTS-*/tasks.md`.

Steps:

1. Read the spec, plan and tasks. Read `docs/constitution.md` and `docs/testing.md`.
   The specs folder must already be on `main` — if it is only on a `<issue>-specs-*`
   branch, the specs pull request has not merged; stop and say so.
2. Create the implementation branch `<issue>-<area>-<kebab-case-title>` from `main`. This
   is the first moment a feature branch exists.
3. Work the checklist **in order**. Tick each task in `tasks.md` as it completes.
4. Commit per phase, not per file. Format: `<type>(<scope>): <subject>` — CI enforces it.
   Phase 1 debt commits are separate from feature commits and change no behaviour.
5. Run what actually verifies the work and report the real output. `docs/testing.md` lists
   the commands per application and what each one proves.
6. Phase 5: update the documents the tasks name, and set the spec status to `Implemented`.
7. Phase 6: work the self-review list against the **diff**, not against memory of writing
   it. Tick each item only when it holds; an item that does not hold is a task to fix,
   not a box to leave.
8. **Open the pull request only when every Phase 6 item is ticked.** If asked to open it
   earlier, refuse and name the unticked items.

Rules:

- **Do not invent work outside the checklist.** Something missing means the plan was wrong
  — say so and stop, rather than improvising.
- Stop and ask on any decision the spec does not settle (C-10). Do not guess.
- Never call a change verified because CI is green — state precisely what you ran and what
  remains unchecked. `docs/testing.md` says what CI does and does not prove.
- Do not copy the reference code or the fixture names flagged in
  `frontend/student/docs/feature-status.md`; both contradict the constitution.

Finish with: tasks completed, commands run and their result, the Phase 6 outcome, and
anything left unverified.
