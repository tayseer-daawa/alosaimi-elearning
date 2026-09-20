# Development seed

Idempotent local fixtures for student + admin UI work. **Not** part of `prestart` / production.

## Safety

Refuses to run unless:

- `ENVIRONMENT=local`
- Postgres host is `localhost`, `127.0.0.1`, or compose service `db`

`--clean` only deletes seed-owned rows (demo emails + known program/book titles). Never deletes `FIRST_SUPERUSER`.

## Run

```bash
# from repo, with stack up and a reachable DB
cd backend && uv run python -m app.seed
cd backend && uv run python -m app.seed --verbose
cd backend && uv run python -m app.seed --clean          # wipe seed rows, then reseed
cd backend && uv run python -m app.seed --users-only
cd backend && uv run python -m app.seed --content-only   # needs demo users already present

# wrapper
bash backend/scripts/seed-dev.sh --verbose

# inside the backend container (after image includes this package)
docker compose exec backend python -m app.seed --verbose
```

## Demo credentials

| Email | Password | Role |
| --- | --- | --- |
| `teacher@example.com` | `Teacher123!` | teacher |
| `student@example.com` | `Student123!` | student |
| `sara.student@example.com` | `Student123!` | student |
| `khalid.student@example.com` | `Student123!` | student |
| `inactive.student@example.com` | `Student123!` | inactive (login fails) |

Superuser remains whatever `FIRST_SUPERUSER` / `FIRST_SUPERUSER_PASSWORD` are in the root `.env` (created by `initial_data.py` on prestart).

Student app: http://localhost:5174/login  
Admin app: http://localhost:5173/login  

## Content graph

Stable titles (used for idempotency and `--clean`):

- Program: `برنامج القراءة والتجويد`
- Books in phases + orphan `كتاب مستقل (بدون مرحلة)`
- One `ProgramSession` with teacher + active students enrolled
- Session events, one open exam, one unfinished attempt for `student@example.com`

## Layout

| File | Role |
| --- | --- |
| `data.py` | Fixtures (emails, titles) |
| `users.py` / `content.py` | Skip-if-exists seeders via `app.crud` |
| `clean.py` | Opt-in wipe of seed-owned rows |
| `safety.py` | Local-only guards |
| `__main__.py` | CLI entry |
