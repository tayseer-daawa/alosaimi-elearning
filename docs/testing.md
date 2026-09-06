# Testing and verification

[← Back to docs index](./README.md)

**What is actually verified, and what only looks verified.** Read this before you report a
change as working.

---

## Coverage today

| Part | Automated tests | Runs in CI |
| --- | --- | --- |
| `frontend/student` | **none** — no test files, no `test` script | lint and type-check only |
| `frontend/admin` | 4 Playwright specs in `tests/` | ✅ `playwright.yml` |
| `backend` | pytest with coverage | ✅ `test-backend.yml` |

The student app is the one under active development and the one with no test coverage.
Its `playwright.config.ts` is a leftover from the template and does not work: `testDir`
points at `./tests`, which does not exist, and `baseURL` is `http://localhost:5173` — the
admin app's port. Wiring it is not done.

CI's Playwright job builds from `frontend/admin` (`docker-compose.override.yml`) and merges
its report from that directory. **A green Playwright run says nothing about the student
app.**

---

## What CI runs

| Workflow | Checks |
| --- | --- |
| `commit-compliance.yml` | Commit message format |
| `lint-frontend.yml` | `biome ci` over both frontends |
| `lint-backend.yml` | `ruff` |
| `test-backend.yml` | pytest with coverage |
| `playwright.yml` | Admin app end-to-end, sharded |
| `test-docker-compose.yml` | Smoke test: health-check plus both frontend ports respond |
| `generate-client.yml` | Generated client is not stale |

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

## Reporting a change

Because the student app has no tests, a green pipeline is not evidence that a student-app
change works.

- **Say what you actually ran.** Name the commands and their result.
- **Do not infer working from green CI.** For the student app, CI proves it lints and
  type-checks, nothing more.
- **If a change cannot be checked, say so.** An unverifiable change reported as verified is
  worse than an unverified one.
