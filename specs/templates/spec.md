# Specification — <feature name>

**Issue:** #NNN
**Branch:** `NNN-<area>-<kebab-case-title>`
**Status:** Draft | Clarified | Planned | Implemented
**Created:** YYYY-MM-DD

> Delete every instruction line in angle brackets before committing.
> This document describes **what** and **why**. Naming a file, a library or a component
> here is a mistake — that belongs in `plan.md`.

---

## Summary

<Two or three sentences. What changes for the user, and why it is worth doing.>

## Out of scope

<What a reader might reasonably assume is included but is not. Be explicit — this is the
section that prevents scope drift during implementation.>

- …

---

## User scenarios

<One scenario per meaningful path, happy and unhappy. Observable behaviour only.>

### S-1 — <name>

- **Given** <starting state>
- **When** <the user does this>
- **Then** <this is observable>

### S-2 — <name>

- **Given** …
- **When** …
- **Then** …

---

## Requirements

<Numbered, stable, individually testable. An id is never reused for a different
requirement. Tasks and tests cite these ids.>

| ID | Requirement | Verified by |
| --- | --- | --- |
| FR-001 | The system MUST … | S-1 |
| FR-002 | The system MUST … | S-2 |
| FR-003 | The system MUST NOT … | S-2 |

### Non-functional

| ID | Requirement |
| --- | --- |
| NFR-001 | … |

---

## Open questions

<Every unknown, as a marker. A plan is not written while any remain — see C-10.>

- [NEEDS CLARIFICATION: <question>]

---

## Constitution check

<Which articles of docs/constitution.md constrain this work, and how the requirements
above satisfy them. Name the article, do not just tick it.>

| Article | Relevance |
| --- | --- |
| C-01 Arabic RTL, no i18n | <how this spec respects it> |
| C-03 UUID identifiers | <…> |
| C-04 Generated client only | <…> |

**Conflicts:** <none, or: which article this change strains, and why an ADR is needed.>

---

## Slice debt (C-11)

<Which feature slices this change touches, and what must be cleared in them first. Debt
outside the path of this change is not listed here.>

| Slice | Debt to clear first |
| --- | --- |
| `src/features/<name>` | … |
