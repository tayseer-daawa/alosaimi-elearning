# Domain model

[← Back to docs index](./README.md)

The vocabulary every part of the system shares. Source of truth: `backend/app/models/`.

---

## The content chain

Content is strictly hierarchical and strictly ordered.

```
Program  ──▶  Phase  ──▶  Book  ──▶  Lesson  ──▶  Question
برنامج        مرحلة       كتاب       درس         سؤال
```

| Entity | Model file | Notes |
| --- | --- | --- |
| `Program` | `program.py` | Top level. Carries the weekly study schedule. |
| `Phase` | `phase.py` | Ordered inside one program. Unique on `(program_id, order)`. |
| `Book` | `book.py` | **Many-to-many** with phases. May exist without any phase. |
| `Lesson` | `lesson.py` | Ordered inside one book. Unique on `(book_id, order)`. |
| `Question` | `question.py` | Belongs to one lesson. |

### Ordering

Every level below `Program` has an integer `order` field (`>= 0`) with a database unique
constraint. Two phases in the same program can never share an order value. Trust `order`
for sequencing — do not sort by title or by creation date.

### The one-to-many exception

`Phase ↔ Book` is many-to-many, via the `PhaseBook` association table. Every other link in
the chain is one-to-many with a cascade delete. The reason, from the model source: the
platform may host standalone books that are not part of any structured program.

---

## Program scheduling

`Program.days_of_study` is **not a list in the database** — it is a 7-bit integer bitmask.

- Bit 0 = Sunday … bit 6 = Saturday.
- The API converts it for you: `ProgramPublic.days_of_study` is a `list[str]`
  such as `["Monday", "Wednesday"]`.

Frontend consumes the list and never sees the bitmask. Only relevant if you read the
database directly through Adminer.

---

## Lesson material

A `Lesson` carries four content fields, all strings:

| Field | Holds |
| --- | --- |
| `book_part_pdf` | The PDF excerpt for this lesson |
| `book_part_audio` | Recitation of that excerpt |
| `lesson_audio` | The teacher's explanation |
| `explanation_notes` | Written notes |

A `Book` additionally has its own top-level `pdf` and `audio`, both nullable.

---

## Sessions, exams and people

Running alongside the content chain:

- **`ProgramSession`** — a cohort actually running a program. Holds students and teachers
  through two association tables, plus session events, lessons and breaks.
- **`Exam` / `ExamAttempt`** — exams hang off a session; a student accumulates attempts.
- **`User`** — see below.

---

## Users

Names are stored as three separate fields, not one:

| Field | Constraint |
| --- | --- |
| `first_name`, `father_name`, `family_name` | max 30 characters each |
| `email` | unique, indexed, max 255 |
| `password` | 8–128 characters (**backend minimum is 8**) |
| `is_male` | boolean, required — `is_female` is a derived property |
| `reg_num` | a separate UUID from the primary key, deliberately public-facing |

Role flags: `is_active`, `is_admin`, `is_teacher`, `is_superuser`. There is no role
*enum* — check the individual booleans.

---

## Identifiers: everything is a UUID

Every entity uses `uuid.UUID` as its primary key. There are no integer ids anywhere in the
backend.

This matters on the frontend: the student app's mock fixtures still use integers
(`id: 1`), and route params are built from them. Wiring a screen to the real API means its
route params become UUID strings. See
[frontend/student/docs/feature-status.md](../frontend/student/docs/feature-status.md).
