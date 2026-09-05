# Project documentation

Start here. Every other document in this repository is linked from this page.

These docs are **tool-neutral**: plain Markdown, written for humans. Update them with
whatever you use — your editor, Cursor, Claude Code, Copilot, or nothing at all.

> **Rule of thumb**
> A fact that changes when the code changes belongs in `docs/`.
> An instruction about *how to work* belongs in `CLAUDE.md` / `AGENTS.md`.
> Keep knowledge out of the AI config files, so any tool and any teammate can maintain it.

---

## What this project is

An Arabic, right-to-left e-learning platform for teaching Islamic fundamentals.
Students enrol in a program (`برنامج`), work through ordered phases, each phase holding
books, each book holding lessons with audio and PDF material.

One repository, three deployables:

| Part | Path | Stack | Port (local) |
| --- | --- | --- | --- |
| Student app | `frontend/student` | React 19, Vite, Chakra UI v3, TanStack Router + Query | 5174 |
| Admin app | `frontend/admin` | same stack, still the upstream template | 5173 |
| Backend API | `backend` | FastAPI, SQLModel, PostgreSQL | 8000 |

---

## Core documents

| Document | Read it when |
| --- | --- |
| [domain.md](./domain.md) | You need to know how programs, phases, books and lessons relate |
| [local-setup.md](./local-setup.md) | You are setting up, or the API is not responding |
| [conventions.md](./conventions.md) | Before your first commit — commit format, branches, lint, RTL rules |
| [api-map.md](./api-map.md) | You need to know which endpoint exists for what |
| [adr/](./adr/) | You are wondering *why* something is built the way it is |

## Per-application documents

| Application | Index |
| --- | --- |
| Student app | [frontend/student/docs/](../frontend/student/docs/README.md) |
| Admin app | [frontend/admin/docs/](../frontend/admin/docs/README.md) |
| Backend | [backend/docs/](../backend/docs/README.md) |

## Upstream template documents

This repository was generated from
[full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template).
Some root-level files still come from it:

- `README.md` — the **template's** readme, not ours. Ignore it.
- [`development.md`](../development.md) — genuinely useful: Docker Compose, ports, pre-commit.
- [`deployment.md`](../deployment.md) — Traefik and production deployment.

---

## Keeping these docs accurate

Docs are part of the change, not a follow-up task. If a pull request changes behaviour,
routing, data flow or a convention, it updates the matching document in the same PR.

Two documents are **generated** and must never be hand-edited — they carry a banner
saying so. Regenerate them instead of correcting them by hand.
