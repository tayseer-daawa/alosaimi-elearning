# Working in this repository

Instructions for any AI agent or new contributor. **How to work** lives here; **what the
system is** lives in [`docs/`](./docs/README.md). Keep it that way — facts that change with
the code do not belong in this file.

Read before your first change: [`docs/constitution.md`](./docs/constitution.md).

---

## The project in four lines

Arabic, right-to-left e-learning platform. One repository, three deployables: the student
app (`frontend/student`, the only app under active development), the admin app
(`frontend/admin`, frozen upstream template — see C-07), and a FastAPI backend.

Full orientation: [`docs/README.md`](./docs/README.md).

---

## Workflow — specification first

Behaviour changes follow the loop in [`specs/README.md`](./specs/README.md):

```
issue → spec.md → clarify → plan.md → tasks.md → implement
```

| Command | Does |
| --- | --- |
| `/specify` | Create `specs/<issue>-<slug>/spec.md` from the issue |
| `/clarify` | Resolve every `[NEEDS CLARIFICATION]` marker by asking |
| `/plan` | Write `plan.md` — only when zero markers remain |
| `/tasks` | Write `tasks.md` from the plan |
| `/implement` | Work the checklist in order |

**Exempt from the loop:** dependency bumps, CI config, formatting, docs-only changes.

### Rules that are easy to get wrong

- **Do not skip to code.** A small-looking change still gets a spec. Reviewing a spec is
  cheap; reviewing a wrong implementation is not.
- **Do not guess a missing decision.** Mark it `[NEEDS CLARIFICATION: …]` and stop (C-10).
- **Clear the slice's debt first, in its own commit** (C-11). Behaviour-preserving. Then
  build. Debt outside the slice's path is not your problem right now.
- **Breaking changes are acceptable.** There are no live users; the team retests. Prefer a
  clean break over a compatibility shim.
- **Update the matching document in the same PR** (C-12).

---

## Before you claim something works

The student app currently has **no automated tests and no end-to-end coverage in CI**. Its
Playwright configuration is not wired up. Lint and type-check pass, and that is all.

So: never report a student-app change as verified because CI is green. Say what you
actually ran. If a change cannot be checked, say that too.

What genuinely runs today:

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

Backend tests and admin-app Playwright specs do run in CI.

---

## Repository map

| Path | What |
| --- | --- |
| `docs/` | What the system is. Start at `docs/README.md`. |
| `docs/constitution.md` | Non-negotiable rules. Specs cite these. |
| `docs/adr/` | Why things are built the way they are. Append-only. |
| `specs/` | What a change must achieve, one folder per issue. |
| `frontend/student/` | The product. Feature-sliced under `src/features/`. |
| `frontend/admin/` | Frozen template. Do not touch (C-07). |
| `backend/` | FastAPI, SQLModel, Alembic, managed with `uv`. |

Per-application detail: [student](./frontend/student/docs/README.md) ·
[admin](./frontend/admin/docs/README.md) · [backend](./backend/docs/README.md).

---

## Hard constraints, in short

The full list is the constitution. The ones violated most often:

- **Arabic inline, RTL, no i18n layer** (C-01). "Next" points left.
- **UUIDs everywhere** (C-03). No integer ids.
- **Generated client is the only transport** (C-04). Do not add a `fetch` wrapper.
- **Never edit generated files** (C-05): `src/client/**`, `routeTree.gen.ts`, migrations.
- **Feature slices, one-way layering** (C-06): `components → hooks → api`. No cross-feature
  imports.
- **`@/` alias imports**, `strict` TypeScript, no `any`.
- Commit format `<type>(<scope>): <subject>` — enforced by CI.

### Code you should not copy

`src/features/example/` is described in the docs as the reference implementation. It is
currently **wrong**: it uses the legacy `fetcher` instead of the generated client, imports
by relative path instead of `@/`, types a payload as `any`, and calls an endpoint that does
not exist. Read `src/features/` real slices instead until it is fixed.

Likewise `src/shared/api/mockData.ts` — its export names contradict the domain vocabulary
(`lessons` holds programs, `stages[].lessons` holds books). Never carry those names into
new code (C-02).
