---
description: Resolve the open questions in a spec by asking, one topic at a time
argument-hint: <issue number>
---

Resolve every `[NEEDS CLARIFICATION]` marker in `specs/$ARGUMENTS-*/spec.md`.

Steps:

1. Read the spec. List the markers.
2. Before asking, check whether the answer is already in the repository — `docs/domain.md`,
   `docs/api-map.md`, an ADR, the backend models, an existing slice. Resolve from evidence
   where you can, and say what evidence you used.
3. Ask the user about what remains. **Short, plain questions, a few at a time.** Offer
   concrete options with their consequences where a choice exists; do not present an
   open-ended essay question.
4. Update the spec in place: remove the marker, fold the answer into the requirement or
   scenario it belonged to. Add a requirement id if the answer created a new obligation.
5. If an answer contradicts `docs/constitution.md`, say so and stop. That needs an ADR, not
   a quiet exception.

Done when zero markers remain. Set Status to `Clarified` and report what changed.
