# Backend

[← Back to project docs](../../docs/README.md)

FastAPI · SQLModel · PostgreSQL · Alembic · Pytest, managed with `uv`.
Runs on **port 8000**; Swagger at `/docs`, ReDoc at `/redoc`.

---

## Purpose of this document

Deliberately thin. It exists so a frontend developer can answer backend questions without
reading Python, and so backend developers are not asked to maintain frontend-facing prose
that will rot.

**Two things a frontend developer needs, and where to get them without opening this
directory:**

| Question | Answer |
| --- | --- |
| Which endpoints exist? | [docs/api-map.md](../../docs/api-map.md) |
| What shape is the data? | [docs/domain.md](../../docs/domain.md), and `frontend/student/src/client/types.gen.ts` for exact types |
| What does this endpoint actually return? | Run the stack and read http://localhost:8000/docs |

The generated TypeScript client is derived from the same OpenAPI schema FastAPI serves, so
it is never out of date once `scripts/generate-client.sh` has run.

---

## Layout

```
backend/app/
├── main.py              app factory, CORS, Sentry, router mounting
├── api/
│   ├── main.py          mounts every router under /api/v1
│   ├── deps.py          dependencies: session, current user, permission checks
│   └── routes/          one module per resource
│       books · exams · lessons · login · phases
│       private · programs · questions · sessions · users · utils
├── models/              SQLModel classes — the source of truth for the domain
│       associations · book · common · exam · lesson · phase
│       program · question · session · session_event · user
├── crud/                database access helpers
├── core/                config, security, database engine
├── alembic/             migrations
└── email-templates/
```

Every route is mounted under the `/api/v1` prefix.

---

## Reading a model

`app/models/<entity>.py` holds several classes per entity, and the distinction matters
when you are matching a frontend type to it:

| Suffix | Meaning |
| --- | --- |
| `<Entity>Base` | Shared fields |
| `<Entity>` (`table=True`) | The database table — **not** what the API returns |
| `<Entity>Create` / `<Entity>Update` | Request bodies |
| `<Entity>Public` | **What the API actually returns** |
| `<Entities>Public` | A list response: `{ data, count }` |

The table class and the public class can differ meaningfully. `Program` stores
`days_of_study` as a 7-bit integer while `ProgramPublic` exposes a list of day names.
Always read the `*Public` class when you want to know what arrives on the frontend.

---

## Running it

Covered in [local-setup.md](../../docs/local-setup.md). Short version:

```bash
docker compose watch                 # whole stack
# or, natively:
cd backend && fastapi dev app/main.py
```

Backend-specific tooling — tests, migrations, `uv` usage — is in
[backend/README.md](../README.md), which came with the template and is still accurate.

---

## After changing the schema

Regenerate both frontend clients, or the frontends will silently drift:

```bash
./scripts/generate-client.sh
```

CI runs the same check on pull requests.

---

## Open backend questions affecting the frontend

| Issue | Why the frontend cares |
| --- | --- |
| #68 — token revocation and refresh | The student app has no refresh flow and cannot revoke on logout. See [ADR 0003](../../docs/adr/0003-auth-token-in-localstorage.md). |
| #66 — password complexity | The signup wizard validates length only, and at 6 rather than the API's 8. |
| #69 — remove the private API | `PrivateService` is generated into both clients. Do not build on it. |
| #67 — plaintext password in the welcome email | Affects the signup flow's messaging. |
