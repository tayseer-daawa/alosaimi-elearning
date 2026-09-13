# Plan — <feature name>

**Spec:** [spec.md](./spec.md)
**Status:** Draft | Approved
**Created:** YYYY-MM-DD

> Written only after `spec.md` has zero `[NEEDS CLARIFICATION]` markers (C-10).
> This document is **how**. Every choice here traces back to a requirement id.

---

## Technical context

| | |
| --- | --- |
| Applications touched | <student / backend / both> |
| Feature slices | `src/features/<name>`, … |
| API operations used | `<Service>.<operation>` — see [api-map](../../docs/api-map.md) |
| New dependencies | <none, or: name + why nothing already present will do> |

---

## Approach

<The shape of the solution in prose. Enough that a reviewer can disagree with the design
before any code exists. Data flow, where state lives, what is new versus changed.>

### Data flow

<Where data enters, how it is transformed, where it is rendered. A short diagram is
welcome.>

### Contracts

<Types crossing a boundary. Prefer pointing at generated types over restating them.>

---

## Alternatives considered

<What else would work, and why it was not chosen. If a choice here is hard to reverse,
it needs an ADR — say so and link it.>

| Option | Rejected because |
| --- | --- |
| … | … |

---

## Verification strategy

<How each requirement becomes an executable check. Every FR in the spec appears here.>

| Requirement | Checked by | Level |
| --- | --- | --- |
| FR-001 | … | e2e / unit / type / lint |
| FR-002 | … | … |

<If a requirement cannot be checked, it violates C-09 — send it back to the spec.>

---

## Debt cleared first (C-11)

<Ordered. Each item is behaviour-preserving and lands before any new behaviour. Breaking
changes are acceptable — there are no live users — but they are still separated from the
feature work so a review can tell them apart.>

1. …

---

## Constitution check

| Article | How the plan satisfies it |
| --- | --- |
| C-04 Generated client only | … |
| C-06 Feature-sliced layering | … |

**Deviations:** <none, or: what deviates, why, and the ADR that records it.>

---

## Risks

| Risk | Impact | Handling |
| --- | --- | --- |
| … | … | … |
