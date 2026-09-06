# Working in this repository

Instructions for any AI agent or new contributor.

This file is a **router**: links only. No rules, no commands, no facts about the code — a
fact parked here goes stale silently, because no reviewer thinks to check it. Everything it
points to is plain Markdown that any tool and any teammate can read and maintain.

---

## Read in this order, before your first change

1. [`docs/constitution.md`](./docs/constitution.md) — the rules that may not be broken.
   Every specification and implementation cites them.
2. [`specs/README.md`](./specs/README.md) — the specification-first workflow every
   behaviour change follows, the command for each step, and what is exempt.
3. [`docs/README.md`](./docs/README.md) — what the system is, and **the index to everything
   else**: domain vocabulary, local setup, conventions, the API map, the per-application
   documents, and the record of why things are built the way they are.
4. [`docs/testing.md`](./docs/testing.md) — what is actually covered, what CI does and does
   not prove, and how to report a change as working.

---

[`CLAUDE.md`](./CLAUDE.md) is the same router for Claude Code and points here.

If something you need is not reachable from [`docs/README.md`](./docs/README.md), add it to
the page that owns it and link it from there — not here.
