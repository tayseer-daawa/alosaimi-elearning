# Tasks — <feature name>

**Spec:** [spec.md](./spec.md) · **Plan:** [plan.md](./plan.md)
**Created:** YYYY-MM-DD

> Ordered. Each task is small enough to review on its own and cites the requirement it
> serves. `[P]` marks tasks that touch no shared file and may run in parallel.
> A task with no `FR-` reference is either debt (Phase 1) or does not belong here.

---

## Phase 1 — Debt (C-11)

<Behaviour-preserving. Lands before anything below it.>

- [ ] T-001 — <task> · slice `src/features/<name>`
- [ ] T-002 — <task>

## Phase 2 — Contracts and types

- [ ] T-010 — <task> · FR-001
- [ ] T-011 [P] — <task> · FR-002

## Phase 3 — Implementation

- [ ] T-020 — <task> · FR-001
- [ ] T-021 — <task> · FR-002, FR-003

## Phase 4 — Verification

<One task per acceptance criterion in the spec. Names the scenario it proves.>

- [ ] T-030 — <test> · S-1, FR-001
- [ ] T-031 — <test> · S-2, FR-002, FR-003

## Phase 5 — Documentation (C-12)

- [ ] T-040 — Update `<document>` for <what changed>
- [ ] T-041 — Set spec status to Implemented

---

## Coverage

<Every requirement in the spec appears at least once above. Fill this in before starting —
a gap here is a gap in the plan.>

| Requirement | Tasks |
| --- | --- |
| FR-001 | T-010, T-020, T-030 |
| FR-002 | T-011, T-021, T-031 |
| FR-003 | T-021, T-031 |
