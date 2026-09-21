# Student frontend — API wiring & production readiness

Honest status of `frontend/student`: what talks to the real FastAPI backend, what stays client-local, and what is still missing before calling the SPA production-ready.

Companion docs:

- Course player UX / deferred PDF work → [student-learning-experience.md](./student-learning-experience.md)
- Domain vocabulary → [`.claude/skills/muhimmat-al-ilm/SKILL.md`](../.claude/skills/muhimmat-al-ilm/SKILL.md)
- Agent conventions → [`AGENTS.md`](../AGENTS.md)

**Verdict: Beta-partial — not production-ready as a full product.**  
Catalog + auth + course player are on the real API. Progress, sessions, exams, and account are not.

---

## Summary matrix

| Area | Status | Notes |
| --- | --- | --- |
| Login / signup / password reset | Wired | JWT in `localStorage`; no refresh token |
| Programs → phases → books → lessons | Wired | Generated OpenAPI client + feature repos |
| Course PDF / audio / teacher notes | Wired | From lesson/book API fields |
| 401 / 403 handling | Wired | Clear session → `/welcome` |
| Student notes / playback / completion / continue path / browse badges | Local only | `localStorage` — not cross-device |
| ProgramSession enrollment | Unwired | Client SDK exists; no student UX |
| Exams / questions / attempts | Unwired | Client SDK exists; no student UX |
| Account / profile edit / help | Partial / static | Placeholder support email |
| `mockData.ts` | Dead orphan | File exists; **zero imports** |

`AGENTS.md` still says home/programs/phases/books import `mockData` — that is **stale**. Those features use repos + the generated client.

---

## 1. Mock / placeholder inventory

### Dead mock module

| Path | Status |
| --- | --- |
| `frontend/student/src/shared/api/mockData.ts` | Exports sample `lessons` / `stages` / `books`. **Unused.** Safe to delete once docs/rules stop referencing it. |

### Demo / placeholder still in the UI

| Path | What |
| --- | --- |
| `features/account/components/HelpScreen.tsx` | Hardcoded `support@example.com` |
| `features/account/components/CopyrightScreen.tsx` | Static in-file legal sections (not CMS/API) |
| `features/account/components/ProfileScreen.tsx` | Name/email from `student_profile` cache; email-notify toggle only in `localStorage` — no `PATCH` user |
| `features/example/**` + route `/example` | Scaffold; `exampleRepo` hits non-existent `/api/examples` |
| `features/course/components/AudioPlayer.tsx` (`isPlayableSrc`) | Rejects `example.com`, `soundhelix.com`, `pdfobject.com` so seed demo hosts do not “play” |

### Client-only domain data (not mocks, not API)

| Path | Storage / behavior |
| --- | --- |
| `LessonNotes.tsx` | `lesson_notes:{lessonId}` — UI: «تم الحفظ محلياً» (debounced write) |
| `lib/lessonProgress.ts` | `lesson_playback:`, `lesson_completed:`, `audio_player_volume` |
| `lib/notesPanePreference.ts` | Notes pane open/closed preference |
| Teacher explanation | API `lesson.explanation_notes`; **student** notes stay local |

### Continue learning (device-local)

| Path | Behavior |
| --- | --- |
| `features/course/lib/lessonProgress.ts` | `continue_learning_path` stores last opened `{ programId, phaseId, bookId, courseId }` |
| `features/course/components/CourseScreen.tsx` | Writes that path whenever route params are present |
| `features/home/api/continueLearning.ts` | Prefers last path; falls back to first catalog leaf |

Still not enrollment-aware or cross-device — same beta tradeoff as notes/playback.

---

## 2. Real API wiring by feature

| Feature | Pattern | Client / repo | Wired? |
| --- | --- | --- | --- |
| **programs** | Repo + React Query | `ProgramsService` | Yes — list + detail |
| **phases** | Repo + hooks | `PhasesService` | Yes — by program, detail, books-by-phase |
| **books** (+ lessons) | Repos + hooks | `BooksService`, `LessonsService` | Yes |
| **course** | Consumes books/phases/programs hooks | Same | Yes for lesson metadata + PDF/audio URLs; notes/progress local |
| **home** | `usersRepo` + programs + continue heuristic | `UsersService` + catalog repos | User + catalog yes; continue = heuristic |
| **login** | Wizard hook → client | `LoginService.loginAccessToken`, `UsersService.readUserMe` | Yes |
| **signup** | Wizard hook → client | `UsersService.registerUser` | Yes (then navigate to `/login`; no auto-login) |
| **forget-password** | Hooks → client | `LoginService.recoverPassword` / `resetPassword` | Yes |
| **welcome** | Static CTAs | None | N/A |
| **account** | Static / localStorage | No repo | Not API-backed |
| **example** | `exampleRepo` → `fetcher` | Fake `/api/examples` | Scaffold only |

**`fetcher`:** used by `example` only (`shared/api/fetcher.tsx`). Production features use the generated OpenAPI client (`src/client`).

**Generated client present but unused in student UI:** `SessionsService`, `ExamsService`, `QuestionsService`, and related exam-attempt APIs — no feature folders call them yet.

---

## 3. Auth & session

### How it works today

| Concern | Implementation |
| --- | --- |
| Login | `useLoginWizard` → JWT → `localStorage.access_token` → `/users/me` → `student_profile` cache |
| Signup | `registerUser` then `/login` |
| Logout | `shared/lib/logout.ts` — clear localStorage + Query cache + hard nav to `/welcome`; **no server revoke** |
| Token inject | `main.tsx` request interceptor: `Authorization: Bearer …` |
| 401 / 403 | OpenAPI response interceptor + React Query `onError` → clear auth + `/welcome` (skips redirect on public auth paths) |
| Route gate | `routes/_layout.tsx` `beforeLoad`: token **presence** vs `publicRoutes` |

### Public vs authenticated routes

**Public:** `/login`, `/signup`, `/welcome`, `/forget-password`, `/reset-password`  

**Everything else** (home, programs, course player, `/example`, account) requires a token string in `localStorage`.

Backend GETs for programs/phases/books/lessons are marked guest-friendly in the API, but the **SPA does not expose guest browsing**.

### Auth gaps

- **No refresh token** — single access JWT until expiry (backend default ~8 days)
- **Session = localStorage only** — XSS-sensitive; not httpOnly cookies
- **No enrollment / ProgramSession checks** in the student app — any logged-in user can open catalog lesson URLs if the API allows
- **`beforeLoad` does not validate the JWT** — invalid token fails on first API call, then redirect
- Profile snapshot can lag `/users/me` (home uses live `useCurrentUser`; profile screen uses cache)

---

## 4. Course / learning path

```
/programs
  → /$programId/phases
    → …/books/$bookId
      → …/courses/$courseId   (= lesson UUID)
```

| Layer | Source |
| --- | --- |
| Programs / phases / books / lesson list & metadata | API |
| PDF | API: `lesson.book_part_pdf` or fallback `book.pdf` |
| Audio | API: `lesson.lesson_audio` |
| Teacher notes | API: `lesson.explanation_notes` |
| Student notes | **localStorage only** |
| Playback position / completion / volume | **localStorage only** |
| Continue learning | Last opened lesson on this device (`continue_learning_path`); else first catalog leaf |

Seed or staging media may still point at demo hosts; the player **refuses** those URLs. Production content must use real HTTPS media on lesson/book rows.

---

## 5. Account / profile / help

| Screen | Status |
| --- | --- |
| Profile | Read-only from `getStudentProfile()`; notify pref local-only; **no** `UsersService.updateUserMe` |
| Help | Static copy + `support@example.com` |
| Copyright | Static copy |
| App menu | Nav + logout; greeting from cached profile |

---

## 6. Environment & deploy config

| Variable | Role |
| --- | --- |
| **`VITE_API_URL`** | Required. Set as `OpenAPI.BASE` in `main.tsx`. **Throws in production builds** if missing. |
| `VITE_API_BASE` | Deprecated alias for `fetcher` only |
| `MAILCATCHER_HOST` | E2E / local mail — not used at runtime by the SPA |

**Local / Docker notes**

- Compose override often builds the student image with `VITE_API_URL=http://localhost:8000` (browser talks to the host)
- `VITE_API_URL` is baked at **Docker build** time (`ARG` → `npm run build`)
- Playwright `baseURL`: `http://localhost:5174`
- `fetcher` falls back to `http://localhost:8000` if both env vars are unset (dev convenience; prod still throws in `main.tsx`)

No other Vite env vars are declared in `vite-env.d.ts`.

---

## 7. What E2E already covers

Under `frontend/student/tests/` (against a live stack on **5174**):

- Auth flows (login / signup / reset where applicable)
- Course lesson player: PDF/notes chrome, audio controls, shortcuts, resume/volume persistence seeding, scrub behavior, drawer, navigation

That is enough confidence for a **beta learning demo**, not a claim that the full product graph (sessions, exams, synced progress) works end-to-end.

---

## 8. Blocking gaps vs nice-to-haves

### Blocking before “production-ready product”

1. **Session enrollment / access control UX** — wire or deliberately productize open catalog
2. **Server-side progress, notes, completion** — localStorage is not multi-device
3. **Exams / questions / attempts UI** (if those are in the launch scope)
4. **Account completeness** — profile edit; real support contact (not `example.com`)
5. **Remove or gate `/example`** and delete orphan `mockData.ts`
6. **Real media URLs** in content — demo hosts are blocked in the player
7. Call out **auth model** (no refresh, localStorage JWT, non-revoking logout) in the security review

### Nice-to-haves

- Real “continue learning” from **server** progress / enrollment (client last-path is beta)
- Guest browse aligned with guest API (or drop guest-readable API pretence in the SPA)
- Wire `updateUserMe` + notification prefs to the backend
- Align `AGENTS.md` / `.cursor/rules/frontend-student.mdc` with current repos (no `mockData` claim)
- Broader Playwright coverage beyond auth + course-lesson

### What is already solid for beta

- Programs → phases → books → lessons via generated client
- Login / signup / password recovery against real endpoints
- Course player loads PDF / audio / explanation from API fields
- 401/403 session clear
- Playwright on student port **5174** for auth + course specs

---

## 9. Recommended readiness checklist

Use this as a go / no-go before a production student deploy:

- [ ] `VITE_API_URL` points at the production API at **image build** time
- [ ] Seed/admin content uses real HTTPS PDF and audio URLs (not blocked demo hosts)
- [ ] Decision documented: open catalog vs enrollment-gated lessons
- [ ] Decision documented: local-only notes/progress OK for v1, or API sync required
- [ ] Help / support contact is a real address
- [ ] `/example` removed or unreachable in production builds
- [ ] `mockData.ts` deleted or clearly marked dead
- [ ] Smoke: register → login → browse → play lesson → logout on staging
- [ ] Playwright course + auth suite green against staging-like stack

---

## Related

- [student-learning-experience.md](./student-learning-experience.md) — player UX, deferred PDF features, feature catalog
- Backend API exploration: `http://localhost:8000/docs` (manual only; proof lives in `backend/tests/`)
