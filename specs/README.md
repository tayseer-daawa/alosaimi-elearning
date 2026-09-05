# Specifications

[← Back to docs index](../docs/README.md)

Every behaviour change in this repository starts here. Code is written from a
specification, not the other way round.

`docs/` describes **what the system is today**. `specs/` defines **what a change must
achieve** before it exists. Both are plain Markdown, readable and editable with any tool.

---

## One folder per issue

```
specs/<issue-number>-<kebab-case-title>/
├── spec.md     WHAT and WHY   — requirements, acceptance criteria. No stack, no file names.
├── plan.md     HOW            — technical approach, affected slices, risks.
└── tasks.md    IN WHAT ORDER  — checklist, each task citing a requirement id.
```

The folder number is the **GitHub issue number**, matching the branch convention in
[conventions.md](../docs/conventions.md):

```
issue   #52
branch  52-frontend-implement-the-learning-api-integration
spec    specs/52-learning-api-integration/
```

One issue, one branch, one spec folder, one pull request.

---

## The loop

| Step | Produces | Done when |
| --- | --- | --- |
| 1. Specify | `spec.md` | Requirements numbered, acceptance criteria observable |
| 2. Clarify | `spec.md` | Zero `[NEEDS CLARIFICATION]` markers remain |
| 3. Plan | `plan.md` | Approach chosen, Constitution Check passes |
| 4. Tasks | `tasks.md` | Ordered, each task cites an `FR-` id |
| 5. Implement | code + tests | Every task checked, every acceptance criterion has a test |

Steps 1–4 are cheap to review and cheap to throw away. Step 5 is not. Reviewing a spec is
the point of the process — do not skip ahead to code because the change "looks small".

Slash commands for each step live in `.claude/commands/`.

---

## Rules

- **Requirements are numbered and stable.** `FR-001`, `FR-002`, … Once written, an id is
  never reused for a different requirement. Tests and tasks reference these ids.
- **`spec.md` never names a file, a library or a component.** If you cannot describe the
  requirement without naming `useQuery`, it belongs in `plan.md`.
- **Unknowns are marked, not guessed.** `[NEEDS CLARIFICATION: which error does an expired
  reset token return?]` — planning stops until it is resolved.
- **Every spec passes the Constitution Check.** Cite the articles in
  [constitution.md](../docs/constitution.md) that constrain the work.
- **Specs are not deleted.** A shipped spec stays as the record of what was agreed. Update
  it if the agreed behaviour changes; do not rewrite history to match what was built.

---

## Templates

[spec.md](./templates/spec.md) · [plan.md](./templates/plan.md) · [tasks.md](./templates/tasks.md)

Copy the whole `templates/` set into a new folder to start:

```bash
mkdir -p specs/52-learning-api-integration
cp specs/templates/*.md specs/52-learning-api-integration/
```

---

## Index

No specifications yet. This structure was introduced before the first spec was written;
the first one will be added by the next feature.

| Issue | Specification | Status |
| --- | --- | --- |
| — | — | — |
