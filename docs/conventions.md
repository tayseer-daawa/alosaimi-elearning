# Conventions

[← Back to docs index](./README.md)

Read once before your first commit.

---

## Commit messages

Enforced by a local git hook **and** by CI.

```
<type>(<scope>): <short description>
```

| | Allowed values |
| --- | --- |
| **type** | `feat` · `fix` · `test` · `bench` · `docs` · `chore` · `refactor` · `perf` |
| **scope** | `backend` · `frontend` · `tools` · `ci` · `common` |

A scope may carry a `/sub` suffix, and most of the history does — the checked pattern is
`\((backend|frontend|tools|ci|common).*\)`, so anything after the base scope passes. Use it
when the change is confined to one part:

```
feat(frontend): wire programs list to ProgramsService
fix(frontend/student): clear stale token on 401
chore(tools/docker): pin the nginx image
docs(common): document the phase-book many-to-many
```

Enable the hook once per clone:

```bash
git config core.hooksPath .githooks
```

---

## Branches

Named after the issue they close:

```
<issue-number>-<area>-<kebab-case-title>

51-frontend-implement-the-auth-api-ingration
50-frontend-implement-the-content-navigation-learning-ui
```

Work with no issue drops the number (`ci-frontend-lint`, `cleanup`). All pull requests
target `main`.

---

## Linting and formatting

**Biome**, not ESLint or Prettier. One command does both:

```bash
cd frontend/student
npm run lint          # biome check --write --unsafe
```

Style, all automatic:

- double quotes, **no semicolons**, 2-space indent
- imports organised automatically

Rules that will actually stop you:

| Rule | Meaning |
| --- | --- |
| `useSelfClosingElements` | `<Box />`, never `<Box></Box>` |
| `noUselessElse` | No `else` after a `return` |
| `noParameterAssign` | Never reassign a function parameter |

Excluded from linting because they are generated: `src/client/**`,
`src/routeTree.gen.ts`, `src/components/ui/**`, `dist/`.

Python side uses `ruff` through `pre-commit` (`uv run pre-commit install`).

---

## TypeScript

- `strict` is on, plus **`noUnusedLocals`** and **`noUnusedParameters`**. A leftover
  variable fails `npm run build`, which type-checks before Vite bundles.
- Import through the `@/` alias, which maps to `src/`:

  ```ts
  import { CustomField } from "@/shared/components/CustomField"   // yes
  import { CustomField } from "../../../shared/components/CustomField"   // no
  ```

---

## Writing UI

### Right-to-left

The product is Arabic. Every page container sets `dir="rtl"`.

- Icons must be chosen for RTL. "Next" points **left** (`MoveLeft`), "previous" points
  **right** (`MoveRight`). Copying an LTR layout gives you backwards arrows.
- Prefer logical spacing over `left`/`right` where Chakra offers it.

### Copy

All user-facing text is Arabic, written inline in the component. **There is no i18n
layer** — do not add one without agreeing it first. Error messages are Arabic too; never
let a raw English API error reach the screen.

### Theme tokens, not hex

Defined in `frontend/student/src/theme.ts`. Full list and usage:
[theming-rtl.md](../frontend/student/docs/theming-rtl.md).

```tsx
<Box color="brand.primary" />     // yes
<Box color="#21605D" />           // no
```

### Responsive

Chakra's object syntax, mobile first, `base` → `lg`:

```tsx
<Heading size={{ base: "xl", lg: "5xl" }} />
```

Several desktop-only headers use `display={{ base: "none", lg: "block" }}`, with a
breadcrumb shown on mobile instead.

---

## Pull requests

- One issue per branch, one branch per pull request.
- **A PR that changes behaviour updates the matching document in the same PR.** Docs are
  part of the change, not a follow-up.
- CI runs: commit-message compliance, frontend lint, backend lint and tests, Playwright,
  a Docker Compose smoke test, and a client-generation drift check.
