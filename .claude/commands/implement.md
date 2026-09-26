---
description: Work an approved task checklist in order
argument-hint: <issue number> [task id to start from]
---

Implement `specs/$ARGUMENTS-*/tasks.md`.

Steps:

1. Read the spec, plan and tasks. Read `docs/constitution.md` and `docs/testing.md`.
2. Work the checklist **in order**. Tick each task in `tasks.md` as it completes.
3. Commit per phase, not per file. Format: `<type>(<scope>): <subject>` — CI enforces it.
   Phase 1 debt commits are separate from feature commits and change no behaviour.
4. Run what actually verifies the work and report the real output. `docs/testing.md` lists
   the commands per application and what each one proves.
5. Phase 5: update the documents the tasks name, and set the spec status to `Implemented`.

Rules:

- **Do not invent work outside the checklist.** Something missing means the plan was wrong
  — say so and stop, rather than improvising.
- Stop and ask on any decision the spec does not settle (C-10). Do not guess.
- Never call a change verified because CI is green — state precisely what you ran and what
  remains unchecked. `docs/testing.md` says what CI does and does not prove.
- Do not copy the reference code or the fixture names flagged in
  `frontend/student/docs/feature-status.md`; both contradict the constitution.

Finish with: tasks completed, commands run and their result, and anything left unverified.
