# Constitution

[← Back to docs index](./README.md)

The rules every specification, plan and implementation in this repository must satisfy.

This is the **shortest** document here on purpose. It holds only constraints that are
non-negotiable — things a reviewer or an AI agent may not decide to do differently on a
given day. Everything else is guidance and lives in [conventions.md](./conventions.md).

Each article has an ID. Specifications cite them in their Constitution Check section.

> **Amendment process.** Change an article only in a PR that does nothing else, and record
> the reasoning in an [ADR](./adr/README.md). Adding an article is cheap; weakening one is
> not. Never edit an article to match code that already violates it.

---

## Product

### C-01 — Arabic, right-to-left, no i18n layer

All user-facing copy is Arabic, written inline in the component. Every page container sets
`dir="rtl"`. Icons are chosen for RTL: "next" points left, "previous" points right.

There is **no internationalisation layer** and none may be introduced without a superseding
ADR. No raw English API error ever reaches the screen.

### C-02 — Domain vocabulary is fixed

`Program → Phase → Book → Lesson → Question`, as defined in [domain.md](./domain.md). Code,
specs, tests and variable names use these terms. Fixture or legacy names that disagree
(`lessons` meaning programs, `stages[].lessons` meaning books) are debt, never a precedent.

### C-03 — Identifiers are UUIDs

Every entity is keyed by `uuid.UUID`. There are no integer ids in the system. Route params,
query keys and test data use UUID strings.

---

## Architecture

### C-04 — The generated client is the only transport

All HTTP to the backend goes through the generated service classes in `src/client/`.
Hand-written `fetch` wrappers are not added, and existing ones are removed as their callers
are converted. See [ADR 0002](./adr/0002-generated-api-client.md).

### C-05 — Generated code is never hand-edited

`frontend/*/src/client/**`, `src/routeTree.gen.ts` and `backend/app/alembic/` migrations
are produced by tooling. Fix the source and regenerate; never patch the output.

### C-06 — Feature-sliced structure with one-way layering

Frontend code lives in `src/features/<name>/` with the layering from
[ADR 0001](./adr/0001-feature-sliced-frontend.md):

```
api/          repository does REST only, hooks do React Query
hooks/        feature state
components/   render only
routes/       thin — import a screen and mount it
```

Dependencies point one way: `components → hooks → api`. A feature never imports from
another feature; anything shared is hoisted to `src/shared/`.

### C-07 — The admin app is frozen

`frontend/admin` is the unmodified upstream template. It is out of scope for product work
and for this migration. Changes there need their own issue and an explicit decision.

---

## Process

### C-08 — Specification before implementation

Any change to behaviour starts as `specs/<issue>/spec.md`, then `plan.md`, then `tasks.md`,
then code. See [../specs/README.md](../specs/README.md).

Exempt: dependency bumps, CI configuration, formatting, and documentation-only changes.

### C-09 — Every requirement is verifiable

A requirement that cannot be checked by a test, a type, or a lint rule is not a requirement
— it is a preference, and belongs in `conventions.md`. Acceptance criteria are written as
observable behaviour, not implementation description.

### C-10 — Ambiguity blocks planning, not code

Unresolved questions are marked `[NEEDS CLARIFICATION: …]` in the spec. A plan is not
written while any marker remains. Agents do not guess a missing decision; they stop and ask.

### C-11 — Debt in a slice is paid before that slice gains behaviour

Touching a feature slice means clearing its known debt first, in its own commit or PR, with
no behaviour change. Only then does new behaviour land. Debt outside the slice's path never
blocks the work.

There are no live users; breaking changes are acceptable and are retested by the team.

### C-12 — Documentation ships with the change

A PR that changes behaviour, routing, data flow or a convention updates the matching
document in the same PR. Docs are part of the change, not a follow-up.

---

## Known violations

The codebase predates this document and does not satisfy all of it yet. Violations are
tracked, not forgiven — a migration ledger listing them per feature slice is planned as a
follow-up to this document.

Until that ledger exists, treat any code contradicting an article above as debt under
**C-11**, not as a pattern to copy.
