---
description: Work an approved task checklist in order
argument-hint: <issue number> [task id to start from]
---

Implement `specs/$ARGUMENTS-*/tasks.md`.

Steps:

1. Read the spec, plan and tasks. Read `AGENTS.md` and `docs/constitution.md`.
2. Work the checklist **in order**. Tick each task in `tasks.md` as it completes.
3. Commit per phase, not per file. Format: `<type>(<scope>): <subject>` — CI enforces it.
   Phase 1 debt commits are separate from feature commits and change no behaviour.
4. Run what actually verifies the work, and report the real output:
   - `frontend/student` — `npm run lint` and `npm run build` (the type check is the gate)
   - `backend` — `uv run pytest`, `uv run ruff check .`
5. Phase 5: update the documents the tasks name, and set the spec status to `Implemented`.

Rules:

- **Do not invent work outside the checklist.** Something missing means the plan was wrong
  — say so and stop, rather than improvising.
- Stop and ask on any decision the spec does not settle (C-10). Do not guess.
- The student app has no test suite and no end-to-end coverage in CI. Never call a change
  verified because CI is green — state precisely what you ran and what remains unchecked.
- Do not copy `src/features/example/` or the names in `shared/api/mockData.ts`; both
  contradict the constitution. See AGENTS.md.

Finish with: tasks completed, commands run and their result, and anything left unverified.
