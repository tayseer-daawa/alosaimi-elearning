# Testing and verification

[← Back to docs index](./README.md)

**What is actually verified, and what only looks verified.** Read this before you report a
change as working.

---

## Coverage today

| Part | Automated tests | Runs in CI |
| --- | --- | --- |
| `frontend/student` | **none** — no test files, no `test` script | lint only, plus an indirect type-check |
| `frontend/admin` | 4 Playwright specs in `tests/` | ✅ `playwright.yml` |
| `backend` | pytest with coverage | ✅ `test-backend.yml` |

The student app is the one under active development and the one with no test coverage.
Its `playwright.config.ts` is a leftover from the template and does not work: `testDir`
points at `./tests`, which does not exist, and `baseURL` is `http://localhost:5173` — the
admin app's port. Wiring it is not done.

CI's Playwright job builds from `frontend/admin` (`docker-compose.override.yml`) and merges
its report from that directory. **A green Playwright run says nothing about the student
app.**

`lint-frontend.yml` runs `biome ci` and nothing else — it does **not** type-check. The
student app's `tsc` only runs as a side effect of `test-docker-compose.yml`, whose
`docker compose build` step builds `frontend/student/Dockerfile`, which runs `npm run build`.
So a type error does fail CI, but through the Docker job, not the lint job.

---

## What CI runs

| Workflow | Checks |
| --- | --- |
| `commit-compliance.yml` | Commit message format |
| `lint-frontend.yml` | `biome ci` over both frontends |
| `lint-backend.yml` | `ruff` |
| `test-backend.yml` | pytest with coverage |
| `playwright.yml` | Admin app end-to-end, sharded |
| `test-docker-compose.yml` | Builds every image — **the only place `tsc` runs** — then health-check plus both frontend ports respond |
| `generate-client.yml` | Generated client is not stale |
| `smokeshow.yml` | Publishes the backend coverage report; proves nothing on its own |
| `detect-conflicts.yml` | Flags merge conflicts against `main` |

`playwright.yml` and `test-docker-compose.yml` still trigger on pushes to `master`, a branch
that does not exist here. They run on pull requests, which is what matters, but the push
trigger is dead.

---

## What you can run locally

```bash
cd frontend/student
npm run lint      # biome check --write --unsafe
npm run build     # tsc, then vite build — the type check is the real gate
```

```bash
cd backend
uv run pytest
uv run ruff check .
```

There is no `npm test` in either frontend. For the student app, `npm run build` is the
strongest check available, because `tsconfig` has `strict`, `noUnusedLocals` and
`noUnusedParameters` on.

---

## `.gitignore` will hide your test files

Both frontends carry blanket rules inherited from the template:

```
*.md
*.test.ts
*.spec.ts
```

Negations below them re-include `docs/**/*.md` and `**/*.{test,spec}.ts`, so documentation
and a new test suite are tracked. Everything else those rules cover is still hidden — a
`NOTES.md` at the root of either frontend is invisible to git with no warning, and nothing
tells you.

Check before you assume a file was committed:

```bash
git check-ignore -v <path>
```

---

## The student app cannot satisfy C-09 yet

[C-09](./constitution.md#c-09--every-requirement-is-verifiable) says every requirement is
checkable by a test, a type, or a lint rule. In `frontend/student` only the last two are
available: there is no runner, no `npm test`, and `playwright.config.ts` does not work.

So for a student-app spec today:

- Prefer requirements a **type** or a **lint rule** can hold up. Those are real checks.
- Where only a runtime check will do, write it in the plan as a **manual** step and say so
  in the verification table. Do not enter it as if something executes it.
- Wiring a runner is tracked as follow-up work, not part of any feature spec.

---

## Reporting a change

Because the student app has no tests, a green pipeline is not evidence that a student-app
change works.

- **Say what you actually ran.** Name the commands and their result.
- **Do not infer working from green CI.** For the student app, CI proves it lints and
  type-checks, nothing more.
- **If a change cannot be checked, say so.** An unverifiable change reported as verified is
  worse than an unverified one.
