# Development seed

Idempotent local fixtures for student + admin UI work. **Not** part of `prestart` / production.

Curriculum mirrors Sheikh **صالح بن عبدالله العصيمي**’s public programs (مكتبة الشيخ + Wikipedia program list). Domain notes: `.claude/skills/muhimmat-al-ilm/SKILL.md`.

## Safety

Refuses to run unless:

- `ENVIRONMENT=local`
- Postgres host is `localhost`, `127.0.0.1`, or compose service `db`

`--clean` only deletes seed-owned rows (demo emails + known program/book titles, including legacy titles). Never deletes `FIRST_SUPERUSER`.

## Run

```bash
cd backend && uv run python -m app.seed --verbose
cd backend && uv run python -m app.seed --clean          # wipe seed rows, then reseed
bash backend/scripts/seed-dev.sh --verbose
docker compose exec backend python -m app.seed --clean --verbose
```

After changing program/book titles, always prefer `--clean`.

## Demo credentials

| Email | Password | Role |
| --- | --- | --- |
| `teacher@example.com` | `Teacher123!` | teacher |
| `student@example.com` | `Student123!` | student |
| `sara.student@example.com` | `Student123!` | student |
| `khalid.student@example.com` | `Student123!` | student |
| `inactive.student@example.com` | `Student123!` | inactive (login fails) |

Student app: http://localhost:5174/login  
Admin app: http://localhost:5173/login  

## Seeded programs

| Program | Role in seed | Structure |
| --- | --- | --- |
| **مهمات العلم** | Primary — has cohort session, events, exam + attempt | 3 phases, 15 متون |
| **أصول العلم** | Weekly Riyadh year track | 4 levels (official library) |
| **تمكين مهمات العلم** | Follow-up / Telegram enablement | 3 phases of صلة المهمات |
| **أساس العلم** | Regional touring foundations | 2 phases |
| **جمل العلم** | GCC / abroad intensive (~12 matn) | 2 phases |
| **أحكام الصيام** | Seasonal | 1 phase |
| **أحكام الحج** | Seasonal | 1 phase (his shuruh titles) |

Shared matn titles (e.g. `كتاب التوحيد`) are **one Book row** linked into multiple programs via `PhaseBook`.

**Media sources**

| Role | Where |
| --- | --- |
| Tamkeen catalog (Drive / Telegram packs) | [Drive](https://drive.google.com/drive/folders/1tGKrHmSZFGDBBl2vJx1NqFHRhAuntuJc), [t.me/tamkeen1](https://t.me/tamkeen1) |
| Playable seed PDF/MP3 (HTML5) | IslamHouse CDN — `media.py` (مهمات العلم 1440هـ) |

Drive folders (`01 تعظيم العلم…` …) match seed titles; we do **not** vendor those files into git. Re-running the seed refreshes rows that still use demo hosts (`soundhelix`, `pdfobject`, `example.com`, …).

Orphan (unphased) book: `البيّنة في اقتباس العلم والحذق فيه`.

Only **مهمات العلم** gets a `ProgramSession` + exam demo so the seed stays light.

## Layout

| File | Role |
| --- | --- |
| `data.py` | Fixtures — `SEED_PROGRAMS`, emails, titles |
| `media.py` | Tamkeen catalog constants + IslamHouse playable PDF/MP3 per matn |
| `users.py` / `content.py` | Skip-if-exists seeders via `app.crud` |
| `clean.py` | Opt-in wipe of seed-owned rows |
| `safety.py` | Local-only guards |
| `__main__.py` | CLI entry |
