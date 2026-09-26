# Architecture decision records

[← Back to docs index](../README.md)

An ADR is a short note recording a decision that shaped the codebase: **what we chose,
what else we considered, and why**. One file per decision.

They exist to answer the question you will ask yourself in three months — *"why is it
built like this?"* — without having to reconstruct the reasoning from git history.

## Rules

- Write one when a choice is hard to reverse, or when the code looks odd without the
  reason. Not for routine work.
- Keep it under a page.
- **ADRs are append-only.** When a decision changes, write a new ADR that supersedes the
  old one and mark the old one accordingly. Never rewrite history.

## Records

| # | Decision | Status |
| --- | --- | --- |
| [0001](./0001-feature-sliced-frontend.md) | Feature-sliced structure for the student app | Accepted |
| [0002](./0002-generated-api-client.md) | Generate the API client from OpenAPI | Accepted |
| [0003](./0003-auth-token-in-localstorage.md) | Store the auth token in localStorage | Accepted, with known gaps |

## Template

```markdown
# NNNN — Title

**Status:** Proposed | Accepted | Superseded by ADR-NNNN
**Date:** YYYY-MM-DD

## Context
What forced a decision.

## Decision
What we chose.

## Alternatives considered
What we rejected, and why.

## Consequences
What this makes easy, what it makes hard, what to watch out for.
```
