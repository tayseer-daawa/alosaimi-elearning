# Local setup

[← Back to docs index](./README.md)

Two ways to run this. Pick based on whether you need real API responses.

---

## Prerequisites

- **Node 24** — an `.nvmrc` is present in both frontends (`nvm use` or `fnm use`).
- **Docker Desktop** — only for the full stack.
- **uv** — only if you touch the backend or run `pre-commit`.

First thing after cloning, or commits will be rejected by CI instead of locally:

```bash
git config core.hooksPath .githooks
```

---

## Environment files

`.env` files are **not tracked**. Create them from the templates:

```bash
cp .env.example .env
cp frontend/student/.env.example frontend/student/.env
cp frontend/admin/.env.example frontend/admin/.env
```

The student app reads exactly one variable that matters:

| Variable | Default | Used by |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000` | `src/main.tsx` → `OpenAPI.BASE`, i.e. the whole generated client |

There is a second, legacy variable, `VITE_API_BASE`, read by `src/shared/api/fetcher.tsx`.
Only the `example` feature uses it. See
[ADR 0002](./adr/0002-generated-api-client.md).

---

## Option A — student app alone

Fastest loop. Everything renders except the four screens that call the API
(login, signup, forgot password, reset password), which need a backend.

```bash
cd frontend/student
nvm use            # → 24
npm install        # first time only
npm run dev        # http://localhost:5174
```

The dev server writes `src/routeTree.gen.ts` on start. If routing behaves strangely after
you add or rename a route file, stop and restart the dev server.

---

## Option B — the full stack

```bash
docker compose watch
```

| Service | URL | What it is |
| --- | --- | --- |
| Backend | http://localhost:8000 | API. `/docs` = Swagger, `/redoc` = ReDoc |
| Admin app | http://localhost:5173 | |
| Student app | http://localhost:5174 | |
| Adminer | http://localhost:8080 | Browse the database |
| MailCatcher | http://localhost:1080 | **Where password-reset emails land locally** |
| Traefik | http://localhost:8090 | Proxy dashboard |

First boot takes a minute while the backend waits for Postgres and runs migrations.
Watch it with `docker compose logs backend`.

### Hybrid: containers for everything except the app you are editing

Each service binds the same port it would use natively, so you can swap one out:

```bash
docker compose stop frontend-student
cd frontend/student && npm run dev     # same port, now with hot reload
```

Same trick for the backend:

```bash
docker compose stop backend
cd backend && fastapi dev app/main.py
```

---

## Staging

There is a staging API. It is **not** the default in `.env.example` — you opt in by
setting `VITE_API_URL` in your local `.env`.

> **Known issue (2026-09):** the staging host resolves but does not answer on port 443.
> If auth requests hang with no response, this is why. Run the backend locally instead.

---

## Regenerating the API client

`frontend/*/src/client/` is generated and must never be hand-edited. After any backend
schema change:

```bash
./scripts/generate-client.sh
```

It dumps the OpenAPI schema from `app.main`, copies it into both frontends, and runs
`npm run generate-client` (`@hey-api/openapi-ts`) in each. Requires the backend Python
environment to be importable. CI runs the same thing on pull requests.

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Auth requests hang forever | `VITE_API_URL` points at staging, which is down. Point it at localhost. |
| `404` on every API call | Backend not running, or `VITE_API_URL` missing the port. |
| Route params are `undefined` | `routeTree.gen.ts` is stale — restart the dev server. |
| Build fails on an unused variable | Intentional. `noUnusedLocals` is on; `npm run build` type-checks before bundling. |
| Commit rejected | Message is not in the required format. See [conventions.md](./conventions.md). |
